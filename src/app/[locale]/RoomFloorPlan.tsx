'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { buildRoomInquiryMessage, buildWaLink } from '@/lib/whatsapp';
import { siteConfig } from '@/config/site';

export interface PublicRoom {
  id: string;
  number: string;
  price: number;
  sizeSqm: number | null;
  description: string | null;
  status: 'AVAILABLE' | 'OCCUPIED';
  facilities: { id: string; name: string; icon: string | null }[];
  photos: string[];
  videos: string[];
}

export interface PublicFloor {
  id: string;
  name: string;
  rooms: PublicRoom[];
}

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function RoomFloorPlan({ floors }: { floors: PublicFloor[] }) {
  const [selectedRoom, setSelectedRoom] = useState<PublicRoom | null>(null);

  if (floors.every((floor) => floor.rooms.length === 0)) {
    return (
      <Typography variant="muted" className="text-center">
        Data kamar belum tersedia — hubungi admin untuk info terbaru.
      </Typography>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-center gap-6 text-sm text-foreground-muted">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-success" aria-hidden="true" />
          Tersedia
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-destructive" aria-hidden="true" />
          Terisi
        </span>
      </div>

      {floors.map((floor) => (
        <div key={floor.id}>
          <Typography variant="h4" className="mb-4">
            {floor.name}
          </Typography>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {floor.rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoom(room)}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-sm font-semibold transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  room.status === 'AVAILABLE'
                    ? 'border-success/40 bg-success-subtle text-success'
                    : 'border-destructive/40 bg-destructive-subtle text-destructive'
                }`}
              >
                {room.number}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selectedRoom && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedRoom(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface-overlay p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <Typography variant="h3">Kamar {selectedRoom.number}</Typography>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                aria-label="Tutup"
                className="rounded-md p-1 text-foreground-muted hover:bg-surface hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedRoom.photos.length > 0 && (
              <div className="mb-4 flex gap-2 overflow-x-auto">
                {selectedRoom.photos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo}
                    src={photo}
                    alt={`Foto kamar ${selectedRoom.number}`}
                    className="h-40 w-56 shrink-0 rounded-md object-cover"
                  />
                ))}
              </div>
            )}

            {selectedRoom.videos.map((video) => (
              <video key={video} src={video} controls className="mb-4 w-full rounded-md" />
            ))}

            <Badge variant={selectedRoom.status === 'AVAILABLE' ? 'success' : 'destructive'} className="mb-3">
              {selectedRoom.status === 'AVAILABLE' ? 'Tersedia' : 'Terisi'}
            </Badge>

            <Typography variant="h4" className="mb-1">
              {formatRupiah(selectedRoom.price)} / bulan
            </Typography>
            {selectedRoom.sizeSqm && (
              <Typography variant="muted" className="mb-3">
                Ukuran ± {selectedRoom.sizeSqm} m²
              </Typography>
            )}
            {selectedRoom.description && (
              <Typography variant="p" className="mb-3">
                {selectedRoom.description}
              </Typography>
            )}

            {selectedRoom.facilities.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {selectedRoom.facilities.map((facility) => (
                  <Badge key={facility.id} variant="outline">
                    {facility.name}
                  </Badge>
                ))}
              </div>
            )}

            <a
              href={buildWaLink(
                siteConfig.company.whatsappNumber,
                buildRoomInquiryMessage(selectedRoom.number),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button fullWidth>Hubungi Admin</Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
