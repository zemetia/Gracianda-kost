// Server-only: Prisma-backed domain service.
import { prisma } from '@/lib/prisma';
import type { PropertyInput } from '@/lib/validations';

export const propertyService = {
  list() {
    return prisma.property.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { rooms: true, floors: true } } },
    });
  },

  listActive() {
    return prisma.property.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: { facilities: { include: { facility: true } } },
    });
    if (!property) return null;

    // Coordinates leave the service as plain numbers — nothing above this layer
    // should have to know they are Decimal.
    return {
      ...property,
      latitude: property.latitude?.toNumber() ?? null,
      longitude: property.longitude?.toNumber() ?? null,
    };
  },

  create(data: PropertyInput) {
    const { facilityIds, ...rest } = data;

    return prisma.property.create({
      data: {
        ...rest,
        facilities: { create: facilityIds.map((facilityId) => ({ facilityId })) },
      },
    });
  },

  update(id: string, data: PropertyInput) {
    const { facilityIds, ...rest } = data;

    return prisma.$transaction(async (tx) => {
      await tx.propertyFacility.deleteMany({ where: { propertyId: id } });

      return tx.property.update({
        where: { id },
        data: {
          ...rest,
          facilities: { create: facilityIds.map((facilityId) => ({ facilityId })) },
        },
      });
    });
  },

  deactivate(id: string) {
    return prisma.property.update({
      where: { id },
      data: { isActive: false },
    });
  },
};

export const publicPropertyService = {
  // Headline counts for the landing page. "Kosong" is derived from the absence
  // of an ACTIVE contract — the same rule the public floor plan uses to paint a
  // room AVAILABLE, so the two can never disagree.
  async summary() {
    const roomScope = { isActive: true, property: { isActive: true } } as const;

    const [propertyCount, roomCount, occupiedRoomCount] = await Promise.all([
      prisma.property.count({ where: { isActive: true } }),
      prisma.room.count({ where: roomScope }),
      prisma.room.count({
        where: { ...roomScope, contracts: { some: { status: 'ACTIVE' } } },
      }),
    ]);

    return {
      propertyCount,
      roomCount,
      availableRoomCount: roomCount - occupiedRoomCount,
    };
  },
};
