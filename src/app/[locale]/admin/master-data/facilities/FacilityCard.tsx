'use client';

import { Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/ui/Icon';

import { removeFacilityAction } from './actions';

export interface FacilityCardProps {
  id: string;
  name: string;
  icon: string | null;
  /** Rooms + room types that reference this facility, shown before deleting. */
  usageCount: number;
}

export function FacilityCard({ id, name, icon, usageCount }: FacilityCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await removeFacilityAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setIsConfirming(false);
      toast.success(`Fasilitas ${name} dihapus`);
    });
  };

  return (
    <>
      <div className="group flex items-center gap-3 rounded-xs border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:border-border-strong">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs bg-primary-subtle text-primary">
          <Icon name={icon} />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{name}</span>
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          aria-label={`Hapus ${name}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs text-foreground-subtle transition-colors hover:bg-destructive-subtle hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <ConfirmDialog
        open={isConfirming}
        title={`Hapus fasilitas ${name}?`}
        description={
          usageCount > 0
            ? `Fasilitas ini masih dipakai di ${usageCount} kamar/tipe kamar dan akan otomatis dilepas dari semuanya. Tindakan ini tidak bisa dibatalkan.`
            : 'Fasilitas akan hilang dari master data. Tindakan ini tidak bisa dibatalkan.'
        }
        confirmLabel="Hapus"
        isPending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  );
}
