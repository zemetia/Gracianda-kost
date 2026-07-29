import { CalendarPlus, DoorOpen, LogOut } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
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
    <div className="flex max-w-2xl flex-col gap-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Detail Kontrak</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Typography variant="muted">Harga Sewa</Typography>
            <Typography variant="p">
              Rp {contract.rentPrice.toNumber().toLocaleString('id-ID')} / {formatBillingCycle(contract.billingCycle, contract.billingInterval)}
            </Typography>
          </div>
          <div>
            <Typography variant="muted">Deposit</Typography>
            <Typography variant="p">
              {contract.deposit ? `Rp ${contract.deposit.toNumber().toLocaleString('id-ID')}` : '—'}
            </Typography>
          </div>
          <div>
            <Typography variant="muted">Tanggal Masuk</Typography>
            <Typography variant="p">{contract.startDate.toLocaleDateString('id-ID')}</Typography>
          </div>
          <div>
            <Typography variant="muted">Tanggal Keluar (Target)</Typography>
            <Typography variant="p">
              {contract.endDate ? contract.endDate.toLocaleDateString('id-ID') : '—'}
            </Typography>
          </div>
          {contract.actualEndDate && (
            <div>
              <Typography variant="muted">Tanggal Keluar Aktual</Typography>
              <Typography variant="p">{contract.actualEndDate.toLocaleDateString('id-ID')}</Typography>
            </div>
          )}
          {contract.notes && (
            <div className="col-span-2">
              <Typography variant="muted">Catatan</Typography>
              <Typography variant="p">{contract.notes}</Typography>
            </div>
          )}
        </CardContent>
      </Card>

      {contract.occupants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Penghuni Tambahan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {contract.occupants.map((occupant) => (
              <Badge key={occupant.id} variant="outline">
                {occupant.fullName}
              </Badge>
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
                ? `Sisa tunggakan Rp ${outstanding.toLocaleString('id-ID')} — selesaikan sebelum penyewa keluar.`
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
        <Card>
          <CardHeader>
            <CardTitle>Penyelesaian Deposit</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Typography variant="muted">Potongan</Typography>
              <Typography variant="p">
                Rp {(contract.depositDeduction?.toNumber() ?? 0).toLocaleString('id-ID')}
              </Typography>
            </div>
            <div>
              <Typography variant="muted">Dikembalikan</Typography>
              <Typography variant="p">
                Rp {contract.depositRefunded.toNumber().toLocaleString('id-ID')}
              </Typography>
            </div>
            {contract.depositNote && (
              <div className="col-span-2">
                <Typography variant="muted">Catatan</Typography>
                <Typography variant="p">{contract.depositNote}</Typography>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
