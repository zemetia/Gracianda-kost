// Server-only: Prisma-backed domain service. Import only from Server
// Components, Server Actions, or Route Handlers — never from 'use client' files.

import { prisma } from '@/lib/prisma';
import { generateRoomNumbers } from '@/lib/room-template';
import type { DuplicateRoomInput, RoomInput } from '@/lib/validations';

export const roomService = {
  list(propertyId?: string) {
    return prisma.room.findMany({
      where: propertyId ? { propertyId } : undefined,
      include: {
        property: true,
        floor: true,
        roomType: true,
        facilities: { include: { facility: true } },
        contracts: { where: { status: 'ACTIVE' }, take: 1 },
        prices: true,
      },
      orderBy: [{ floor: { order: 'asc' } }, { number: 'asc' }],
    });
  },

  getById(id: string) {
    return prisma.room.findUnique({
      where: { id },
      include: {
        property: true,
        floor: true,
        roomType: { include: { facilities: { include: { facility: true } } } },
        facilities: { include: { facility: true } },
        prices: true,
      },
    });
  },

  async create(data: RoomInput) {
    const {
      facilityIds,
      priceDaily,
      priceWeekly,
      priceQuarterly,
      priceSemiAnnual,
      priceYearly,
      ...roomData
    } = data;

    return prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          ...roomData,
          floorId: roomData.floorId || null,
          roomTypeId: roomData.roomTypeId || null,
          facilities: {
            create: facilityIds.map((facilityId) => ({ facilityId })),
          },
        },
      });

      // Upsert monthly default price
      await tx.roomPrice.create({
        data: {
          roomId: room.id,
          billingCycle: 'MONTHLY',
          interval: 1,
          price: roomData.price,
        },
      });

      // Create optional price tiers
      const priceTiers = [
        { billingCycle: 'DAILY' as const, interval: 1, val: priceDaily },
        { billingCycle: 'WEEKLY' as const, interval: 1, val: priceWeekly },
        { billingCycle: 'MONTHLY' as const, interval: 3, val: priceQuarterly },
        { billingCycle: 'MONTHLY' as const, interval: 6, val: priceSemiAnnual },
        { billingCycle: 'YEARLY' as const, interval: 1, val: priceYearly },
      ];

      for (const tier of priceTiers) {
        if (tier.val && tier.val > 0) {
          await tx.roomPrice.create({
            data: {
              roomId: room.id,
              billingCycle: tier.billingCycle,
              interval: tier.interval,
              price: tier.val,
            },
          });
        }
      }

      return room;
    });
  },

  async update(id: string, data: RoomInput) {
    const {
      facilityIds,
      priceDaily,
      priceWeekly,
      priceQuarterly,
      priceSemiAnnual,
      priceYearly,
      ...roomData
    } = data;

    return prisma.$transaction(async (tx) => {
      await tx.roomFacility.deleteMany({ where: { roomId: id } });
      const room = await tx.room.update({
        where: { id },
        data: {
          ...roomData,
          floorId: roomData.floorId || null,
          roomTypeId: roomData.roomTypeId || null,
          facilities: {
            create: facilityIds.map((facilityId) => ({ facilityId })),
          },
        },
      });

      // Upsert monthly default price
      await tx.roomPrice.upsert({
        where: {
          roomId_billingCycle_interval: {
            roomId: id,
            billingCycle: 'MONTHLY',
            interval: 1,
          },
        },
        update: {
          price: roomData.price,
          isActive: true,
        },
        create: {
          roomId: id,
          billingCycle: 'MONTHLY',
          interval: 1,
          price: roomData.price,
        },
      });

      // Update optional price tiers
      const priceTiers = [
        { billingCycle: 'DAILY' as const, interval: 1, val: priceDaily },
        { billingCycle: 'WEEKLY' as const, interval: 1, val: priceWeekly },
        { billingCycle: 'MONTHLY' as const, interval: 3, val: priceQuarterly },
        { billingCycle: 'MONTHLY' as const, interval: 6, val: priceSemiAnnual },
        { billingCycle: 'YEARLY' as const, interval: 1, val: priceYearly },
      ];

      for (const tier of priceTiers) {
        if (tier.val && tier.val > 0) {
          await tx.roomPrice.upsert({
            where: {
              roomId_billingCycle_interval: {
                roomId: id,
                billingCycle: tier.billingCycle,
                interval: tier.interval,
              },
            },
            update: {
              price: tier.val,
              isActive: true,
            },
            create: {
              roomId: id,
              billingCycle: tier.billingCycle,
              interval: tier.interval,
              price: tier.val,
            },
          });
        } else {
          await tx.roomPrice.updateMany({
            where: {
              roomId: id,
              billingCycle: tier.billingCycle,
              interval: tier.interval,
            },
            data: {
              isActive: false,
            },
          });
        }
      }

      return room;
    });
  },

  // Clone one room into N identical units (price tiers, facilities, type,
  // description and size all carry over). Photos deliberately do not — the
  // room type's gallery already covers what the copies look like, and copying
  // a specific unit's condition photos onto ten other units is a lie.
  async duplicate(sourceId: string, input: DuplicateRoomInput) {
    const source = await prisma.room.findUnique({
      where: { id: sourceId },
      include: { facilities: true, prices: true },
    });
    if (!source) throw new Error('Kamar sumber tidak ditemukan');

    const numbers = generateRoomNumbers(input);
    if (numbers.length === 0) throw new Error('Tidak ada nomor unit yang dihasilkan');

    const taken = await prisma.room.findMany({
      where: { propertyId: source.propertyId, number: { in: numbers } },
      select: { number: true },
    });
    if (taken.length > 0) {
      throw new Error(`Nomor sudah dipakai di properti ini: ${taken.map((r) => r.number).join(', ')}`);
    }

    // An empty floorId from the form means "same floor as the source", not
    // "no floor" — the admin duplicating a room is usually filling one floor.
    const floorId = input.floorId ? input.floorId : source.floorId;

    return prisma.$transaction((tx) =>
      Promise.all(
        numbers.map((number) =>
          tx.room.create({
            data: {
              number,
              propertyId: source.propertyId,
              floorId,
              roomTypeId: source.roomTypeId,
              price: source.price,
              lengthM: source.lengthM,
              widthM: source.widthM,
              description: source.description,
              electricityMode: source.electricityMode,
              isActive: source.isActive,
              facilities: {
                create: source.facilities.map((f) => ({ facilityId: f.facilityId })),
              },
              prices: {
                create: source.prices.map((p) => ({
                  billingCycle: p.billingCycle,
                  interval: p.interval,
                  price: p.price,
                  isActive: p.isActive,
                })),
              },
            },
          }),
        ),
      ),
    );
  },

  // Soft-disable only — rooms with contract/payment history should never be
  // hard-deleted once Fase 2+ modules land.
  deactivate(id: string) {
    return prisma.room.update({ where: { id }, data: { isActive: false } });
  },

  // Rooms eligible to be picked in "sewa baru" — active and with no ACTIVE contract.
  listAvailable(propertyId?: string) {
    return prisma.room.findMany({
      where: {
        isActive: true,
        contracts: { none: { status: 'ACTIVE' } },
        propertyId: propertyId || undefined,
      },
      include: { floor: true, property: true, prices: { where: { isActive: true } } },
      orderBy: [{ floor: { order: 'asc' } }, { number: 'asc' }],
    });
  },

  listFloors(propertyId?: string) {
    return prisma.floor.findMany({
      where: propertyId ? { propertyId } : undefined,
      include: { property: true },
      orderBy: { order: 'asc' },
    });
  },

  createFloor(data: { name: string; order: number; propertyId: string }) {
    return prisma.floor.create({ data });
  },

  // Contract + maintenance history for a room, plus net profitability.
  async getRoomHistory(roomId: string) {
    const [contracts, maintenance, costAgg, incomeAgg] = await Promise.all([
      prisma.contract.findMany({
        where: { roomId },
        orderBy: { startDate: 'desc' },
        include: { tenant: true },
      }),
      prisma.maintenanceRecord.findMany({
        where: { roomId },
        orderBy: { date: 'desc' },
      }),
      prisma.maintenanceRecord.aggregate({
        where: { roomId },
        _sum: { cost: true },
      }),
      prisma.payment.aggregate({
        where: { contract: { roomId } },
        _sum: { amountPaid: true },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amountPaid?.toNumber() ?? 0;
    const totalCost = costAgg._sum.cost?.toNumber() ?? 0;

    return {
      contracts,
      maintenance,
      totalIncome,
      totalCost,
      netProfitability: totalIncome - totalCost,
    };
  },
};
