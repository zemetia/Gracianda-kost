'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Closes a popover on Escape or on a pointer press outside it. Shared by
 * `Select`, `Combobox` and `DatePicker` so all three dismiss identically —
 * a dropdown that only closes on blur strands the user on touch devices.
 */
export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const node = ref.current;
      if (node && !node.contains(event.target as Node)) onDismiss();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, isOpen, onDismiss]);
}
