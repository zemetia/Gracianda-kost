// Server-only: Prisma-backed domain service.

import type { BlacklistReason } from '@/generated/prisma/enums';
import { UNCATEGORIZED } from '@/lib/blacklist';
import { prisma } from '@/lib/prisma';
import type { BlacklistInput, TenantInput } from '@/lib/validations';

export const tenantService = {
  list() {
    return prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  },

  // Autocomplete search by KTP, name, or phone — used when picking an
  // existing tenant for a new contract (sewa ulang / pindah kamar).
  search(query: string) {
    if (!query.trim()) return this.list();
    return prisma.tenant.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { ktpNumber: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },

  /** Penyewa yang belum ada di daftar hitam — isi picker "Tambah ke Blacklist". */
  listBlacklistCandidates() {
    return prisma.tenant.findMany({
      where: { isBlacklisted: false },
      select: { id: true, fullName: true, ktpNumber: true, phone: true },
      orderBy: { fullName: 'asc' },
    });
  },

  getById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        blacklistedBy: { select: { name: true, email: true } },
        contracts: {
          orderBy: { createdAt: 'desc' },
          include: { room: { include: { floor: true } }, occupants: true },
        },
      },
    });
  },

  create(data: TenantInput) {
    return prisma.tenant.create({
      data: { ...data, email: data.email || null },
    });
  },

  update(id: string, data: TenantInput) {
    return prisma.tenant.update({
      where: { id },
      data: { ...data, email: data.email || null },
    });
  },

  /**
   * Daftar hitam, dengan dua hal yang tidak ada di list penyewa biasa: siapa
   * yang memutuskan, dan apakah orangnya masih tinggal di sini. Yang kedua
   * adalah alasan utama halaman blacklist ada — penyewa yang sudah diblacklist
   * tapi kontraknya masih ACTIVE adalah pekerjaan yang belum selesai, bukan
   * arsip.
   */
  listBlacklisted(filter: { query?: string; reason?: string } = {}) {
    const query = filter.query?.trim();
    return prisma.tenant.findMany({
      where: {
        isBlacklisted: true,
        // Baris warisan dari sebelum kategori ada masih bisa dipilih sebagai
        // bucket sendiri, bukan tersembunyi di antara "Semua".
        ...(filter.reason === UNCATEGORIZED
          ? { blacklistReason: null }
          : filter.reason
            ? { blacklistReason: filter.reason as BlacklistReason }
            : {}),
        ...(query
          ? {
              OR: [
                { fullName: { contains: query, mode: 'insensitive' as const } },
                { ktpNumber: { contains: query, mode: 'insensitive' as const } },
                { phone: { contains: query, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: {
        blacklistedBy: { select: { name: true, email: true } },
        contracts: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            contractCode: true,
            room: { select: { number: true, property: { select: { name: true } } } },
          },
        },
      },
      // Baris warisan yang belum punya tanggal jatuh ke bawah, bukan ke atas.
      orderBy: [{ blacklistedAt: 'desc' }, { updatedAt: 'desc' }],
    });
  },

  /** Jumlah per kategori untuk chip filter — termasuk yang tanpa kategori. */
  async blacklistReasonCounts() {
    const rows = await prisma.tenant.groupBy({
      by: ['blacklistReason'],
      where: { isBlacklisted: true },
      _count: { _all: true },
    });

    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      counts[row.blacklistReason ?? UNCATEGORIZED] = row._count._all;
      total += row._count._all;
    }
    return { counts, total };
  },

  /**
   * `blacklistedAt` menandai kapan keputusannya diambil, bukan kapan catatannya
   * terakhir disunting — memperbaiki typo di kronologi tidak boleh membuat
   * penyewa terlihat baru masuk daftar hari ini. Mengeluarkan dari daftar
   * membersihkan seluruh jejak keputusan supaya tidak ada sisa yang bisa
   * terbaca sebagai blacklist yang masih berlaku.
   */
  async setBlacklist(id: string, data: BlacklistInput, actorId: string) {
    const current = await prisma.tenant.findUnique({
      where: { id },
      select: { isBlacklisted: true, blacklistedAt: true, blacklistedById: true },
    });
    if (!current) throw new Error('Penyewa tidak ditemukan');

    if (!data.isBlacklisted) {
      return prisma.tenant.update({
        where: { id },
        data: {
          isBlacklisted: false,
          blacklistReason: null,
          blacklistNote: null,
          blacklistedAt: null,
          blacklistedById: null,
        },
      });
    }

    const isNewEntry = !current.isBlacklisted || !current.blacklistedAt;
    return prisma.tenant.update({
      where: { id },
      data: {
        isBlacklisted: true,
        blacklistReason: data.blacklistReason,
        blacklistNote: data.blacklistNote,
        blacklistedAt: isNewEntry ? new Date() : current.blacklistedAt,
        blacklistedById: isNewEntry ? actorId : (current.blacklistedById ?? actorId),
      },
    });
  },
};
