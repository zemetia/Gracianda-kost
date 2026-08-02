'use client';

import { TriangleAlert } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Link } from '@/i18n/navigation';
import { blacklistReasonLabel, blacklistReasonTone } from '@/lib/blacklist';
import { formatDate } from '@/lib/utils';

import { BlacklistDialog } from '../BlacklistDialog';
import { removeFromBlacklistAction } from '../actions';

export interface BlacklistEntry {
  id: string;
  fullName: string;
  ktpNumber: string;
  phone: string;
  reason: string | null;
  note: string | null;
  blacklistedAt: string | null;
  blacklistedByName: string | null;
  /** Kontrak yang masih ACTIVE — orangnya belum benar-benar keluar. */
  activeContracts: { id: string; contractCode: string; roomNumber: string; propertyName: string }[];
}

interface BlacklistCardProps {
  entry: BlacklistEntry;
  /** KEUANGAN boleh membaca daftar ini, tapi tidak mengubahnya. */
  canManage: boolean;
}

export function BlacklistCard({ entry, canManage }: BlacklistCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      const result = await removeFromBlacklistAction(entry.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setConfirming(false);
      toast.success(`${entry.fullName} dikeluarkan dari daftar hitam`);
    });
  };

  return (
    <article className="border-border bg-card shadow-card flex flex-col gap-4 rounded-lg border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admin/tenants/${entry.id}`}
            className="text-foreground font-semibold hover:underline"
          >
            {entry.fullName}
          </Link>
          <p className="text-foreground-muted mt-0.5 text-sm tabular-nums">
            KTP {entry.ktpNumber} · {entry.phone}
          </p>
        </div>
        <Badge variant={blacklistReasonTone(entry.reason)} className="shrink-0">
          {blacklistReasonLabel(entry.reason)}
        </Badge>
      </div>

      {/* Alasan halaman ini ada: yang sudah diblacklist tapi masih tinggal di
          sini adalah pekerjaan yang belum selesai, bukan arsip. */}
      {entry.activeContracts.length > 0 && (
        <div className="border-destructive/30 bg-destructive-subtle text-destructive flex items-start gap-2 rounded-md border p-3 text-sm">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <p>
            Masih menghuni —{' '}
            {entry.activeContracts.map((contract, index) => (
              <span key={contract.id}>
                {index > 0 && ', '}
                <Link href={`/admin/contracts/${contract.id}`} className="font-semibold underline">
                  {contract.contractCode}
                </Link>{' '}
                (Kamar {contract.roomNumber}, {contract.propertyName})
              </span>
            ))}
          </p>
        </div>
      )}

      {entry.note && (
        <p className="text-foreground-muted text-sm leading-relaxed whitespace-pre-line">
          {entry.note}
        </p>
      )}

      <div className="border-border mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p className="text-foreground-subtle text-xs">
          {entry.blacklistedAt
            ? `Diblacklist ${formatDate(entry.blacklistedAt, 'id-ID')}`
            : 'Tanggal tidak tercatat'}
          {entry.blacklistedByName ? ` oleh ${entry.blacklistedByName}` : ''}
        </p>

        {canManage && (
          <div className="flex items-center gap-1">
            <BlacklistDialog
              mode="edit"
              tenant={{
                id: entry.id,
                fullName: entry.fullName,
                reason: entry.reason,
                note: entry.note,
              }}
              renderTrigger={(open) => (
                <Button type="button" variant="ghost" size="sm" onClick={open}>
                  Ubah
                </Button>
              )}
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirming(true)}
            >
              Keluarkan
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Keluarkan ${entry.fullName} dari daftar hitam?`}
        description="Kategori dan kronologinya ikut terhapus, dan kontrak baru untuk orang ini tidak akan memunculkan peringatan lagi. Riwayat keputusannya tetap ada di Audit Log."
        confirmLabel="Keluarkan"
        isPending={isPending}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </article>
  );
}
