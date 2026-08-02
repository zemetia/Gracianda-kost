'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Money } from '@/components/ui/Money';
import { Link } from '@/i18n/navigation';

import { RecordActions } from '../RecordActions';
import {
  activateRoomTypeAction,
  deactivateRoomTypeAction,
  deleteRoomTypeAction,
} from './actions';

export interface RoomTypeCardProps {
  id: string;
  propertyId: string;
  name: string;
  price: number | null;
  facilityNames: string[];
  roomCount: number;
  isActive: boolean;
}

export function RoomTypeCard({
  id,
  propertyId,
  name,
  price,
  facilityNames,
  roomCount,
  isActive,
}: RoomTypeCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-foreground truncate text-base font-semibold">{name}</p>
        <Badge variant={isActive ? 'success' : 'outline'}>{isActive ? 'Aktif' : 'Nonaktif'}</Badge>
      </div>

      <p>
        <Money value={price} size="total" />
        <span className="text-foreground-muted ml-1 text-xs font-normal">/bulan (acuan)</span>
      </p>

      <p className="text-foreground-muted line-clamp-2 text-sm">
        {facilityNames.length > 0
          ? facilityNames.join(', ')
          : 'Belum ada fasilitas ditambahkan.'}
      </p>

      <Link
        href={`/admin/master-data/rooms?propertyId=${propertyId}`}
        className="text-foreground-muted hover:text-primary text-sm hover:underline"
      >
        <span className="text-foreground font-medium tabular-nums">{roomCount}</span> kamar memakai
        tipe ini
      </Link>

      <RecordActions
        name={`Tipe ${name}`}
        isActive={isActive}
        editHref={`/admin/master-data/room-types/${id}`}
        deactivateDescription="Tipe berhenti ditawarkan saat menambah kamar baru. Kamar yang sudah memakainya tetap mewarisi fasilitas dan fotonya."
        deleteDescription={
          roomCount > 0
            ? `${roomCount} kamar masih memakai tipe ini — penghapusan akan ditolak sampai kamarnya dipindah ke tipe lain.`
            : 'Tipe hilang dari semua daftar untuk selamanya, termasuk dari halaman publik.'
        }
        onDeactivate={() => deactivateRoomTypeAction(id)}
        onActivate={() => activateRoomTypeAction(id)}
        onDelete={() => deleteRoomTypeAction(id)}
      />
    </Card>
  );
}
