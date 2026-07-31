'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import {
  Field,
  fieldAffixClass,
  fieldControlClass,
  fieldShellVariants,
  useFieldIds,
  type FieldShellVariants,
} from '@/components/ui/Field';
import { cn } from '@/lib/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: ReactNode;
  error?: string;
  /** Glued to the left of the value — `Rp`, a search icon, a country code. */
  leftAddon?: ReactNode;
  /** Glued to the right — a unit like `m²`, a clear button. */
  rightAddon?: ReactNode;
  size?: FieldShellVariants['fieldSize'];
  /** Goes on the field wrapper — this is what `sm:col-span-2` belongs on. */
  className?: string;
  /** Goes on the `<input>` itself — rarely needed. */
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size,
      label,
      hint,
      error,
      leftAddon,
      rightAddon,
      className,
      inputClassName,
      id,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, {
      hasHint: !!hint,
      hasError: !!error,
    });

    return (
      <Field
        label={label}
        htmlFor={fieldId}
        hint={hint}
        error={error}
        required={required}
        hintId={hintId}
        errorId={errorId}
        className={className}
      >
        <div
          className={fieldShellVariants({
            fieldSize: size,
            fieldState: error ? 'error' : 'default',
          })}
        >
          {leftAddon && <span className={fieldAffixClass}>{leftAddon}</span>}

          <input
            ref={ref}
            id={fieldId}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(fieldControlClass, 'h-full', inputClassName)}
            {...props}
          />

          {rightAddon && <span className={fieldAffixClass}>{rightAddon}</span>}
        </div>
      </Field>
    );
  },
);

Input.displayName = 'Input';
