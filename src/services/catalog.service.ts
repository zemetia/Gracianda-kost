// Server-only: Prisma-backed domain service. Import only from Server
// Components, Server Actions, or Route Handlers — never from 'use client' files.

import { prisma } from '@/lib/prisma';
import { resolveInherited } from '@/lib/room-template';

/**
 * The public catalogue: what a prospective tenant browses. It is organised by
 * room TYPE, not by unit — "Tipe Deluxe, 3 dari 8 kamar kosong" is the question
 * someone shopping for a kost actually asks; a specific unit number only starts
 * mattering once they have picked a type.
 *
 * Rooms without a type are not hidden: they become their own group, one per
 * property, so "berapa kamar yang belum dikategorikan" is answerable from the
 * same list instead of silently disappearing.
 */

/** Group id prefix for the per-property "tanpa tipe" bucket: `tanpa-tipe-<propertyId>`. */
const UNTYPED_PREFIX = 'tanpa-tipe-';

export function untypedGroupId(propertyId: string): string {
  return `${UNTYPED_PREFIX}${propertyId}`;
}

/** Splits a group id back into the query it came from. */
export function parseGroupId(groupId: string): { roomTypeId: string | null; propertyId: string | null } {
  return groupId.startsWith(UNTYPED_PREFIX)
    ? { roomTypeId: null, propertyId: groupId.slice(UNTYPED_PREFIX.length) }
    : { roomTypeId: groupId, propertyId: null };
}

export interface CatalogFilters {
  propertyId?: string | undefined;
  /** Property category — KOST / HOUSE / APARTMENT / VILLA / OTHER. */
  propertyType?: string | undefined;
  /** A RoomType id, or an `untypedGroupId()` for the no-type bucket. */
  groupId?: string | undefined;
  /** A room must carry ALL of these (after the room-overrides-type rule). */
  facilityIds?: string[] | undefined;
  onlyAvailable?: boolean | undefined;
  /** Free text over room number, type name, property name, and description. */
  query?: string | undefined;
}

export interface CatalogFacility {
  id: string;
  name: string;
  icon: string | null;
}

export interface CatalogPrice {
  billingCycle: string;
  interval: number;
  price: number;
}

export interface CatalogRoom {
  id: string;
  number: string;
  floorName: string | null;
  floorOrder: number;
  propertyId: string;
  propertyName: string;
  propertyType: string;
  groupId: string;
  roomTypeId: string | null;
  roomTypeName: string | null;
  price: number;
  prices: CatalogPrice[];
  lengthM: number | null;
  widthM: number | null;
  description: string | null;
  facilities: CatalogFacility[];
  status: 'AVAILABLE' | 'OCCUPIED';
  photos: string[];
}

export interface CatalogGroup {
  id: string;
  roomTypeId: string | null;
  name: string;
  description: string | null;
  propertyId: string;
  propertyName: string;
  propertyType: string;
  propertyCity: string | null;
  /** The building's own penjaga, when it has one — siteConfig is the fallback. */
  propertyWhatsapp: string | null;
  lengthM: number | null;
  widthM: number | null;
  /** Derived from the actual units — Room.price stays the authoritative figure. */
  priceFrom: number;
  priceTo: number;
  /** The type's published package list. Empty for the untyped bucket. */
  prices: CatalogPrice[];
  /** Only what every unit in the group has, so the card never over-promises. */
  facilities: CatalogFacility[];
  photos: string[];
  /** Every active unit of this type — unaffected by the filters, so a card can
   *  still say "3 dari 8" while the search is narrowed to the vacant ones. */
  totalRooms: number;
  availableRooms: number;
  /** Units that actually matched the current filters — `rooms` holds them. */
  matchingRooms: number;
  rooms: CatalogRoom[];
}

const ROOM_INCLUDE = {
  property: true,
  floor: true,
  roomType: {
    include: {
      facilities: { include: { facility: true } },
      prices: true,
    },
  },
  facilities: { include: { facility: true } },
  contracts: { where: { status: 'ACTIVE' as const }, take: 1 },
  prices: { where: { isActive: true } },
} as const;

type RoomRow = Awaited<ReturnType<typeof loadRoomRows>>[number];

function loadRoomRows(filters: CatalogFilters) {
  const group = filters.groupId ? parseGroupId(filters.groupId) : null;

  return prisma.room.findMany({
    where: {
      isActive: true,
      property: {
        isActive: true,
        ...(filters.propertyId ? { id: filters.propertyId } : {}),
        ...(group?.propertyId ? { id: group.propertyId } : {}),
        ...(filters.propertyType
          ? { type: filters.propertyType as 'KOST' | 'HOUSE' | 'APARTMENT' | 'VILLA' | 'OTHER' }
          : {}),
      },
      ...(group ? { roomTypeId: group.roomTypeId } : {}),
    },
    include: ROOM_INCLUDE,
    orderBy: [{ floor: { order: 'asc' } }, { number: 'asc' }],
  });
}

function mapRoom(row: RoomRow, photos: string[]): CatalogRoom {
  // Facilities follow the room-overrides-type rule, same as the admin side.
  const facilities = resolveInherited(
    row.facilities.map((rf) => rf.facility),
    row.roomType?.facilities.map((rf) => rf.facility) ?? [],
  );

  return {
    id: row.id,
    number: row.number,
    floorName: row.floor?.name ?? null,
    floorOrder: row.floor?.order ?? 0,
    propertyId: row.propertyId,
    propertyName: row.property.name,
    propertyType: row.property.type,
    groupId: row.roomTypeId ?? untypedGroupId(row.propertyId),
    roomTypeId: row.roomTypeId,
    roomTypeName: row.roomType?.name ?? null,
    price: row.price.toNumber(),
    prices: row.prices.map((p) => ({
      billingCycle: p.billingCycle,
      interval: p.interval,
      price: p.price.toNumber(),
    })),
    lengthM: row.lengthM?.toNumber() ?? row.roomType?.lengthM?.toNumber() ?? null,
    widthM: row.widthM?.toNumber() ?? row.roomType?.widthM?.toNumber() ?? null,
    description: row.description ?? row.roomType?.description ?? null,
    facilities: facilities.items.map((f) => ({ id: f.id, name: f.name, icon: f.icon })),
    status: row.contracts.length > 0 ? 'OCCUPIED' : 'AVAILABLE',
    photos,
  };
}

/** Photos follow the same override rule as facilities: own gallery, else the type's. */
async function loadPhotos(rows: RoomRow[]): Promise<Map<string, string[]>> {
  const roomIds = rows.map((row) => row.id);
  const typeIds = [...new Set(rows.flatMap((row) => (row.roomTypeId ? [row.roomTypeId] : [])))];

  const attachments = await prisma.attachment.findMany({
    where: {
      kind: 'PHOTO',
      OR: [
        { entityType: 'ROOM', entityId: { in: roomIds } },
        { entityType: 'ROOM_TYPE', entityId: { in: typeIds } },
      ],
    },
  });

  const urlsFor = (entityType: 'ROOM' | 'ROOM_TYPE', entityId: string) =>
    attachments
      .filter((a) => a.entityType === entityType && a.entityId === entityId)
      .map((a) => a.url);

  return new Map(
    rows.map((row) => [
      row.id,
      [
        ...resolveInherited(
          urlsFor('ROOM', row.id),
          row.roomTypeId ? urlsFor('ROOM_TYPE', row.roomTypeId) : [],
        ).items,
      ],
    ]),
  );
}

/** A facility filter only makes sense against the resolved list, so it runs here, not in SQL. */
function matchesFilters(room: CatalogRoom, filters: CatalogFilters): boolean {
  if (filters.onlyAvailable && room.status !== 'AVAILABLE') return false;

  if (filters.facilityIds && filters.facilityIds.length > 0) {
    const owned = new Set(room.facilities.map((f) => f.id));
    if (!filters.facilityIds.every((id) => owned.has(id))) return false;
  }

  const query = filters.query?.trim().toLowerCase();
  if (query) {
    const haystack = [room.number, room.roomTypeName, room.propertyName, room.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  return true;
}

/** Facilities every unit in the group has — one missing unit drops the row. */
function sharedFacilities(rooms: CatalogRoom[]): CatalogFacility[] {
  const [first, ...rest] = rooms;
  if (!first) return [];
  return first.facilities.filter((facility) =>
    rest.every((room) => room.facilities.some((other) => other.id === facility.id)),
  );
}

function groupBy(rooms: CatalogRoom[]): Map<string, CatalogRoom[]> {
  const byGroup = new Map<string, CatalogRoom[]>();
  for (const room of rooms) {
    const bucket = byGroup.get(room.groupId);
    if (bucket) bucket.push(room);
    else byGroup.set(room.groupId, [room]);
  }
  return byGroup;
}

function buildGroups(rows: RoomRow[], allRooms: CatalogRoom[], matching: CatalogRoom[]): CatalogGroup[] {
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const everyRoom = groupBy(allRooms);

  const groups = [...groupBy(matching).entries()].flatMap(([groupId, groupRooms]) => {
    const first = groupRooms[0];
    if (!first) return [];

    const siblings = everyRoom.get(groupId) ?? groupRooms;
    const type = rowById.get(first.id)?.roomType ?? null;
    const prices = groupRooms.map((room) => room.price);

    const group = {
      id: groupId,
      roomTypeId: type?.id ?? null,
      name: type?.name ?? 'Tanpa Tipe',
      description:
        type?.description ??
        (type ? null : 'Kamar yang belum dikelompokkan ke tipe mana pun — detailnya dibaca per unit.'),
      propertyId: first.propertyId,
      propertyName: first.propertyName,
      propertyType: first.propertyType,
      propertyCity: rowById.get(first.id)?.property.city ?? null,
      propertyWhatsapp: rowById.get(first.id)?.property.whatsappNumber ?? null,
      lengthM: type?.lengthM?.toNumber() ?? first.lengthM,
      widthM: type?.widthM?.toNumber() ?? first.widthM,
      priceFrom: Math.min(...prices),
      priceTo: Math.max(...prices),
      prices: (type?.prices ?? []).map((p) => ({
        billingCycle: p.billingCycle,
        interval: p.interval,
        price: p.price.toNumber(),
      })),
      facilities: sharedFacilities(siblings),
      photos: siblings.find((room) => room.photos.length > 0)?.photos ?? [],
      totalRooms: siblings.length,
      availableRooms: siblings.filter((room) => room.status === 'AVAILABLE').length,
      matchingRooms: groupRooms.length,
      rooms: groupRooms,
    } satisfies CatalogGroup;

    return [group];
  });

  // Typed groups first, alphabetically; the untyped bucket always closes the
  // list — it is a leftover, not an offer.
  return groups.sort((a, b) => {
    if (!a.roomTypeId !== !b.roomTypeId) return a.roomTypeId ? -1 : 1;
    return a.propertyName.localeCompare(b.propertyName) || a.name.localeCompare(b.name);
  });
}

export const catalogService = {
  /** Room types (plus the untyped bucket) matching the filters, with vacancy counts. */
  async listGroups(filters: CatalogFilters = {}): Promise<CatalogGroup[]> {
    const rows = await loadRoomRows(filters);
    if (rows.length === 0) return [];

    const photos = await loadPhotos(rows);
    const allRooms = rows.map((row) => mapRoom(row, photos.get(row.id) ?? []));
    const matching = allRooms.filter((room) => matchesFilters(room, filters));

    return buildGroups(rows, allRooms, matching);
  },

  /** One group with all of its units — the room type detail page. */
  async getGroup(groupId: string): Promise<CatalogGroup | null> {
    const groups = await this.listGroups({ groupId });
    return groups[0] ?? null;
  },

  /** One unit, with the type it belongs to and the property's contact details. */
  async getRoom(roomId: string) {
    const row = await prisma.room.findFirst({
      where: { id: roomId, isActive: true, property: { isActive: true } },
      include: ROOM_INCLUDE,
    });
    if (!row) return null;

    const photos = await loadPhotos([row]);
    const property = row.property;

    return {
      ...mapRoom(row, photos.get(row.id) ?? []),
      property: {
        id: property.id,
        name: property.name,
        type: property.type,
        address: property.address,
        district: property.district,
        city: property.city,
        province: property.province,
        postalCode: property.postalCode,
        mapsUrl: property.mapsUrl,
        whatsappNumber: property.whatsappNumber,
        contactName: property.contactName,
        contactPhone: property.contactPhone,
        genderPolicy: property.genderPolicy,
        curfewTime: property.curfewTime,
        rules: property.rules,
      },
    };
  },

  /** Everything the search filters need to render themselves. */
  async listFilterOptions() {
    const [properties, roomTypes, facilities] = await Promise.all([
      prisma.property.findMany({
        where: { isActive: true },
        select: { id: true, name: true, type: true, city: true },
        orderBy: { name: 'asc' },
      }),
      prisma.roomType.findMany({
        where: { isActive: true, property: { isActive: true } },
        select: { id: true, name: true, propertyId: true },
        orderBy: { name: 'asc' },
      }),
      // Only facilities actually attached to something — an empty filter row
      // that can never match anything is worse than no filter row.
      prisma.facility.findMany({
        where: {
          category: 'ROOM',
          OR: [{ rooms: { some: {} } }, { roomTypes: { some: {} } }],
        },
        select: { id: true, name: true, icon: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { properties, roomTypes, facilities };
  },
};
