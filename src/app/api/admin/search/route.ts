import { NextResponse, type NextRequest } from 'next/server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NOT_DELETED } from '@/lib/record-status';
import type { AdminSearchResponse } from '@/services/types';

const MAX_PER_GROUP = 6;

// Command palette search — deliberately ignores the property scope cookie.
// Jumping to a room/tenant/contract outside the current scope is exactly
// the point of a global "find anything" tool.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) {
    return NextResponse.json<AdminSearchResponse>({ rooms: [], tenants: [], contracts: [] });
  }

  const [rooms, tenants, contracts] = await Promise.all([
    prisma.room.findMany({
      where: {
        ...NOT_DELETED,
        property: NOT_DELETED,
        OR: [
          { number: { contains: q, mode: 'insensitive' } },
          { property: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { property: true, floor: true },
      take: MAX_PER_GROUP,
    }),
    prisma.tenant.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { ktpNumber: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: MAX_PER_GROUP,
    }),
    prisma.contract.findMany({
      where: {
        OR: [
          { contractCode: { contains: q, mode: 'insensitive' } },
          { tenant: { fullName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { tenant: true, room: { include: { property: true } } },
      take: MAX_PER_GROUP,
    }),
  ]);

  return NextResponse.json<AdminSearchResponse>({
    rooms: rooms.map((room) => ({
      id: room.id,
      title: `${room.property.name} — No. ${room.number}`,
      subtitle: room.floor ? room.floor.name : 'Kamar / Unit',
      href: `/admin/master-data/rooms/${room.id}`,
    })),
    tenants: tenants.map((tenant) => ({
      id: tenant.id,
      title: tenant.fullName,
      subtitle: `KTP ${tenant.ktpNumber} · ${tenant.phone}`,
      href: `/admin/tenants/${tenant.id}`,
    })),
    contracts: contracts.map((contract) => ({
      id: contract.id,
      title: contract.contractCode,
      subtitle: `${contract.tenant.fullName} · ${contract.room.property.name} No. ${contract.room.number}`,
      href: `/admin/contracts/${contract.id}`,
    })),
  });
}
