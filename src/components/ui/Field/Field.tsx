'use client';

import { useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface FieldIds {
  fieldId: string;
  hintId: string;
  errorId: string;
  /** Ready for `aria-describedby` — error wins over hint, undefined when neither. */
  describedBy: string | undefined;
}

/**
 * Stable ids for a control and its hint/error. Deriving ids from the label —
 * which the old primitives did — collides the moment two fields share a label,
 * and a form with two "Harga" fields is not exotic.
 */
export function useFieldIds(
  providedId: string | undefined,
  options: { hasHint?: boolean | undefined; hasError?: boolean | undefined } = {},
): FieldIds {
  const generated = useId();
  const fieldId = providedId ?? generated;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  return {
    fieldId,
    hintId,
    errorId,
    describedBy: options.hasError ? errorId : options.hasHint ? hintId : undefined,
  };
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  label?: ReactNode;
  /** Id of the control this label points at. */
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  /** Right-aligned slot on the label row — a counter, a "reset" link. */
  labelAction?: ReactNode;
  hintId?: string;
  errorId?: string;
}

/**
 * Label / control / hint / error frame. Every control in the system renders
 * through this, so the vertical rhythm and the error treatment are decided in
 * exactly one place.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  labelAction,
  hintId,
  errorId,
  className,
  children,
  ...props
}: FieldProps) {
  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-1.5', className)} {...props}>
      {(label || labelAction) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
              {label}
              {required && (
                <span className="ml-0.5 text-destructive" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}
          {labelAction}
        </div>
      )}

      {children}

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs leading-relaxed text-foreground-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
Field.displayName = 'Field';
