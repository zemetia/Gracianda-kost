'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Link } from '@/i18n/navigation';
import { formatRupiah } from '@/lib/utils';

import { removeExpenseAction } from './actions';

export interface ExpenseRowActionsProps {
  id: string;
  categoryLabel: string;
  amount: number;
}

export function ExpenseRowActions({ id, categoryLabel, amount }: ExpenseRowActionsProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await removeExpenseAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setIsConfirming(false);
      toast.success('Pengeluaran dihapus');
    });
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        <Link href={`/admin/expenses/new?duplicateFrom=${id}`}>
          <Button variant="ghost" size="sm">
            Duplikat
          </Button>
        </Link>
        <Link href={`/admin/expenses/${id}`}>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => setIsConfirming(true)}>
          Hapus
        </Button>
      </div>

      <ConfirmDialog
        open={isConfirming}
        title={`Hapus pengeluaran ${categoryLabel}?`}
        description={`Pengeluaran senilai ${formatRupiah(amount)} akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        isPending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  );
}
