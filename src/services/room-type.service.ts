// Server-only: Prisma-backed domain service. Import only from Server
// Components, Server Actions, or Route Handlers — never from 'use client' files.

import { PRICE_TIER_FIELDS } from '@/lib/billing';
import { prisma } from '@/lib/prisma';
import type { RoomTypeInput } from '@/lib/validations';

/** Rows for `room_type_prices`, skipping the tiers the admin left blank. */
function priceTierRows(data: RoomTypeInput) {
  return PRICE_TIER_FIELDS.flatMap((tier) => {
    const value = data[tier.field];
    if (!value || value <= 0) return [];
    return [{ billingCycle: tier.billingCycle, interval: tier.interval, price: value }];
  });
}

export const roomTypeService = {
  list(propertyId?: string) {
    return prisma.roomType.findMany({
      where: propertyId ? { propertyId } : undefined,
      include: {
        property: true,
        facilities: { include: { facility: true } },
        prices: true,
        _count: { select: { rooms: true } },
      },
      orderBy: { name: 'asc' },
    });
  },

  listActive(propertyId: string) {
    return prisma.roomType.findMany({
      where: { propertyId, isActive: true },
      include: { facilities: true, prices: true },
      orderBy: { name: 'asc' },
    });
  },

  getById(id: string) {
    return prisma.roomType.findUnique({
      where: { id },
      include: {
        property: true,
        facilities: { include: { facility: true } },
        prices: true,
        _count: { select: { rooms: true } },
      },
    });
  },

  create(data: RoomTypeInput) {
    const {
      facilityIds,
      propertyId,
      name,
      description,
      lengthM,
      widthM,
      price,
      electricityMode,
      isActive,
    } = data;

    return prisma.roomType.create({
      data: {
        propertyId,
        name,
        description: description || null,
        lengthM: lengthM || null,
        widthM: widthM || null,
        price: price || null,
        electricityMode,
        isActive,
        facilities: { create: facilityIds.map((facilityId) => ({ facilityId })) },
        prices: { create: priceTierRows(data) },
      },
    });
  },

  update(id: string, data: RoomTypeInput) {
    const { facilityIds, name, description, lengthM, widthM, price, electricityMode, isActive } =
      data;

    return prisma.$transaction(async (tx) => {
      await tx.roomTypeFacility.deleteMany({ where: { roomTypeId: id } });
      await tx.roomTypePrice.deleteMany({ where: { roomTypeId: id } });

      return tx.roomType.update({
        where: { id },
        data: {
          name,
          description: description || null,
          lengthM: lengthM || null,
          widthM: widthM || null,
          price: price || null,
          electricityMode,
          isActive,
          facilities: { create: facilityIds.map((facilityId) => ({ facilityId })) },
          prices: { create: priceTierRows(data) },
        },
      });
    });
  },

  // Soft-disable — rooms keep pointing at the type, so its facilities and
  // photos stay resolvable for units that were created from it.
  deactivate(id: string) {
    return prisma.roomType.update({ where: { id }, data: { isActive: false } });
  },

  // Defaults used to prefill the room form when an admin picks a type.
  // Never read during billing — Room.price stays authoritative there.
  async getFormDefaults(propertyId: string) {
    const types = await prisma.roomType.findMany({
      where: { propertyId, isActive: true },
      include: { facilities: true, prices: true },
      orderBy: { name: 'asc' },
    });

    return types.map((type) => ({
      id: type.id,
      name: type.name,
      description: type.description,
      lengthM: type.lengthM ? type.lengthM.toNumber() : null,
      widthM: type.widthM ? type.widthM.toNumber() : null,
      price: type.price ? type.price.toNumber() : null,
      electricityMode: type.electricityMode,
      facilityIds: type.facilities.map((f) => f.facilityId),
      prices: type.prices.map((p) => ({
        billingCycle: p.billingCycle,
        interval: p.interval,
        price: p.price.toNumber(),
      })),
    }));
  },
};
