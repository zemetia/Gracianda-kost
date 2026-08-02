'use client';

import { Button } from '@/components/ui/Button';

import { BlacklistDialog, type BlacklistCandidate } from '../BlacklistDialog';

/**
 * Memegang trigger "Tambah ke Blacklist" di sisi klien. `page.tsx` adalah
 * Server Component dan `renderTrigger` sebuah fungsi — ia tidak bisa
 * menyeberangi batas RSC, jadi tombolnya tinggal di sini.
 */
export function AddToBlacklistButton({ candidates }: { candidates: BlacklistCandidate[] }) {
  return (
    <BlacklistDialog
      mode="add"
      candidates={candidates}
      renderTrigger={(open) => (
        <Button type="button" onClick={open} disabled={candidates.length === 0}>
          Tambah ke Blacklist
        </Button>
      )}
    />
  );
}
