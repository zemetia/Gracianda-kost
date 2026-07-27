// Server-only: Prisma-backed domain service.
// Owns the one rule that keeps the whole tenant/room model consistent:
// a Room may have at most one ACTIVE Contract at a time.

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { CloseContractInput, NewContractInput } from '@/lib/validations';

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
      include: { tenant: true, room: { include: { floor: true, property: true } }, occupants: true },
    });
  },

  getActiveByRoom(roomId: string) {
    return prisma.contract.findFirst({ where: { roomId, status: 'ACTIVE' } });
  },

  /**
   * Creates a new contract for either an existing tenant (`tenantId` set) or
   * a brand-new one (`tenant` payload set). If the resolved tenant already
   * has an ACTIVE contract elsewhere, it is auto-closed in the same
   * transaction — this is what makes "pindah kamar" and "sewa ulang" work
   * without a separate code path from "sewa baru".
   */
  async create(input: NewContractInput) {
    return prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: input.roomId } });
      if (!room) throw new Error('Kamar tidak ditemukan');

      const activeOnRoom = await tx.contract.findFirst({
        where: { roomId: input.roomId, status: 'ACTIVE' },
      });
      if (activeOnRoom) throw new Error('Kamar ini sudah memiliki kontrak aktif');

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
        await tx.contract.update({
          where: { id: previousActive.id },
          data: { status: 'ENDED', actualEndDate: input.startDate },
        });
      }

      const contractCode = await generateContractCode(tx, room.propertyId);

      const contract = await tx.contract.create({
        data: {
          contractCode,
          tenantId,
          roomId: input.roomId,
          rentPrice: input.rentPrice,
          deposit: input.deposit,
          billingCycle: input.billingCycle,
          billingInterval: input.billingInterval,
          startDate: input.startDate,
          endDate: input.endDate,
          notes: input.notes,
          occupants: { create: input.occupants },
        },
        include: { tenant: true, room: true },
      });

      // Calculate initial invoice amount
      let amountDue = input.rentPrice;
      let duration = 1;
      if (input.billingCycle === 'DAILY') {
        if (input.endDate) {
          const diffTime = Math.abs(input.endDate.getTime() - input.startDate.getTime());
          duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (duration < 1) duration = 1;
        }
        amountDue = input.rentPrice * duration;
      } else if (input.billingCycle === 'WEEKLY') {
        if (input.endDate) {
          const diffTime = Math.abs(input.endDate.getTime() - input.startDate.getTime());
          const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          duration = Math.ceil(totalDays / 7);
          if (duration < 1) duration = 1;
        }
        amountDue = input.rentPrice * duration;
      }

      // Generate the initial payment record (upfront)
      await tx.payment.create({
        data: {
          contractId: contract.id,
          periodMonth: input.startDate.getMonth() + 1,
          periodYear: input.startDate.getFullYear(),
          amountDue,
          dueDate: input.startDate,
        },
      });

      return contract;
    });
  },

  close(id: string, data: CloseContractInput) {
    return prisma.contract.update({
      where: { id },
      data: { status: 'ENDED', actualEndDate: data.actualEndDate },
    });
  },

  cancel(id: string) {
    return prisma.contract.update({ where: { id }, data: { status: 'CANCELLED' } });
  },
};
