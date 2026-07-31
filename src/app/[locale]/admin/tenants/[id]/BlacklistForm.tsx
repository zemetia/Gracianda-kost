'use client';

import { useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';

import { setBlacklistAction } from '../actions';

interface Props {
  tenantId: string;
  isBlacklisted: boolean;
  blacklistNote: string | null;
}

export function BlacklistForm({ tenantId, isBlacklisted, blacklistNote }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => setBlacklistAction(tenantId, formData))}
      className="flex flex-col gap-3"
    >
      <Checkbox
        name="isBlacklisted"
        defaultChecked={isBlacklisted}
        label="Tandai sebagai blacklist"
        hint="Tetap bisa dibuatkan kontrak, tapi admin akan diminta konfirmasi."
      />
      <Textarea
        name="blacklistNote"
        rows={2}
        defaultValue={blacklistNote ?? ''}
        placeholder="Catatan alasan blacklist (opsional)"
      />
      <Button type="submit" size="sm" variant="secondary" isLoading={isPending} className="self-start">
        Simpan
      </Button>
    </form>
  );
}
