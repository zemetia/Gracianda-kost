import { Link } from '@/i18n/navigation';
import { BLACKLIST_REASON_OPTIONS, UNCATEGORIZED } from '@/lib/blacklist';

interface ReasonFilterProps {
  /** `''` berarti semua kategori. */
  reason: string;
  counts: Record<string, number>;
  total: number;
  /** Pencarian yang harus selamat saat kategori diganti. */
  query?: string;
}

/**
 * Kategori yang tidak dipakai siapa pun tetap dirender dengan angka nol —
 * daftar chip yang berubah-ubah panjangnya membuat admin mengira ada kategori
 * yang hilang.
 */
export function ReasonFilter({ reason, counts, total, query }: ReasonFilterProps) {
  const hrefFor = (value: string) => {
    const search = new URLSearchParams();
    if (query) search.set('q', query);
    if (value) search.set('kategori', value);
    const params = search.toString();
    return params ? `/admin/tenants/blacklist?${params}` : '/admin/tenants/blacklist';
  };

  const uncategorized = counts[UNCATEGORIZED] ?? 0;
  const tabs = [
    { value: '', label: 'Semua', count: total },
    ...BLACKLIST_REASON_OPTIONS.map((option) => ({
      value: option.value as string,
      label: option.label,
      count: counts[option.value] ?? 0,
    })),
    // Hanya muncul kalau memang ada — kategori kosong yang selalu terpampang
    // membuat data lama terlihat seperti masalah yang belum diberesi.
    ...(uncategorized > 0
      ? [{ value: UNCATEGORIZED, label: 'Tanpa kategori', count: uncategorized }]
      : []),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.value || 'all'}
          href={hrefFor(tab.value)}
          aria-current={reason === tab.value ? 'page' : undefined}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            reason === tab.value
              ? 'border-primary bg-primary-subtle text-primary'
              : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground'
          }`}
        >
          {tab.label} ({tab.count})
        </Link>
      ))}
    </div>
  );
}
