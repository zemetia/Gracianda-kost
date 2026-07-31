// Server-only: Prisma-backed domain service.
// Owns the one rule that keeps the whole tenant/room model consistent:
// a Room may have at most one ACTIVE Contract at a time.

import { firstPeriod } from '@/lib/billing';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import type {
  CheckoutContractInput,
  NewContractInput,
  RenewContractInput,
  TransferRoomInput,
} from '@/lib/validations';

type Tx = Prisma.TransactionClient;

// Atomic per-year sequence per-property via UPSERT ... RETURNING — race-safe under
// concurrent contract creation without needing a native Postgres sequence.
async function generateContractCode(tx: Tx, propertyId: string): Promise<string> {
  const property = await tx.property.findUnique({
    where: { id: propertyId },
    select: { code: true },
  });
  const prefix = property?.code || 'RENT';

  const year = new Date().getFullYear();
  const yy = String(year).slice(-2);

  const rows = await tx.$queryRaw<{ lastValue: number }[]>`
    INSERT INTO "contract_sequences" ("propertyId", "year", "lastValue")
    VALUES (${propertyId}, ${year}, 1)
    ON CONFLICT ("propertyId", "year")
    DO UPDATE SET "lastValue" = "contract_sequences"."lastValue" + 1
    RETURNING "lastValue"
  `;

  const seq = rows[0]?.lastValue ?? 1;
  return `${prefix}-${yy}${String(seq).padStart(4, '0')}`;
}

interface InsertContractData {
  tenantId: string;
  roomId: string;
  rentPrice: number;
  deposit?: number | undefined;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  billingInterval: number;
  startDate: Date;
  endDate?: Date | undefined;
  notes?: string | undefined;
  occupants: { fullName: string; relation?: string | undefined }[];
  previousContractId?: string | undefined;
}

/**
 * The single write path for "a new contract starts here" — used by sewa baru,
 * perpanjangan, and pindah kamar alike, so all three produce identical data:
 * a room-availability check, a generated code, and the first invoice.
 */
async function insertContract(tx: Tx, data: InsertContractData) {
  const room = await tx.room.findUnique({ where: { id: data.roomId } });
  if (!room) throw new Error('Kamar tidak ditemukan');

  const activeOnRoom = await tx.contract.findFirst({
    where: { roomId: data.roomId, status: 'ACTIVE' },
  });
  if (activeOnRoom) throw new Error('Kamar ini sudah memiliki kontrak aktif');

  const contractCode = await generateContractCode(tx, room.propertyId);

  const contract = await tx.contract.create({
    data: {
      contractCode,
      tenantId: data.tenantId,
      roomId: data.roomId,
      rentPrice: data.rentPrice,
      deposit: data.deposit,
      billingCycle: data.billingCycle,
      billingInterval: data.billingInterval,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes,
      previousContractId: data.previousContractId,
      occupants: { create: data.occupants },
    },
    include: { tenant: true, room: true },
  });

  // First invoice, raised upfront for exactly one billing period. Later
  // periods come from paymentService.generateMonthlyInvoices().
  const period = firstPeriod({
    billingCycle: data.billingCycle,
    billingInterval: data.billingInterval,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
  });

  await tx.payment.create({
    data: {
      contractId: contract.id,
      periodStart: period.start,
      periodEnd: period.end,
      periodMonth: period.start.getMonth() + 1,
      periodYear: period.start.getFullYear(),
      rentAmount: data.rentPrice,
      amountDue: data.rentPrice,
      dueDate: period.start,
    },
  });

  return contract;
}

/** Ends a contract, recording *why* — reports read very differently per reason. */
function endContract(
  tx: Tx,
  id: string,
  actualEndDate: Date,
  endReason: 'CHECKOUT' | 'TRANSFER' | 'RENEWAL' | 'CANCELLED',
  extra: Prisma.ContractUpdateInput = {},
) {
  return tx.contract.update({
    where: { id },
    data: { status: 'ENDED', actualEndDate, endReason, ...extra },
  });
}

export const contractService = {
  list(propertyId?: string) {
    return prisma.contract.findMany({
      where: propertyId ? { room: { propertyId } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { tenant: true, room: { include: { floor: true, property: true } } },
    });
  },

  getById(id: string) {
    return prisma.contract.findUnique({
      where: { id },
      include: {
        tenant: true,
        room: { include: { floor: true, property: true } },
        occupants: true,
        previousContract: { select: { id: true, contractCode: true } },
        nextContract: { select: { id: true, contractCode: true } },
      },
    });
  },

  getActiveByRoom(roomId: string) {
    return prisma.contract.findFirst({ where: { roomId, status: 'ACTIVE' } });
  },

  /** ACTIVE contracts whose target end date falls inside the next `days` days. */
  listEndingSoon(days: number, propertyId?: string) {
    const today = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);

    return prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: today, lte: limit },
        ...(propertyId ? { room: { propertyId } } : {}),
      },
      orderBy: { endDate: 'asc' },
      include: { tenant: true, room: { include: { floor: true, property: true } } },
    });
  },

  /**
   * Creates a new contract for either an existing tenant (`tenantId` set) or
   * a brand-new one (`tenant` payload set). If the resolved tenant already
   * has an ACTIVE contract elsewhere, it is auto-closed in the same
   * transaction — this is what makes "sewa ulang" work without a separate
   * code path from "sewa baru".
   */
  async create(input: NewContractInput) {
    return prisma.$transaction(async (tx) => {
      let tenantId = input.tenantId;
      if (!tenantId) {
        if (!input.tenant) throw new Error('Data penyewa wajib diisi');
        const tenant = await tx.tenant.create({
          data: { ...input.tenant, email: input.tenant.email || null },
        });
        tenantId = tenant.id;
      }

      const previousActive = await tx.contract.findFirst({
        where: { tenantId, status: 'ACTIVE' },
      });
      if (previousActive) {
        await endContract(tx, previousActive.id, input.startDate, 'TRANSFER');
      }

      return insertContract(tx, {
        tenantId,
        roomId: input.roomId,
        rentPrice: input.rentPrice,
        deposit: input.deposit,
        billingCycle: input.billingCycle,
        billingInterval: input.billingInterval,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes,
        occupants: input.occupants,
        previousContractId: previousActive?.id,
      });
    });
  },

  /**
   * "Perpanjang" — same tenant, same room, next term. Carries the occupants
   * over so the admin does not retype them, and links both contracts so the
   * tenant's timeline reads as one continuous stay.
   */
  async renew(id: string, input: RenewContractInput) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.contract.findUniqueOrThrow({
        where: { id },
        include: { occupants: true },
      });
      if (current.status !== 'ACTIVE') throw new Error('Hanya kontrak aktif yang bisa diperpanjang');

      await endContract(tx, id, input.startDate, 'RENEWAL');

      return insertContract(tx, {
        tenantId: current.tenantId,
        roomId: current.roomId,
        rentPrice: input.rentPrice,
        deposit: input.deposit ?? current.deposit?.toNumber(),
        billingCycle: input.billingCycle,
        billingInterval: input.billingInterval,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes,
        occupants: current.occupants.map((occupant) => ({
          fullName: occupant.fullName,
          relation: occupant.relation ?? undefined,
        })),
        previousContractId: id,
      });
    });
  },

  /**
   * "Pindah Kamar" — same tenant, different room, from `moveDate`. One
   * transaction so the old room is never left occupied by a ghost contract.
   */
  async transferRoom(id: string, input: TransferRoomInput) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.contract.findUniqueOrThrow({
        where: { id },
        include: { occupants: true },
      });
      if (current.status !== 'ACTIVE') throw new Error('Hanya kontrak aktif yang bisa dipindahkan');
      if (current.roomId === input.roomId) throw new Error('Kamar tujuan sama dengan kamar saat ini');

      await endContract(tx, id, input.startDate, 'TRANSFER');

      return insertContract(tx, {
        tenantId: current.tenantId,
        roomId: input.roomId,
        rentPrice: input.rentPrice,
        deposit: input.deposit ?? current.deposit?.toNumber(),
        billingCycle: input.billingCycle,
        billingInterval: input.billingInterval,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes,
        occupants: current.occupants.map((occupant) => ({
          fullName: occupant.fullName,
          relation: occupant.relation ?? undefined,
        })),
        previousContractId: id,
      });
    });
  },

  /**
   * "Check-out" — the tenant actually leaves. Settles the deposit (refund is
   * derived, never typed, so it can't disagree with the deduction) and turns a
   * reported room damage into a MaintenanceRecord in the same transaction.
   */
  async checkout(id: string, input: CheckoutContractInput) {
    return prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUniqueOrThrow({ where: { id } });
      if (contract.status !== 'ACTIVE') throw new Error('Kontrak ini sudah tidak aktif');

      const deposit = contract.deposit?.toNumber() ?? 0;
      const deduction = Math.min(input.depositDeduction ?? 0, deposit);
      const refunded = Math.max(deposit - deduction, 0);

      const updated = await endContract(tx, id, input.actualEndDate, 'CHECKOUT', {
        depositDeduction: deduction,
        depositRefunded: refunded,
        depositNote: input.depositNote,
      });

      if (input.damageNote) {
        const room = await tx.room.findUniqueOrThrow({
          where: { id: contract.roomId },
          select: { propertyId: true },
        });
        await tx.maintenanceRecord.create({
          data: {
            scope: 'ROOM',
            propertyId: room.propertyId,
            roomId: contract.roomId,
            category: 'Kerusakan saat check-out',
            date: input.actualEndDate,
            cost: input.damageCost,
            notes: input.damageNote,
          },
        });
      }

      return updated;
    });
  },

  cancel(id: string) {
    return prisma.contract.update({
      where: { id },
      data: { status: 'CANCELLED', endReason: 'CANCELLED' },
    });
  },
};
