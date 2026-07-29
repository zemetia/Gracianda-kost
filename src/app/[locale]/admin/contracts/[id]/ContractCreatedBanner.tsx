'use client';

import { PartyPopper } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { buildContractCreatedMessage, buildWaLink } from '@/lib/whatsapp';

import { PrintButton } from '../../reports/PrintButton';

interface Props {
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  contractCode: string;
  roomNumber: string;
  rentPrice: number;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  billingInterval: number;
  startDate: Date;
}

// Shown once right after "Buat Kontrak & Tagihan Pertama" — the three things
// an admin still needs to do are surfaced immediately instead of making them
// remember to come back for KTP upload / confirmation / receipt separately.
export function ContractCreatedBanner(props: Props) {
  const message = buildContractCreatedMessage(
    { fullName: props.tenantName },
    {
      contractCode: props.contractCode,
      room: { number: props.roomNumber },
      rentPrice: props.rentPrice,
      billingCycle: props.billingCycle,
      billingInterval: props.billingInterval,
      startDate: props.startDate,
    },
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-success/30 bg-success-subtle p-4 print:hidden">
      <div className="flex items-center gap-2">
        <PartyPopper className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
        <p className="text-sm font-semibold text-success">
          Kontrak berhasil dibuat — tagihan pertama sudah otomatis terbit.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/tenants/${props.tenantId}`}>
          <Button type="button" variant="outline" size="sm">
            Unggah KTP
          </Button>
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.open(buildWaLink(props.tenantPhone, message), '_blank')}
        >
          Kirim Detail via WA
        </Button>
        <PrintButton />
      </div>
    </div>
  );
}
