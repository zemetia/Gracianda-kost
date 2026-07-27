'use client';

import { Button } from '@/components/ui/Button';
import { buildReminderMessage, buildWaLink } from '@/lib/whatsapp';

interface Props {
  phone: string;
  tenantName: string;
  contractCode: string;
  roomNumber: string;
  periodMonth: number;
  periodYear: number;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
}

export function SendWaButton(props: Props) {
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
    <Button variant="outline" onClick={() => window.open(buildWaLink(props.phone, message), '_blank')}>
      Kirim WA
    </Button>
  );
}
