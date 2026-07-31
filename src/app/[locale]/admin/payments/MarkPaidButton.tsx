'use client';

import { useState, useTransition } from 'react';

import { Button, type ButtonProps } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';

import { markAsPaidAction } from './actions';

interface Props {
  paymentId: string;
  paymentMethods: SelectOption[];
  size?: ButtonProps['size'];
  label?: string;
}

export function MarkPaidButton({ paymentId, paymentMethods, size = 'md', label = 'Sudah Dibayar' }: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!isConfirming) {
    return (
      <Button variant="secondary" size={size} onClick={() => setIsConfirming(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        label="Metode"
        size="sm"
        options={paymentMethods}
        value={paymentMethodId}
        onValueChange={setPaymentMethodId}
        disabled={isPending}
      />
      <Button
        variant="secondary"
        size={size}
        isLoading={isPending}
        disabled={!paymentMethodId}
        onClick={() => startTransition(() => markAsPaidAction(paymentId, paymentMethodId))}
      >
        Konfirmasi
      </Button>
      <Button
        variant="ghost"
        size={size}
        disabled={isPending}
        onClick={() => {
          setIsConfirming(false);
          setPaymentMethodId('');
        }}
      >
        Batal
      </Button>
    </div>
  );
}
