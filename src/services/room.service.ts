// Server-only: Prisma-backed domain service. Import only from Server
// Components, Server Actions, or Route Handlers — never from 'use client' files.

import { prisma } from '@/lib/prisma';
import type { RoomInput } from '@/lib/validations';

export const roomService = {
  list() {
    return prisma.room.findMany({
      include: {
        floor: true,
        facilities: { include: { facility: true } },
        // Status is derived from this, not stored — see contractService.
        contracts: { where: { status: 'ACTIVE' }, take: 1 },
      },
      orderBy: [{ floor: { order: 'asc' } }, { number: 'asc' }],
    });
  },

  getById(id: string) {
    return prisma.room.findUnique({
      where: { id },
      include: { floor: true, facilities: { include: { facility: true } } },
    });
  },

  create(data: RoomInput) {
    const { facilityIds, ...roomData } = data;
    return prisma.room.create({
      data: {
        ...roomData,
        facilities: {
          create: facilityIds.map((facilityId) => ({ facilityId })),
        },
      },
    });
  },

  async update(id: string, data: RoomInput) {
    const { facilityIds, ...roomData } = data;
    return prisma.$transaction(async (tx) => {
      await tx.roomFacility.deleteMany({ where: { roomId: id } });
      return tx.room.update({
        where: { id },
        data: {
          ...roomData,
          facilities: {
            create: facilityIds.map((facilityId) => ({ facilityId })),
          },
        },
      });
    });
  },

  // Soft-disable only — rooms with contract/payment history should never be
  // hard-deleted once Fase 2+ modules land.
  deactivate(id: string) {
    return prisma.room.update({ where: { id }, data: { isActive: false } });
  },

  // Rooms eligible to be picked in "sewa baru" — active and with no ACTIVE contract.
  listAvailable() {
    return prisma.room.findMany({
      where: { isActive: true, contracts: { none: { status: 'ACTIVE' } } },
      include: { floor: true },
      orderBy: [{ floor: { order: 'asc' } }, { number: 'asc' }],
    });
  },

  listFloors() {
    return prisma.floor.findMany({ orderBy: { order: 'asc' } });
  },

  createFloor(data: { name: string; order: number }) {
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
  async listFloorsWithRooms() {
    const floors = await prisma.floor.findMany({
      orderBy: { order: 'asc' },
      include: {
        rooms: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
          include: {
            facilities: { include: { facility: true } },
            contracts: { where: { status: 'ACTIVE' }, take: 1 },
          },
        },
      },
    });

    const roomIds = floors.flatMap((floor) => floor.rooms.map((room) => room.id));
    const attachments = roomIds.length
      ? await prisma.attachment.findMany({
          where: { entityType: 'ROOM', entityId: { in: roomIds } },
        })
      : [];

    return floors.map((floor) => ({
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
