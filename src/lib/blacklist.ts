/**
 * Aturan penyajian daftar hitam penyewa. Satu tempat supaya halaman blacklist,
 * detail penyewa, dan peringatan di form kontrak memakai wording dan warna
 * yang sama — label yang berbeda untuk kategori yang sama membuat admin ragu
 * apakah keduanya hal yang berbeda.
 */

import type { BadgeProps } from '@/components/ui/Badge';

export type BlacklistReason =
  | 'TUNGGAKAN'
  | 'KERUSAKAN'
  | 'PELANGGARAN'
  | 'KEAMANAN'
  | 'LAINNYA';

export const BLACKLIST_REASONS = [
  'TUNGGAKAN',
  'KERUSAKAN',
  'PELANGGARAN',
  'KEAMANAN',
  'LAINNYA',
] as const satisfies readonly BlacklistReason[];

// Mutable array — dioper langsung ke `<Select options={...}>`.
export const BLACKLIST_REASON_OPTIONS: {
  value: BlacklistReason;
  label: string;
  hint: string;
}[] = [
  {
    value: 'TUNGGAKAN',
    label: 'Tunggakan',
    hint: 'Kabur atau menunggak dan tidak diselesaikan',
  },
  {
    value: 'KERUSAKAN',
    label: 'Kerusakan',
    hint: 'Merusak kamar atau fasilitas, tidak mengganti',
  },
  {
    value: 'PELANGGARAN',
    label: 'Pelanggaran aturan',
    hint: 'Melanggar aturan kost berulang kali',
  },
  {
    value: 'KEAMANAN',
    label: 'Keamanan',
    hint: 'Pencurian, kekerasan, atau narkoba',
  },
  { value: 'LAINNYA', label: 'Lainnya', hint: 'Alasan lain — jelaskan di kronologi' },
];

/**
 * Bucket untuk baris warisan dari sebelum kategori ada. Bukan anggota enum —
 * database menyimpannya sebagai NULL; ini hanya nama yang dipakai URL dan
 * penghitung supaya kelompok itu bisa dipilih.
 */
export const UNCATEGORIZED = 'TANPA_KATEGORI';

export function blacklistReasonLabel(reason: string | null | undefined): string {
  return BLACKLIST_REASON_OPTIONS.find((option) => option.value === reason)?.label ?? 'Tanpa kategori';
}

/**
 * Keamanan adalah satu-satunya kategori yang dirender destructive: yang lain
 * adalah kerugian uang atau ketertiban dan masih bisa dinegosiasikan, yang ini
 * menyangkut keselamatan penghuni lain. Kalau semuanya merah, tidak ada yang
 * merah.
 */
export function blacklistReasonTone(reason: string | null | undefined): BadgeProps['variant'] {
  if (reason === 'KEAMANAN') return 'destructive';
  if (reason === 'LAINNYA' || !reason) return 'secondary';
  return 'warning';
}
