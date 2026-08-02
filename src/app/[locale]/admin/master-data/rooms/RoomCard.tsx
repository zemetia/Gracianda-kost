'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Money } from '@/components/ui/Money';
import { Link } from '@/i18n/navigation';

import { RecordActions } from '../RecordActions';
import { activateRoomAction, deactivateRoomAction, deleteRoomAction } from './actions';
import { DuplicateRoomDialog } from './DuplicateRoomDialog';

interface Floor {
  id: string;
  name: string;
}

export interface RoomCardProps {
  id: string;
  number: string;
  floorId: string | null;
  floorName: string | null;
  roomTypeId: string | null;
  roomTypeName: string | null;
  price: number;
  isActive: boolean;
  isOccupied: boolean;
  floors: Floor[];
}

export function RoomCard({
  id,
  number,
  floorId,
  floorName,
  roomTypeId,
  roomTypeName,
  price,
  isActive,
  isOccupied,
  floors,
}: RoomCardProps) {
  const name = `Kamar ${number}`;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-foreground truncate text-base font-semibold">{number}</p>
          <p className="text-foreground-muted text-xs">{floorName || '—'}</p>
        </div>
        <Badge variant={isActive ? 'success' : 'outline'}>{isActive ? 'Aktif' : 'Nonaktif'}</Badge>
      </div>

      <div className="flex items-center justify-between gap-2">
        {roomTypeId && roomTypeName ? (
          <Link
            href={`/admin/master-data/room-types/${roomTypeId}`}
            className="text-foreground-muted hover:text-foreground truncate text-sm hover:underline"
          >
            {roomTypeName}
          </Link>
        ) : (
          <span className="text-foreground-muted text-sm">—</span>
        )}
        <Badge variant={isOccupied ? 'destructive' : 'success'}>
          {isOccupied ? 'Terisi' : 'Tersedia'}
        </Badge>
      </div>

      <p>
        <Money value={price} size="total" />
        <span className="text-foreground-muted ml-1 text-xs font-normal">/bulan</span>
      </p>

      <RecordActions
        name={name}
        isActive={isActive}
        editHref={`/admin/master-data/rooms/${id}`}
        deactivateDescription="Kamar hilang dari halaman publik dan tidak bisa dipilih untuk kontrak baru. Masih terlihat di filter Nonaktif dan bisa diaktifkan lagi kapan saja."
        deleteDescription={
          isOccupied
            ? 'Kamar ini sedang terisi kontrak aktif — penghapusan akan ditolak sampai kontraknya diakhiri.'
            : 'Kamar hilang dari semua daftar untuk selamanya. Riwayat kontrak dan pembayarannya tetap tersimpan, tapi kamar ini tidak akan pernah muncul lagi.'
        }
        onDeactivate={() => deactivateRoomAction(id)}
        onActivate={() => activateRoomAction(id)}
        onDelete={() => deleteRoomAction(id)}
      >
        <DuplicateRoomDialog roomId={id} roomNumber={number} floorId={floorId} floors={floors} />
      </RecordActions>
    </Card>
  );
}
