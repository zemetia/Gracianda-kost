import { Link } from '@/i18n/navigation';
import { RECORD_STATUS_TABS, type RecordStatus } from '@/lib/record-status';

interface StatusFilterProps {
  status: RecordStatus;
  counts: { active: number; inactive: number };
  basePath: string;
  /** Filters that must survive the switch (propertyId, occupancy, …). */
  params?: Record<string, string | undefined>;
}

/**
 * Aktif / Nonaktif as two separate lists, never one merged list — a parked
 * room in the middle of the rentable ones is a trap. Soft-deleted records have
 * no tab here at all: they are gone, not filtered.
 */
export function StatusFilter({ status, counts, basePath, params }: StatusFilterProps) {
  const hrefFor = (value: RecordStatus) => {
    const search = new URLSearchParams();
    for (const [key, param] of Object.entries(params ?? {})) {
      if (param) search.set(key, param);
    }
    if (value !== 'active') search.set('status', value);
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {RECORD_STATUS_TABS.map((tab) => (
        <Link
          key={tab.value}
          href={hrefFor(tab.value)}
          aria-current={status === tab.value ? 'page' : undefined}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            status === tab.value
              ? 'border-primary bg-primary-subtle text-primary'
              : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground'
          }`}
        >
          {tab.label} ({tab.value === 'active' ? counts.active : counts.inactive})
        </Link>
      ))}
    </div>
  );
}
