import { CalendarPlus, DoorOpen, LogOut } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { MetricInline } from '@/components/ui/Metric';
import { Money } from '@/components/ui/Money';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { genderLabel } from '@/lib/tenant';
import { formatDate, formatRupiah } from '@/lib/utils';
import { contractService } from '@/services/contract.service';
import { paymentService } from '@/services/payment.service';

import { ContractCreatedBanner } from './ContractCreatedBanner';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif',
  ENDED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const CYCLE_LABEL: Record<string, string> = {
  DAILY: 'Harian',
  WEEKLY: 'Mingguan',
  MONTHLY: 'Bulanan',
  YEARLY: 'Tahunan',
};

function formatBillingCycle(cycle: string, interval: number): string {
  const label = CYCLE_LABEL[cycle] || cycle;
  if (interval === 1) return label;
  return `${interval} ${label}`;
}

// The three things an admin actually wants to do with a running contract.
// Naming them by intent means no one has to translate "perpanjang" into
// "tutup kontrak lalu buat kontrak baru" ever again.
const INTENTS = [
  {
    href: 'renew',
    icon: CalendarPlus,
    title: 'Perpanjang',
    description: 'Lanjut di kamar yang sama untuk masa sewa berikutnya.',
  },
  {
    href: 'transfer',
    icon: DoorOpen,
    title: 'Pindah Kamar',
    description: 'Penyewa sama, kamar berbeda, mulai tanggal pindah.',
  },
  {
    href: 'checkout',
    icon: LogOut,
    title: 'Check-out',
    description: 'Penyewa keluar: tunggakan, deposit, dan kondisi kamar.',
  },
] as const;

export default async function ContractDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { created } = await searchParams;
  const contract = await contractService.getById(id);
  if (!contract) notFound();

  const outstanding = await paymentService.getOutstandingByContract(id);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            {contract.contractCode}
          </Typography>
          <Typography variant="muted">
            <Link href={`/admin/tenants/${contract.tenantId}`} className="hover:underline">
              {contract.tenant.fullName}
            </Link>{' '}
            · {contract.room.property.name} · Unit {contract.room.number} {contract.room.floor ? `(${contract.room.floor.name})` : ''}
          </Typography>
        </div>
        <Badge variant={contract.status === 'ACTIVE' ? 'success' : 'outline'}>
          {STATUS_LABEL[contract.status]}
        </Badge>
      </div>

      {created === '1' && (
        <ContractCreatedBanner
          tenantId={contract.tenantId}
          tenantName={contract.tenant.fullName}
          tenantPhone={contract.tenant.phone}
          contractCode={contract.contractCode}
          roomNumber={contract.room.number}
          rentPrice={contract.rentPrice.toNumber()}
          billingCycle={contract.billingCycle}
          billingInterval={contract.billingInterval}
          startDate={contract.startDate}
        />
      )}

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Detail Kontrak
        </h3>
        <div className="mt-3">
          <MetricInline
            label="Harga sewa"
            value={
              <>
                <Money value={contract.rentPrice.toNumber()} />
                <span className="ml-1 text-xs font-normal text-foreground-muted">
                  / {formatBillingCycle(contract.billingCycle, contract.billingInterval)}
                </span>
              </>
            }
          />
          <MetricInline
            label="Deposit"
            value={<Money value={contract.deposit ? contract.deposit.toNumber() : null} />}
          />
          <MetricInline label="Tanggal masuk" value={formatDate(contract.startDate, 'id-ID')} />
          <MetricInline
            label="Tanggal keluar (target)"
            value={contract.endDate ? formatDate(contract.endDate, 'id-ID') : '—'}
          />
          {contract.actualEndDate && (
            <MetricInline
              label="Tanggal keluar aktual"
              value={formatDate(contract.actualEndDate, 'id-ID')}
            />
          )}
          {contract.notes && <MetricInline label="Catatan" value={contract.notes} />}
        </div>
      </section>

      {contract.occupants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Penghuni Tambahan</CardTitle>
            <CardDescription>
              Kamar ini dihuni {contract.occupants.length + 1} orang, termasuk penyewa utama.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {contract.occupants.map((occupant) => (
              <div key={occupant.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Typography variant="large" as="span">
                    {occupant.fullName}
                  </Typography>
                  {occupant.relation && <Badge variant="outline">{occupant.relation}</Badge>}
                  {occupant.gender && <Badge variant="outline">{genderLabel(occupant.gender)}</Badge>}
                </div>
                <Typography variant="muted">
                  {[
                    occupant.phone,
                    occupant.ktpNumber ? `KTP ${occupant.ktpNumber}` : '',
                    occupant.occupation,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Tidak ada data kontak.'}
                </Typography>
                {occupant.notes && <Typography variant="muted">{occupant.notes}</Typography>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(contract.previousContract || contract.nextContract) && (
        <Card>
          <CardHeader>
            <CardTitle>Rantai Kontrak</CardTitle>
            <CardDescription>Kontrak ini bagian dari satu masa tinggal yang berlanjut.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            {contract.previousContract && (
              <Link
                href={`/admin/contracts/${contract.previousContract.id}`}
                className="text-primary hover:underline"
              >
                ← Sebelumnya: {contract.previousContract.contractCode}
              </Link>
            )}
            {contract.nextContract && (
              <Link
                href={`/admin/contracts/${contract.nextContract.id}`}
                className="text-primary hover:underline"
              >
                Lanjutan: {contract.nextContract.contractCode} →
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {contract.status === 'ACTIVE' && (
        <Card>
          <CardHeader>
            <CardTitle>Tindakan</CardTitle>
            <CardDescription>
              {outstanding > 0
                ? `Sisa tunggakan ${formatRupiah(outstanding)} — selesaikan sebelum penyewa keluar.`
                : 'Semua tagihan kontrak ini sudah lunas.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {INTENTS.map((intent) => (
              <Link
                key={intent.href}
                href={`/admin/contracts/${contract.id}/${intent.href}`}
                className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface-raised p-4 transition-colors hover:border-primary/40 hover:bg-primary-subtle"
              >
                <intent.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">{intent.title}</span>
                <span className="text-xs leading-relaxed text-foreground-muted">
                  {intent.description}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {contract.status !== 'ACTIVE' && contract.depositRefunded !== null && (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Penyelesaian Deposit
          </h3>
          <div className="mt-3">
            <MetricInline
              label="Potongan"
              value={
                <Money
                  value={contract.depositDeduction?.toNumber() ?? 0}
                  tone={
                    Number(contract.depositDeduction?.toNumber() ?? 0) > 0 ? 'destructive' : undefined
                  }
                />
              }
            />
            <MetricInline
              label="Dikembalikan"
              value={<Money value={contract.depositRefunded.toNumber()} />}
            />
            {contract.depositNote && <MetricInline label="Catatan" value={contract.depositNote} />}
          </div>
        </section>
      )}
    </div>
  );
}
