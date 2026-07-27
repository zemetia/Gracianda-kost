// Server-only: Prisma-backed domain service. SUPER_ADMIN-only surface —
// callers must guard with requireRole(['SUPER_ADMIN']) before invoking.

import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';
import type { CreateUserInput, UpdateUserInput } from '@/lib/validations';

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

// `password` is never selected — these rows get rendered in Server Components
// and serialized down to the client.
async function assertNotLastSuperAdmin(id: string): Promise<void> {
  const remaining = await prisma.user.count({
    where: { role: 'SUPER_ADMIN', isActive: true, id: { not: id } },
  });
  if (remaining === 0) {
    throw new Error('Tidak bisa menonaktifkan atau menurunkan role Super Admin terakhir');
  }
}

export const userService = {
  list() {
    return prisma.user.findMany({ select: SAFE_SELECT, orderBy: { createdAt: 'asc' } });
  },

  getById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
  },

  async create(data: CreateUserInput) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email sudah dipakai user lain');

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        password: await bcrypt.hash(data.password, 12),
      },
      select: SAFE_SELECT,
    });
  },

  async update(id: string, data: UpdateUserInput) {
    const current = await prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!current) throw new Error('User tidak ditemukan');

    if (current.role === 'SUPER_ADMIN' && data.role !== 'SUPER_ADMIN') {
      await assertNotLastSuperAdmin(id);
    }
    if (data.email !== current.email) {
      const clash = await prisma.user.findUnique({ where: { email: data.email } });
      if (clash) throw new Error('Email sudah dipakai user lain');
    }

    return prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        ...(data.password ? { password: await bcrypt.hash(data.password, 12) } : {}),
      },
      select: SAFE_SELECT,
    });
  },

  async setActive(id: string, isActive: boolean) {
    const current = await prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!current) throw new Error('User tidak ditemukan');
    if (!isActive && current.role === 'SUPER_ADMIN') await assertNotLastSuperAdmin(id);
    return prisma.user.update({ where: { id }, data: { isActive }, select: SAFE_SELECT });
  },
};
