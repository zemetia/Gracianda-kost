'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Link } from '@/i18n/navigation';

type Result = { error?: string };

export interface RecordActionsProps {
  /** What the dialogs and toasts call this record, e.g. "Kamar 101". */
  name: string;
  isActive: boolean;
  editHref: string;
  /** Consequences of parking the record — it stays reachable and reversible. */
  deactivateDescription: ReactNode;
  /** Consequences of deleting it — this one never comes back. */
  deleteDescription: ReactNode;
  onDeactivate: () => Promise<Result>;
  onActivate: () => Promise<Result>;
  onDelete: () => Promise<Result>;
  /** Entity-specific extras (Duplikat, …) rendered before Edit. */
  children?: ReactNode;
}

type Pending = 'deactivate' | 'delete' | null;

/**
 * The shared footer of every master-data card: park, revive, or delete.
 * Both destructive paths go through ConfirmDialog — nonaktif because it pulls
 * the record off the public site, hapus because it is final.
 */
export function RecordActions({
  name,
  isActive,
  editHref,
  deactivateDescription,
  deleteDescription,
  onDeactivate,
  onActivate,
  onDelete,
  children,
}: RecordActionsProps) {
  const [confirming, setConfirming] = useState<Pending>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<Result>, successMessage: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setConfirming(null);
      toast.success(successMessage);
    });
  };

  return (
    <>
      <div className="border-border mt-auto flex flex-wrap items-center justify-end gap-1 border-t pt-3">
        {children}
        <Link href={editHref}>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </Link>
        {isActive ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirming('deactivate')}
          >
            Nonaktifkan
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => run(onActivate, `${name} diaktifkan`)}
          >
            Aktifkan
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirming('delete')}
        >
          Hapus
        </Button>
      </div>

      <ConfirmDialog
        open={confirming === 'deactivate'}
        title={`Nonaktifkan ${name}?`}
        description={deactivateDescription}
        confirmLabel="Nonaktifkan"
        isPending={isPending}
        onConfirm={() => run(onDeactivate, `${name} dinonaktifkan`)}
        onCancel={() => setConfirming(null)}
      />

      <ConfirmDialog
        open={confirming === 'delete'}
        title={`Hapus ${name}?`}
        description={deleteDescription}
        confirmLabel="Hapus permanen"
        isPending={isPending}
        onConfirm={() => run(onDelete, `${name} dihapus`)}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}
