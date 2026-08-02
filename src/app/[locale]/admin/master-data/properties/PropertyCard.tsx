'use client';

import { Clock, DoorClosed, MapPin, Phone, SquareArrowOutUpRight } from 'lucide-react';
import { type ReactNode } from 'react';

import { Badge } from '@/components/ui/Badge';
import { propertyTypeLabel, type PropertyTypeName } from '@/lib/property';

import { RecordActions } from '../RecordActions';
import {
  activatePropertyAction,
  deactivatePropertyAction,
  deletePropertyAction,
} from './actions';

const GENDER_LABEL = {
  PUTRA: 'Khusus Putra',
  PUTRI: 'Khusus Putri',
  CAMPUR: 'Campur',
} as const;

export interface PropertyCardProps {
  id: string;
  name: string;
  code: string;
  type: PropertyTypeName;
  genderPolicy: keyof typeof GENDER_LABEL;
  address: string | null;
  mapsUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  curfewTime: string | null;
  roomCount: number;
  isActive: boolean;
}

export function PropertyCard({
  id,
  name,
  code,
  type,
  genderPolicy,
  address,
  mapsUrl,
  contactName,
  contactPhone,
  whatsappNumber,
  curfewTime,
  roomCount,
  isActive,
}: PropertyCardProps) {
  const contact = [contactName, whatsappNumber ?? contactPhone].filter(Boolean).join(' · ');

  return (
    <article className="border-border bg-card hover:border-border-strong flex flex-col rounded-lg border shadow-sm transition-colors">
      <header className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="min-w-0">
          <h2 className="text-foreground truncate text-base font-semibold">{name}</h2>
          <p className="text-foreground-subtle mt-1 font-mono text-xs tracking-wide">{code}</p>
        </div>
        <Badge variant={isActive ? 'success' : 'outline'} dot>
          {isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      </header>

      <div className="flex flex-wrap gap-1.5 px-5 pb-4">
        <Badge variant="secondary">{propertyTypeLabel(type)}</Badge>
        <Badge variant="outline">{GENDER_LABEL[genderPolicy]}</Badge>
      </div>

      <dl className="border-border flex flex-col gap-2.5 border-t px-5 py-4">
        <InfoRow icon={<MapPin aria-hidden className="size-4" />} label="Alamat">
          {address ? (
            <span className="line-clamp-2">{address}</span>
          ) : (
            <span className="text-foreground-subtle italic">Alamat belum diisi</span>
          )}
        </InfoRow>

        <InfoRow icon={<Phone aria-hidden className="size-4" />} label="Kontak">
          {contact || <span className="text-foreground-subtle italic">Kontak belum diisi</span>}
        </InfoRow>

        <InfoRow icon={<DoorClosed aria-hidden className="size-4" />} label="Jumlah kamar">
          <span className="tabular-nums">{roomCount} kamar</span>
          {curfewTime && (
            <>
              <span aria-hidden className="text-foreground-subtle mx-2">
                |
              </span>
              <Clock aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />
              <span className="tabular-nums">Jam malam {curfewTime}</span>
            </>
          )}
        </InfoRow>
      </dl>

      <div className="mt-auto px-5 pb-3">
        <RecordActions
          name={name}
          isActive={isActive}
          editHref={`/admin/master-data/properties/${id}`}
          deactivateDescription={
            roomCount > 0
              ? `Properti ini punya ${roomCount} kamar. Kontrak yang sedang berjalan tetap aman, tapi properti tidak bisa dipakai untuk kontrak baru dan hilang dari halaman publik.`
              : 'Properti tidak bisa dipakai untuk transaksi baru dan hilang dari halaman publik. Bisa diaktifkan lagi lewat filter Nonaktif.'
          }
          deleteDescription={`Properti beserta ${roomCount} kamar dan seluruh tipe kamarnya hilang dari semua daftar untuk selamanya. Penghapusan ditolak selama masih ada kontrak yang berjalan.`}
          onDeactivate={() => deactivatePropertyAction(id)}
          onActivate={() => activatePropertyAction(id)}
          onDelete={() => deletePropertyAction(id)}
        >
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-muted hover:text-primary focus-visible:ring-primary/25 mr-auto inline-flex items-center gap-1.5 rounded-xs text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <SquareArrowOutUpRight aria-hidden className="size-3.5" />
              Peta
            </a>
          )}
        </RecordActions>
      </div>
    </article>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <dt className="text-foreground-subtle mt-0.5 shrink-0" title={label}>
        <span className="sr-only">{label}</span>
        {icon}
      </dt>
      <dd className="text-foreground-muted min-w-0 leading-relaxed">{children}</dd>
    </div>
  );
}
