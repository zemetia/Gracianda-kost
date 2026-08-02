// Server-only: Prisma-backed domain service.
import { prisma } from '@/lib/prisma';
import { NOT_DELETED, recordStatusWhere, type RecordStatus } from '@/lib/record-status';
import type { PropertyInput } from '@/lib/validations';

export const propertyService = {
  /** One status bucket at a time — deactivated properties are never mixed in. */
  list(status: RecordStatus = 'active') {
    return prisma.property.findMany({
      where: recordStatusWhere(status),
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { rooms: { where: NOT_DELETED }, floors: true } },
      },
    });
  },

  async counts() {
    const [active, inactive] = await Promise.all([
      prisma.property.count({ where: recordStatusWhere('active') }),
      prisma.property.count({ where: recordStatusWhere('inactive') }),
    ]);
    return { active, inactive };
  },

  listActive() {
    return prisma.property.findMany({
      where: recordStatusWhere('active'),
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    const property = await prisma.property.findFirst({
      where: { id, ...NOT_DELETED },
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

  activate(id: string) {
    return prisma.property.update({
      where: { id },
      data: { isActive: true },
    });
  },

  /**
   * Permanent removal from the admin's world. Refused while a contract is still
   * running — the room behind it has to stay reachable. The property's rooms and
   * room types go with it, otherwise they would linger in the rooms page with no
   * property tab left to reach them from.
   */
  async softDelete(id: string) {
    const activeContracts = await prisma.contract.count({
      where: { status: 'ACTIVE', room: { propertyId: id } },
    });
    if (activeContracts > 0) {
      throw new Error(
        `Properti ini masih punya ${activeContracts} kontrak aktif. Akhiri kontraknya dulu sebelum menghapus.`,
      );
    }

    const deletedAt = new Date();
    return prisma.$transaction(async (tx) => {
      await tx.room.updateMany({
        where: { propertyId: id, ...NOT_DELETED },
        data: { deletedAt, isActive: false },
      });
      await tx.roomType.updateMany({
        where: { propertyId: id, ...NOT_DELETED },
        data: { deletedAt, isActive: false },
      });
      return tx.property.update({ where: { id }, data: { deletedAt, isActive: false } });
    });
  },
};

export const publicPropertyService = {
  // Headline counts for the landing page. "Kosong" is derived from the absence
  // of an ACTIVE contract — the same rule the public floor plan uses to paint a
  // room AVAILABLE, so the two can never disagree.
  async summary() {
    const roomScope = {
      ...recordStatusWhere('active'),
      property: recordStatusWhere('active'),
    } as const;

    const [propertyCount, roomCount, occupiedRoomCount] = await Promise.all([
      prisma.property.count({ where: recordStatusWhere('active') }),
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
