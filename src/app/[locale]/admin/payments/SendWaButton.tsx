'use client';

import { useTransition } from 'react';

import { Button, type ButtonProps } from '@/components/ui/Button';
import { buildReminderMessage, buildWaLink } from '@/lib/whatsapp';

import { logReminderAction } from './actions';

interface Props {
  paymentId: string;
  phone: string;
  tenantName: string;
  contractCode: string;
  roomNumber: string;
  periodMonth: number;
  periodYear: number;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
  size?: ButtonProps['size'];
  label?: string;
}

export function SendWaButton({ size = 'md', label = 'Kirim WA', ...props }: Props) {
  const [isPending, startTransition] = useTransition();

  const message = buildReminderMessage(
    { fullName: props.tenantName },
    { contractCode: props.contractCode, room: { number: props.roomNumber } },
    {
      periodMonth: props.periodMonth,
      periodYear: props.periodYear,
      amountDue: props.amountDue,
      amountPaid: props.amountPaid,
      dueDate: props.dueDate,
    },
  );

  return (
    <Button
      variant="outline"
      size={size}
      isLoading={isPending}
      onClick={() => {
        // Open first: a popup blocker only tolerates window.open inside the
        // click handler, so the reminder log must not be awaited before it.
        window.open(buildWaLink(props.phone, message), '_blank');
        startTransition(() => logReminderAction(props.paymentId));
      }}
    >
      {label}
    </Button>
  );
}
