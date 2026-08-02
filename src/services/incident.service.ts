// Server-only: Prisma-backed domain service.

import { prisma } from '@/lib/prisma';
import { personRef } from '@/lib/incident';
import type { IncidentCategory, IncidentStatus, Prisma } from '@/generated/prisma/client';
import type { IncidentInput, IncidentStatusInput } from '@/lib/validations';

interface IncidentFilter {
  category?: IncidentCategory;
  status?: IncidentStatus;
  propertyId?: string;
  roomId?: string;
  floorId?: string;
  /** Only incidents this tenant is recorded in, in any role. */
  tenantId?: string;
}

const listInclude = {
  room: { include: { floor: true } },
  property: true,
  people: true,
} satisfies Prisma.IncidentInclude;

/** One selectable person for the incident form's picker. */
export interface IncidentPersonCandidate {
  /** Opaque `tenant:<id>` / `occupant:<id>` ref — see `parsePersonRef`. */
  ref: string;
  name: string;
  phone: string | null;
  propertyId: string;
  roomId: string;
  roomNumber: string;
  /** "Penyewa" vs "Penghuni tambahan" — shown as the option hint. */
  kind: 'tenant' | 'occupant';
}

export const incidentService = {
  list(filter: IncidentFilter = {}) {
    const where: Prisma.IncidentWhereInput = {};
    if (filter.category) where.category = filter.category;
    if (filter.status) where.status = filter.status;
    if (filter.propertyId) where.propertyId = filter.propertyId;
    if (filter.roomId) where.roomId = filter.roomId;
    if (filter.floorId) where.room = { floorId: filter.floorId };
    if (filter.tenantId) where.people = { some: { tenantId: filter.tenantId } };

    return prisma.incident.findMany({
      where,
      orderBy: { date: 'desc' },
      include: listInclude,
    });
  },

  getById(id: string) {
    return prisma.incident.findUnique({
      where: { id },
      include: listInclude,
    });
  },

  /**
   * Every incident a person is named in — whether it happened in their room or
   * anywhere else in the building. This is the "per orang" view: the tenant
   * page needs it to answer "has this person been trouble before?" before a
   * renewal, and filtering by room would miss the ones in the parking lot.
   */
  listForTenant(tenantId: string) {
    return prisma.incident.findMany({
      where: { people: { some: { tenantId } } },
      orderBy: { date: 'desc' },
      include: { ...listInclude, people: { where: { tenantId } } },
    });
  },

  /** Incidents tied to a unit — the room's own history, whoever was involved. */
  listForRoom(roomId: string) {
    return prisma.incident.findMany({
      where: { roomId },
      orderBy: { date: 'desc' },
      include: listInclude,
    });
  },

  /**
   * Who the form can offer: the tenant plus every extra occupant of each ACTIVE
   * contract. Ordered by room so the picker reads like a floor list; the form
   * narrows it to the selected property and floats the selected room's people
   * to the top.
   */
  async listPersonCandidates(propertyId?: string): Promise<IncidentPersonCandidate[]> {
    const contracts = await prisma.contract.findMany({
      where: { status: 'ACTIVE', ...(propertyId ? { room: { propertyId } } : {}) },
      orderBy: { room: { number: 'asc' } },
      include: {
        tenant: { select: { id: true, fullName: true, phone: true } },
        room: { select: { id: true, number: true, propertyId: true } },
        occupants: { select: { id: true, fullName: true, phone: true } },
      },
    });

    return contracts.flatMap((contract) => {
      const place = {
        propertyId: contract.room.propertyId,
        roomId: contract.room.id,
        roomNumber: contract.room.number,
      };
      return [
        {
          ref: personRef('tenant', contract.tenant.id),
          name: contract.tenant.fullName,
          phone: contract.tenant.phone,
          kind: 'tenant' as const,
          ...place,
        },
        ...contract.occupants.map((occupant) => ({
          ref: personRef('occupant', occupant.id),
          name: occupant.fullName,
          phone: occupant.phone,
          kind: 'occupant' as const,
          ...place,
        })),
      ];
    });
  },

  create({ people, ...data }: IncidentInput) {
    return prisma.incident.create({
      data: {
        ...data,
        people: {
          create: people.map((person) => ({
            role: person.role,
            name: person.name,
            phone: person.phone ?? null,
            notes: person.notes ?? null,
            tenantId: person.tenantId ?? null,
            occupantId: person.occupantId ?? null,
          })),
        },
      },
    });
  },

  updateStatus(id: string, data: IncidentStatusInput) {
    return prisma.incident.update({ where: { id }, data });
  },
};
