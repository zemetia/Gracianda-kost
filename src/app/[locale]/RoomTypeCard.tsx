import { DoorOpen, Ruler } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Money } from '@/components/ui/Money';
import { Link } from '@/i18n/navigation';
import { formatRoomSize } from '@/lib/utils';
import type { CatalogGroup } from '@/services/catalog.service';

/** Placeholder art so a type without an uploaded gallery still reads as a room. */
const FALLBACK_PHOTOS = ['/kost_room_1.jpg', '/kost_room_2.jpg'] as const;

function fallbackPhoto(seed: string): string {
  const index = seed.charCodeAt(seed.length - 1) % FALLBACK_PHOTOS.length;
  return FALLBACK_PHOTOS[index] ?? FALLBACK_PHOTOS[0];
}

export interface RoomTypeCardProps {
  group: CatalogGroup;
  /** Show which property the type belongs to — on by default when the list spans properties. */
  showProperty?: boolean;
}

/**
 * One room TYPE as a shopping card: what it costs, what it includes, and how
 * many of its units are still free. The unit numbers live one click deeper —
 * nobody picks a kost by room number.
 */
export function RoomTypeCard({ group, showProperty = false }: RoomTypeCardProps) {
  const photo = group.photos[0] ?? fallbackPhoto(group.id);
  const size = formatRoomSize(group.lengthM, group.widthM);
  const isFull = group.availableRooms === 0;
  const visibleFacilities = group.facilities.slice(0, 4);
  const hiddenFacilities = group.facilities.length - visibleFacilities.length;

  return (
    <Link
      href={`/tipe-kamar/${group.id}`}
      className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-border/50 bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={`Tipe kamar ${group.name}`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
        <span className="absolute top-4 left-4">
          <Badge variant={isFull ? 'secondary' : 'success'} size="lg" dot>
            {isFull ? 'Penuh' : `${group.availableRooms} kamar kosong`}
          </Badge>
        </span>
        {group.roomTypeId === null && (
          <span className="absolute top-4 right-4">
            <Badge variant="warning" size="lg">
              Tanpa tipe
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <p className="text-lg font-bold tracking-tight text-foreground">{group.name}</p>
          {showProperty && (
            <p className="mt-0.5 text-xs font-semibold text-foreground-muted">
              {group.propertyName}
              {group.propertyCity ? ` · ${group.propertyCity}` : ''}
            </p>
          )}
          {group.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground-muted">
              {group.description}
            </p>
          )}
        </div>

        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-foreground-muted">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Jumlah unit</dt>
            <DoorOpen className="h-4 w-4 text-primary" aria-hidden />
            <dd>
              {group.availableRooms} dari {group.totalRooms} kamar kosong
            </dd>
          </div>
          {size && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Ukuran kamar</dt>
              <Ruler className="h-4 w-4 text-primary" aria-hidden />
              <dd>{size}</dd>
            </div>
          )}
        </dl>

        {visibleFacilities.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {visibleFacilities.map((facility) => (
              <li
                key={facility.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-surface-raised px-2.5 py-1 text-[11px] font-semibold text-foreground-muted"
              >
                <Icon name={facility.icon} className="h-3.5 w-3.5 text-primary" />
                {facility.name}
              </li>
            ))}
            {hiddenFacilities > 0 && (
              <li className="inline-flex items-center rounded-full border border-border/50 px-2.5 py-1 text-[11px] font-semibold text-foreground-subtle">
                +{hiddenFacilities} lainnya
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/30 pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
              {group.priceFrom === group.priceTo ? 'Harga sewa' : 'Mulai dari'}
            </p>
            {/* Not `short` — rounding "mulai dari 1.750.000" up to "1,8 jt"
                overstates the cheapest unit, which is a price claim. */}
            <Money value={group.priceFrom} size="secondary" tone="primary" />
            <span className="ml-1 text-xs font-normal text-foreground-muted">/bulan</span>
          </div>
          <span className="text-sm font-bold text-primary transition-transform group-hover:translate-x-0.5">
            Lihat kamar →
          </span>
        </div>
      </div>
    </Link>
  );
}
