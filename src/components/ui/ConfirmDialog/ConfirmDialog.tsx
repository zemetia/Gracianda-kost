'use client';

import { TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/Button';
import { useDismissable } from '@/hooks/useDismissable';
import { cn } from '@/lib/cn';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Colours the icon and the confirm button. */
  tone?: 'destructive' | 'primary';
  /** Locks both buttons and disables dismissal while the action runs. */
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Blocking confirmation for actions that cannot be undone. Rendered in a portal
 * so a dialog opened from inside a card is never clipped by its overflow.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  tone = 'destructive',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useDismissable(panelRef, open && !isPending, onCancel);

  useEffect(() => {
    if (!open) return;

    // Focus lands on Cancel, never on the destructive button — a stray Enter
    // must not confirm the very thing we are asking about.
    cancelRef.current?.focus?.();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // `open` starts closed, so the server and the first client render agree; the
  // document check only guards the portal target during SSR.
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" aria-hidden />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-popover"
      >
        <div className="flex gap-4">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              tone === 'destructive'
                ? 'bg-destructive-subtle text-destructive'
                : 'bg-primary-subtle text-primary',
            )}
            aria-hidden
          >
            <TriangleAlert className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-foreground">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-foreground-muted">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button ref={cancelRef} type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            isLoading={isPending}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
