'use client';

import { useTransition } from 'react';

import { Button } from '@/components/ui/Button';

import { markAsPaidAction } from '../actions';

export function MarkPaidButton({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      isLoading={isPending}
      onClick={() => startTransition(() => markAsPaidAction(paymentId))}
    >
      Sudah Dibayar
    </Button>
  );
}
