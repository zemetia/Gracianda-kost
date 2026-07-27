import { Badge, type BadgeProps } from '@/components/ui/Badge';

import type { PaymentStatus } from '@/services/payment.service';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Belum Jatuh Tempo',
  DUE: 'Jatuh Tempo',
  OVERDUE: 'Terlambat',
  PAID: 'Lunas',
};

const STATUS_VARIANT: Record<PaymentStatus, BadgeProps['variant']> = {
  PENDING: 'outline',
  DUE: 'warning',
  OVERDUE: 'destructive',
  PAID: 'success',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
