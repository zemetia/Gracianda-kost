'use client';

import { Check, Minus } from 'lucide-react';
import { forwardRef, useCallback, useRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  /** Secondary line under the label — the "why" of the option. */
  hint?: ReactNode;
  /** Neither on nor off — a group where only some children are checked. */
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, indeterminate, className, disabled, ...props }, forwardedRef) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    // `indeterminate` is a DOM property with no HTML attribute, so it has to be
    // written on the node itself rather than passed as a prop.
    const setRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (node) node.indeterminate = !!indeterminate;

        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef, indeterminate],
    );

    return (
      <label
        className={cn(
          'group flex items-start gap-2.5 text-sm text-foreground',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className,
        )}
      >
        <span className="relative mt-px flex size-[18px] shrink-0">
          <input
            ref={setRef}
            type="checkbox"
            disabled={disabled}
            className={cn(
              'peer size-full appearance-none rounded-[5px] border border-border bg-field shadow-field',
              'transition-[background-color,border-color,box-shadow] duration-150',
              'checked:border-primary checked:bg-primary checked:shadow-none',
              'indeterminate:border-primary indeterminate:bg-primary indeterminate:shadow-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
              'disabled:cursor-not-allowed',
              !disabled && 'group-hover:border-border-strong',
            )}
            {...props}
          />
          <Check
            aria-hidden
            strokeWidth={3.5}
            className={cn(
              'pointer-events-none absolute inset-0 m-auto size-3 text-primary-foreground',
              'opacity-0 transition-opacity duration-100 peer-checked:opacity-100',
              indeterminate && 'peer-checked:opacity-0',
            )}
          />
          {indeterminate && (
            <Minus
              aria-hidden
              strokeWidth={3.5}
              className="pointer-events-none absolute inset-0 m-auto size-3 text-primary-foreground"
            />
          )}
        </span>

        <span className="flex flex-col gap-0.5">
          <span className="leading-snug">{label}</span>
          {hint && <span className="text-xs leading-relaxed text-foreground-muted">{hint}</span>}
        </span>
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
