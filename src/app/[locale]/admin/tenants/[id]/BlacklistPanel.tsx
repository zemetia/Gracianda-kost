'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MetricInline } from '@/components/ui/Metric';
import { blacklistReasonLabel, blacklistReasonTone } from '@/lib/blacklist';
import { formatDate } from '@/lib/utils';

import { BlacklistDialog } from '../BlacklistDialog';
import { removeFromBlacklistAction } from '../actions';

interface Props {
  tenantId: string;
  fullName: string;
  isBlacklisted: boolean;
  reason: string | null;
  note: string | null;
  blacklistedAt: string | null;
  blacklistedByName: string | null;
  canManage: boolean;
}

/**
 * Status blacklist di halaman penyewa memakai dialog yang sama dengan halaman
 * daftar hitam. Dulu ini form checkbox + textarea sendiri — dua form untuk satu
 * keputusan berarti aturan "wajib berkategori" hanya berlaku di salah satunya.
 */
export function BlacklistPanel({
  tenantId,
  fullName,
  isBlacklisted,
  reason,
  note,
  blacklistedAt,
  blacklistedByName,
  canManage,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      const result = await removeFromBlacklistAction(tenantId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setConfirming(false);
      toast.success(`${fullName} dikeluarkan dari daftar hitam`);
    });
  };

  if (!isBlacklisted) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-foreground-muted text-sm">
          Tidak ada di daftar hitam. Kontrak baru untuk penyewa ini berjalan tanpa peringatan.
        </p>
        {canManage && (
          <BlacklistDialog
            mode="edit"
            tenant={{ id: tenantId, fullName, reason: null, note: null }}
            renderTrigger={(open) => (
              <Button type="button" variant="secondary" size="sm" onClick={open}>
                Masukkan ke Blacklist
              </Button>
            )}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <Badge variant={blacklistReasonTone(reason)}>{blacklistReasonLabel(reason)}</Badge>
        {canManage && (
          <div className="flex items-center gap-1">
            <BlacklistDialog
              mode="edit"
              tenant={{ id: tenantId, fullName, reason, note }}
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

      {note && (
        <p className="text-foreground-muted text-sm leading-relaxed whitespace-pre-line">{note}</p>
      )}

      <div>
        <MetricInline
          label="Diblacklist"
          value={blacklistedAt ? formatDate(blacklistedAt, 'id-ID') : 'Tidak tercatat'}
        />
        <MetricInline label="Oleh" value={blacklistedByName ?? '—'} />
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Keluarkan ${fullName} dari daftar hitam?`}
        description="Kategori dan kronologinya ikut terhapus, dan kontrak baru untuk orang ini tidak akan memunculkan peringatan lagi. Riwayat keputusannya tetap ada di Audit Log."
        confirmLabel="Keluarkan"
        isPending={isPending}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
