// Server-only: Prisma-backed domain service. Import only from Server
// Components, Server Actions, or Route Handlers — never from 'use client' files.

import { prisma } from '@/lib/prisma';
import type { RoomInput } from '@/lib/validations';

export const roomService = {
  list(propertyId?: string) {
    return prisma.room.findMany({
      where: propertyId ? { propertyId } : undefined,
      include: {
        property: true,
        floor: true,
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

export const publicRoomService = {
  // Floors with their active rooms, for the interactive public floor plan.
  // Only non-sensitive fields are selected — no admin-only data leaks here.
  async listFloorsWithRooms(propertyId?: string) {
    let targetPropertyId = propertyId;
    if (!targetPropertyId) {
      const firstProp = await prisma.property.findFirst({ where: { isActive: true } });
      if (!firstProp) return [];
      targetPropertyId = firstProp.id;
    }

    const floors = await prisma.floor.findMany({
      where: { propertyId: targetPropertyId },
      orderBy: { order: 'asc' },
      include: {
        rooms: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
          include: {
            facilities: { include: { facility: true } },
            contracts: { where: { status: 'ACTIVE' }, take: 1 },
            prices: { where: { isActive: true } },
          },
        },
      },
    });

    const floorlessRooms = await prisma.room.findMany({
      where: { propertyId: targetPropertyId, floorId: null, isActive: true },
      orderBy: { number: 'asc' },
      include: {
        facilities: { include: { facility: true } },
        contracts: { where: { status: 'ACTIVE' }, take: 1 },
        prices: { where: { isActive: true } },
      },
    });

    const mappedFloors = floors.map((floor) => ({
      id: floor.id,
      name: floor.name,
      order: floor.order,
      rooms: floor.rooms.map((room) => ({
        id: room.id,
        number: room.number,
        price: room.price.toNumber(),
        sizeSqm: room.sizeSqm ? room.sizeSqm.toNumber() : null,
        description: room.description,
        status: room.contracts.length > 0 ? ('OCCUPIED' as const) : ('AVAILABLE' as const),
        facilities: room.facilities.map((rf) => ({ id: rf.facility.id, name: rf.facility.name, icon: rf.facility.icon })),
        prices: room.prices.map((p) => ({
          id: p.id,
          billingCycle: p.billingCycle,
          interval: p.interval,
          price: p.price.toNumber(),
        })),
        photos: [] as string[],
        videos: [] as string[],
      })),
    }));

    if (floorlessRooms.length > 0) {
      mappedFloors.push({
        id: 'floorless',
        name: 'Unit Hunian',
        order: 0,
        rooms: floorlessRooms.map((room) => ({
          id: room.id,
          number: room.number,
          price: room.price.toNumber(),
          sizeSqm: room.sizeSqm ? room.sizeSqm.toNumber() : null,
          description: room.description,
          status: room.contracts.length > 0 ? ('OCCUPIED' as const) : ('AVAILABLE' as const),
          facilities: room.facilities.map((rf) => ({ id: rf.facility.id, name: rf.facility.name, icon: rf.facility.icon })),
          prices: room.prices.map((p) => ({
            id: p.id,
            billingCycle: p.billingCycle,
            interval: p.interval,
            price: p.price.toNumber(),
          })),
          photos: [] as string[],
          videos: [] as string[],
        })),
      });
    }

    const roomIds = mappedFloors.flatMap((floor) => floor.rooms.map((room) => room.id));
    const attachments = roomIds.length
      ? await prisma.attachment.findMany({
          where: { entityType: 'ROOM', entityId: { in: roomIds } },
        })
      : [];

    return mappedFloors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => ({
        ...room,
        photos: attachments
          .filter((a) => a.entityId === room.id && a.kind === 'PHOTO')
          .map((a) => a.url),
        videos: attachments
          .filter((a) => a.entityId === room.id && a.kind === 'VIDEO')
          .map((a) => a.url),
      })),
    }));
  },
};
