'use client';

import { Ban, ShieldCheck, SquarePen } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Link } from '@/i18n/navigation';

import { removeFromBlacklistAction } from './actions';
import { BlacklistDialog } from './BlacklistDialog';

interface Props {
  tenant: {
    id: string;
    fullName: string;
    ktpNumber: string;
    phone: string;
    isBlacklisted: boolean;
    blacklistReason: string | null;
    blacklistNote: string | null;
  };
}

/**
 * Row-level actions in the tenant list: edit the identity, or flag the person.
 * Icon-only because the column repeats on every row — the label lives in
 * `aria-label`/`title`, not in the width of the table.
 */
export function TenantRowActions({ tenant }: Props) {
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [isPending, startTransition] = useTransition();

  const removeFromBlacklist = () => {
    startTransition(async () => {
      const result = await removeFromBlacklistAction(tenant.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setConfirmingRemoval(false);
      toast.success(`${tenant.fullName} keluar dari daftar hitam`);
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/tenants/${tenant.id}/edit`}>
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${tenant.fullName}`} title="Edit data">
          <SquarePen aria-hidden className="size-4" />
        </Button>
      </Link>

      {tenant.isBlacklisted ? (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          className="text-destructive hover:text-destructive"
          aria-label={`Keluarkan ${tenant.fullName} dari daftar hitam`}
          title="Keluarkan dari daftar hitam"
          onClick={() => setConfirmingRemoval(true)}
        >
          <ShieldCheck aria-hidden className="size-4" />
        </Button>
      ) : (
        // `tenant` is passed alongside mode="add" purely to preselect the
        // combobox — the row already decided who this is about.
        <BlacklistDialog
          mode="add"
          candidates={[tenant]}
          tenant={{ id: tenant.id, fullName: tenant.fullName, reason: tenant.blacklistReason, note: tenant.blacklistNote }}
          renderTrigger={(open) => (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Blacklist ${tenant.fullName}`}
              title="Masukkan ke daftar hitam"
              onClick={open}
            >
              <Ban aria-hidden className="size-4" />
            </Button>
          )}
        />
      )}

      <ConfirmDialog
        open={confirmingRemoval}
        title={`Keluarkan ${tenant.fullName} dari daftar hitam?`}
        description="Kategori dan kronologinya ikut terhapus dari profil penyewa — jejaknya tetap ada di Audit Log. Kontrak baru tidak akan memunculkan peringatan lagi."
        confirmLabel="Keluarkan"
        tone="primary"
        isPending={isPending}
        onConfirm={removeFromBlacklist}
        onCancel={() => setConfirmingRemoval(false)}
      />
    </div>
  );
}
