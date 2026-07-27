'use client';

import { useTransition } from 'react';

import { Button } from '@/components/ui/Button';

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
      <label className="flex items-center gap-2 text-sm text-foreground-muted">
        <input
          type="checkbox"
          name="isBlacklisted"
          defaultChecked={isBlacklisted}
          className="h-4 w-4 rounded border-input"
        />
        Tandai sebagai blacklist
      </label>
      <textarea
        name="blacklistNote"
        rows={2}
        defaultValue={blacklistNote ?? ''}
        placeholder="Catatan alasan blacklist (opsional)"
        className="rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button type="submit" size="sm" variant="secondary" isLoading={isPending} className="self-start">
        Simpan
      </Button>
    </form>
  );
}
