'use client';

import { Ban, Banknote, CreditCard, Wallet } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { PaymentMethodType } from '@/generated/prisma/client';
import { cn } from '@/lib/cn';

import { deactivatePaymentMethodAction } from './actions';

const TYPE_ICON: Record<PaymentMethodType, typeof Banknote> = {
  CASH: Banknote,
  BANK: CreditCard,
  EWALLET: Wallet,
};

const TYPE_LABEL: Record<PaymentMethodType, string> = {
  CASH: 'Tunai',
  BANK: 'Rekening Bank',
  EWALLET: 'E-Wallet',
};

export interface PaymentMethodCardProps {
  id: string;
  name: string;
  type: PaymentMethodType;
  isActive: boolean;
}

export function PaymentMethodCard({ id, name, type, isActive }: PaymentMethodCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const TypeIcon = TYPE_ICON[type];

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deactivatePaymentMethodAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setIsConfirming(false);
      toast.success(`Metode ${name} dinonaktifkan`);
    });
  };

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-3 rounded-xs border border-border bg-card px-3 py-2.5 shadow-sm transition-colors',
          isActive ? 'hover:border-border-strong' : 'opacity-60',
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs bg-primary-subtle text-primary">
          <TypeIcon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{name}</span>
          <span className="block text-xs text-foreground-muted">
            {TYPE_LABEL[type]}
            {!isActive && ' · Nonaktif'}
          </span>
        </span>
        {isActive && (
          <button
            type="button"
            onClick={() => setIsConfirming(true)}
            aria-label={`Nonaktifkan ${name}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs text-foreground-subtle transition-colors hover:bg-destructive-subtle hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <Ban className="h-4 w-4" />
          </button>
        )}
      </div>

      <ConfirmDialog
        open={isConfirming}
        title={`Nonaktifkan metode ${name}?`}
        description="Metode ini tidak akan muncul lagi saat mencatat pembayaran baru. Transaksi lama yang sudah memakainya tidak berubah."
        confirmLabel="Nonaktifkan"
        isPending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  );
}
