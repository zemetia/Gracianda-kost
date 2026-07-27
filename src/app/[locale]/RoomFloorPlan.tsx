'use client';

import { useState } from 'react';
import { X, Wifi, Bed, Shield, Tv, Sparkles, AlertCircle, Info, Copy } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { useToast } from '@/hooks';
import { buildWaLink } from '@/lib/whatsapp';
import { siteConfig } from '@/config/site';

export interface PublicRoom {
  id: string;
  number: string;
  price: number;
  sizeSqm: number | null;
  description: string | null;
  status: 'AVAILABLE' | 'OCCUPIED';
  facilities: { id: string; name: string; icon: string | null }[];
  prices: { id: string; billingCycle: string; interval: number; price: number }[];
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

function formatRupiahShort(value: number): string {
  if (value >= 1000000) {
    const million = value / 1000000;
    return `Rp ${million.toFixed(1).replace('.0', '')} jt`;
  }
  return `Rp ${(value / 1000).toFixed(0)}k`;
}

// Facility icons mapping
const FACILITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  ac: <Sparkles className="h-4 w-4" />, // representing cool air
  kasur: <Bed className="h-4 w-4" />,
  springbed: <Bed className="h-4 w-4" />,
  tv: <Tv className="h-4 w-4" />,
  kamar_mandi: <AlertCircle className="h-4 w-4" />, // default placeholder
};

export function RoomFloorPlan({ floors }: { floors: PublicFloor[] }) {
  const [selectedRoom, setSelectedRoom] = useState<PublicRoom | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL');
  const { success } = useToast();

  if (floors.every((floor) => floor.rooms.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-foreground-subtle" />
        <Typography variant="muted" className="max-w-md">
          Data kamar belum tersedia. Hubungi admin untuk mendapatkan info ketersediaan terbaru langsung melalui WhatsApp.
        </Typography>
      </div>
    );
  }

  // Count available rooms
  const totalRooms = floors.reduce((acc, f) => acc + f.rooms.length, 0);
  const availableRooms = floors.reduce((acc, f) => acc + f.rooms.filter(r => r.status === 'AVAILABLE').length, 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Overview Stats & Filters */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-border/50 bg-surface/50 p-6 sm:flex-row sm:items-center">
        <div>
          <Typography variant="small" className="text-foreground-muted">
            Total Unit: <span className="font-semibold text-foreground">{totalRooms} Kamar</span>
          </Typography>
          <div className="mt-1 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-success"></span>
            </span>
            <Typography variant="small" className="font-medium text-success">
              {availableRooms} Kamar Tersedia
            </Typography>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'AVAILABLE', 'OCCUPIED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-primary text-primary-foreground shadow-primary-glow'
                  : 'border border-border/50 bg-surface hover:bg-surface-raised text-foreground-muted hover:text-foreground'
              }`}
            >
              {status === 'ALL' && 'Semua'}
              {status === 'AVAILABLE' && 'Tersedia'}
              {status === 'OCCUPIED' && 'Terisi'}
            </button>
          ))}
        </div>
      </div>

      {/* Building Stack Visual */}
      <div className="flex flex-col gap-6">
        {floors
          .slice()
          .reverse() // Display top floor at the top, like a real building
          .map((floor) => {
            const filteredRooms = floor.rooms.filter((room) => {
              if (filterStatus === 'ALL') return true;
              return room.status === filterStatus;
            });

            if (filteredRooms.length === 0) return null;

            const floorAvailableCount = filteredRooms.filter(r => r.status === 'AVAILABLE').length;

            return (
              <div
                key={floor.id}
                className="group relative flex flex-col gap-4 rounded-2xl border border-border/40 bg-surface p-6 shadow-md transition-all hover:border-border-strong hover:shadow-lg"
              >
                {/* Floor Header Badge */}
                <div className="flex flex-col justify-between gap-2 border-b border-border/30 pb-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle text-primary font-bold">
                      {floor.name.match(/\d+/) ? floor.name.match(/\d+/)?.[0] : floor.name[0]}
                    </span>
                    <div>
                      <Typography variant="large" className="font-bold tracking-tight">
                        {floor.name}
                      </Typography>
                      <Typography variant="small" className="text-foreground-muted">
                        Kamar lantai {floor.name.toLowerCase()}
                      </Typography>
                    </div>
                  </div>
                  <Badge variant={floorAvailableCount > 0 ? 'success' : 'secondary'} className="self-start sm:self-center">
                    {floorAvailableCount > 0 ? `${floorAvailableCount} Kamar Kosong` : 'Penuh'}
                  </Badge>
                </div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredRooms.map((room) => {
                    const isAvailable = room.status === 'AVAILABLE';
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setSelectedRoom(room)}
                        className={`group/room relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                          isAvailable
                            ? 'border-success/20 bg-success-subtle/5 hover:border-success/50 hover:bg-success-subtle/10'
                            : 'border-border/30 bg-surface-raised/20 hover:border-destructive/30 hover:bg-destructive-subtle/5'
                        }`}
                      >
                        {/* Top indicators */}
                        <div className="flex items-start justify-between">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isAvailable
                              ? 'bg-success/15 text-success'
                              : 'bg-foreground-subtle/10 text-foreground-muted'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-success' : 'bg-foreground-muted'}`} />
                            {isAvailable ? 'Tersedia' : 'Terisi'}
                          </span>
                          <span className="text-xs text-foreground-subtle group-hover/room:text-foreground-muted font-mono">
                            {room.sizeSqm ? `${room.sizeSqm}m²` : ''}
                          </span>
                        </div>

                        {/* Room Number & Price */}
                        <div className="mt-4">
                          <Typography className="text-lg font-bold tracking-tight text-foreground">
                            No. {room.number}
                          </Typography>
                          <Typography className="mt-1 text-sm font-semibold text-primary">
                            {formatRupiahShort(room.price)}
                            <span className="text-[10px] font-normal text-foreground-muted">/bln</span>
                          </Typography>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Room Detail Drawer Overlay */}
      {selectedRoom && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedRoom(null)}
        >
          {/* Drawer content sliding from the right */}
          <div
            className="flex h-full w-full max-w-lg flex-col border-l border-border bg-surface shadow-2xl transition-transform animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border/50 p-6">
              <div>
                <Typography variant="h3" className="font-bold tracking-tight">
                  Kamar {selectedRoom.number}
                </Typography>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={selectedRoom.status === 'AVAILABLE' ? 'success' : 'secondary'}>
                    {selectedRoom.status === 'AVAILABLE' ? 'Tersedia' : 'Terisi'}
                  </Badge>
                  {selectedRoom.sizeSqm && (
                    <Typography variant="small" className="text-foreground-muted">
                      Dimensi: ± {selectedRoom.sizeSqm} m²
                    </Typography>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                aria-label="Tutup"
                className="rounded-xl border border-border bg-surface-raised p-2 text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Image Carousel / Display */}
              <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface-raised">
                {selectedRoom.photos.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto p-2 scrollbar-none">
                    {selectedRoom.photos.map((photo, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={photo}
                        src={photo}
                        alt={`Foto kamar ${selectedRoom.number} - ${i + 1}`}
                        className="h-52 w-80 shrink-0 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  // Elegant fallback images based on room number parity
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={parseInt(selectedRoom.number) % 2 === 0 ? '/kost_room_2.jpg' : '/kost_room_1.jpg'}
                    alt={`Preview Kamar ${selectedRoom.number}`}
                    className="h-64 w-full object-cover"
                  />
                )}
              </div>

              {/* Pricing Options */}
              <div className="mb-6 flex flex-col gap-3">
                <Typography variant="small" className="text-foreground-muted uppercase tracking-wider font-bold">
                  Pilihan Paket Sewa
                </Typography>
                <div className="flex flex-col gap-2">
                  {selectedRoom.prices && selectedRoom.prices.length > 0 ? (
                    selectedRoom.prices.map((p) => {
                      let cycleText = '';
                      let perText = '';
                      if (p.billingCycle === 'DAILY') {
                        cycleText = 'Sewa Harian';
                        perText = 'hari';
                      } else if (p.billingCycle === 'WEEKLY') {
                        cycleText = 'Sewa Mingguan';
                        perText = 'minggu';
                      } else if (p.billingCycle === 'MONTHLY') {
                        cycleText = p.interval === 1 ? 'Sewa Bulanan' : `Sewa ${p.interval} Bulanan`;
                        perText = p.interval === 1 ? 'bulan' : `${p.interval} bulan`;
                      } else if (p.billingCycle === 'YEARLY') {
                        cycleText = 'Sewa Tahunan';
                        perText = 'tahun';
                      }
                      
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl border border-border/50 bg-primary-subtle/5 px-4 py-3"
                        >
                          <div>
                            <Typography className="text-xs font-bold text-foreground">{cycleText}</Typography>
                            <Typography className="text-[10px] text-foreground-muted mt-0.5">
                              Pembayaran dimuka per {perText}
                            </Typography>
                          </div>
                          <Typography className="text-sm font-extrabold text-primary">
                            {formatRupiah(p.price)}
                            <span className="text-[10px] font-normal text-foreground-muted"> / {perText}</span>
                          </Typography>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary-subtle/5 px-4 py-3">
                      <div>
                        <Typography className="text-xs font-bold text-foreground">Sewa Bulanan</Typography>
                        <Typography className="text-[10px] text-foreground-muted mt-0.5">
                          Sewa standar bulanan
                        </Typography>
                      </div>
                      <Typography className="text-sm font-extrabold text-primary">
                        {formatRupiah(selectedRoom.price)}
                        <span className="text-[10px] font-normal text-foreground-muted"> / bulan</span>
                      </Typography>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedRoom.description && (
                <div className="mb-6">
                  <Typography variant="h5" className="mb-2 font-bold text-foreground">
                    Deskripsi Kamar
                  </Typography>
                  <Typography className="text-sm leading-relaxed text-foreground-muted">
                    {selectedRoom.description}
                  </Typography>
                </div>
              )}

              {/* Room Facilities */}
              <div className="mb-6">
                <Typography variant="h5" className="mb-3 font-bold text-foreground">
                  Fasilitas Kamar
                </Typography>
                {selectedRoom.facilities.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRoom.facilities.map((fac) => {
                      const cleanName = fac.name.toLowerCase().replace(/\s+/g, '_');
                      const icon = FACILITY_ICONS[cleanName] || <Sparkles className="h-4 w-4 text-primary" />;
                      return (
                        <div key={fac.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-raised p-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-primary">
                            {icon}
                          </span>
                          <span className="text-xs font-semibold text-foreground-muted">{fac.name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Default Premium facilities fallback
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Kamar Mandi Dalam', icon: <Sparkles className="h-4 w-4" /> },
                      { name: 'Air Conditioning (AC)', icon: <Sparkles className="h-4 w-4" /> },
                      { name: 'WiFi Kecepatan Tinggi', icon: <Wifi className="h-4 w-4" /> },
                      { name: 'Kasur Springbed', icon: <Bed className="h-4 w-4" /> },
                      { name: 'Lemari Pakaian', icon: <Shield className="h-4 w-4" /> },
                      { name: 'Meja Kerja & Kursi', icon: <Tv className="h-4 w-4" /> },
                    ].map((fac, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface-raised p-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-primary">
                          {fac.icon}
                        </span>
                        <span className="text-xs font-semibold text-foreground-muted">{fac.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Informative Help Text */}
              <div className="rounded-xl border border-border bg-surface-raised/40 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
                  <Typography variant="small" className="text-xs text-foreground-muted leading-relaxed">
                    Setiap kamar di Gracianda House telah melalui proses pembersihan sanitasi berkala dan pengecekan utilitas sebelum diserahterimakan kepada penghuni baru.
                  </Typography>
                </div>
              </div>
            </div>

            {/* Drawer Footer CTA */}
            <div className="flex flex-col gap-3 border-t border-border/50 p-6 bg-surface-raised">
              <a
                href={buildWaLink(
                  siteConfig.company.whatsappNumber,
                  selectedRoom.status === 'AVAILABLE'
                    ? `Halo Admin Gracianda House, saya tertarik untuk menyewa Kamar *${selectedRoom.number}* (berstatus *Tersedia*). Saya ingin menanyakan tentang paket sewa yang tersedia. Apakah saya bisa menjadwalkan kunjungan survei lokasi?`
                    : `Halo Admin Gracianda House, saya ingin menanyakan tentang Kamar *${selectedRoom.number}* (berstatus *Terisi*). Kapan perkiraan tanggal sewa kamar tersebut berakhir atau adakah waiting list untuk kamar sejenis?`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button size="lg" className="w-full font-bold shadow-primary-glow">
                  {selectedRoom.status === 'AVAILABLE' ? 'Hubungi Admin — Tanya Detail' : 'Tanyakan Estimasi Kosong'}
                </Button>
              </a>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                leftIcon={<Copy className="h-4 w-4" />}
                onClick={() => {
                  const statusText = selectedRoom.status === 'AVAILABLE' ? 'Tersedia' : 'Terisi';
                  const sizeText = selectedRoom.sizeSqm ? ` (± ${selectedRoom.sizeSqm} m²)` : '';
                  
                  let priceInfo = '';
                  if (selectedRoom.prices && selectedRoom.prices.length > 0) {
                    priceInfo = selectedRoom.prices
                      .map((p) => {
                        let cycleName = '';
                        if (p.billingCycle === 'DAILY') cycleName = 'Hari';
                        else if (p.billingCycle === 'WEEKLY') cycleName = 'Minggu';
                        else if (p.billingCycle === 'MONTHLY') cycleName = p.interval === 1 ? 'Bulan' : `${p.interval} Bulan`;
                        else if (p.billingCycle === 'YEARLY') cycleName = 'Tahun';
                        return `- ${cycleName}: ${formatRupiah(p.price)}`;
                      })
                      .join('\n');
                  } else {
                    priceInfo = `- Bulan: ${formatRupiah(selectedRoom.price)}`;
                  }

                  const infoText = `Informasi Kamar Gracianda House:
Kamar No: ${selectedRoom.number}
Status: ${statusText}
Tipe/Dimensi: Kamar Studio${sizeText}
Pilihan Harga Sewa:
${priceInfo}`;

                  navigator.clipboard.writeText(infoText).then(() => {
                    success('Informasi kamar berhasil disalin ke papan klip!');
                  });
                }}
              >
                Salin Info Kamar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

