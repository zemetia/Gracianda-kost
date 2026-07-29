'use client';

import { useTransition } from 'react';

import { Button, type ButtonProps } from '@/components/ui/Button';

import { markAsPaidAction } from './actions';

interface Props {
  paymentId: string;
  size?: ButtonProps['size'];
  label?: string;
}

export function MarkPaidButton({ paymentId, size = 'md', label = 'Sudah Dibayar' }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      size={size}
      isLoading={isPending}
      onClick={() => startTransition(() => markAsPaidAction(paymentId))}
    >
      {label}
    </Button>
  );
}
