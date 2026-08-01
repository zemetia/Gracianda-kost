import { Money } from '@/components/ui/Money';
import { Link } from '@/i18n/navigation';
import { formatRoomSize } from '@/lib/utils';
import type { CatalogRoom } from '@/services/catalog.service';

export interface RoomUnitCardProps {
  room: CatalogRoom;
  /** Print the type name too — needed when the grid mixes types (search results). */
  showType?: boolean;
}

/**
 * A specific unit: number, vacancy, price. Same visual family as the type card
 * it sits under, one level quieter — this is a choice within a choice.
 */
export function RoomUnitCard({ room, showType = false }: RoomUnitCardProps) {
  const isAvailable = room.status === 'AVAILABLE';
  const size = formatRoomSize(room.lengthM, room.widthM);

  return (
    <Link
      href={`/kamar/${room.id}`}
      className={`group flex flex-col justify-between gap-4 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
        isAvailable
          ? 'border-success/25 bg-success-subtle/10 hover:border-success/50'
          : 'border-border/40 bg-surface-raised/30 hover:border-border-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isAvailable ? 'bg-success/15 text-success' : 'bg-foreground-subtle/10 text-foreground-muted'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-success' : 'bg-foreground-muted'}`}
            aria-hidden
          />
          {isAvailable ? 'Kosong' : 'Terisi'}
        </span>
        {size && <span className="text-[11px] font-semibold text-foreground-subtle">{size}</span>}
      </div>

      <div>
        <p className="text-lg font-bold tracking-tight text-foreground">Kamar {room.number}</p>
        <p className="text-xs font-semibold text-foreground-muted">
          {showType ? (room.roomTypeName ?? 'Tanpa tipe') : (room.floorName ?? 'Unit hunian')}
        </p>
        <div className="mt-2">
          {/* Full figure, not `short`: 1.750.000 and 1.800.000 both compact to
              "1,8 jt", and two units at different prices must not read alike. */}
          <Money value={room.price} size="inline" tone="primary" />
          <span className="ml-1 text-[10px] font-normal text-foreground-muted">/bulan</span>
        </div>
      </div>
    </Link>
  );
}
