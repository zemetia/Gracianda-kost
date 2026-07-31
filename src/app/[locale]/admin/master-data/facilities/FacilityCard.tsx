'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/ui/Icon';

import { removeFacilityAction } from './actions';
import { FacilityFormDialog } from './FacilityFormDialog';

export interface FacilityCardProps {
  id: string;
  name: string;
  icon: string | null;
  category: 'COMMON' | 'ROOM';
  /** Rooms + room types that reference this facility, shown before deleting. */
  usageCount: number;
}

export function FacilityCard({ id, name, icon, category, usageCount }: FacilityCardProps) {
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
      <div className="group border-border bg-card hover:border-border-strong flex items-center gap-3 rounded-xs border px-3 py-2.5 shadow-sm transition-colors">
        <span className="bg-primary-subtle text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-xs">
          <Icon name={icon} />
        </span>
        <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
        <div className="flex shrink-0 items-center gap-0.5">
          <FacilityFormDialog
            mode="edit"
            facility={{ id, name, icon, category }}
            renderTrigger={(open) => (
              <button
                type="button"
                onClick={open}
                aria-label={`Edit ${name}`}
                className="text-foreground-subtle hover:bg-primary-subtle hover:text-primary focus-visible:ring-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          />
          <button
            type="button"
            onClick={() => setIsConfirming(true)}
            aria-label={`Hapus ${name}`}
            className="text-foreground-subtle hover:bg-destructive-subtle hover:text-destructive focus-visible:ring-destructive flex h-7 w-7 shrink-0 items-center justify-center rounded-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
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
