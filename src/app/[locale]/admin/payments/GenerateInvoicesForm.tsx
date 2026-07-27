'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

import { generateInvoicesAction } from './actions';

export function GenerateInvoicesForm() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      isLoading={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await generateInvoicesAction();
          if ('error' in result) {
            toast.error(result.error);
            return;
          }
          toast.success(
            result.created > 0
              ? `${result.created} tagihan baru dibuat.`
              : 'Semua tagihan bulan ini sudah pernah dibuat.',
          );
        })
      }
    >
      Generate Tagihan Bulan Ini
    </Button>
  );
}
