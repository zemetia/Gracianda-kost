'use client';

import { useState, type ReactNode } from 'react';

import {
  Field,
  fieldAffixClass,
  fieldControlClass,
  fieldShellVariants,
  useFieldIds,
  type FieldShellVariants,
} from '@/components/ui/Field';
import { cn } from '@/lib/cn';

const GROUPER = new Intl.NumberFormat('id-ID');

/** `"1.500.000"` → `1500000`; anything without a digit is "empty", not zero. */
export function parseRupiah(display: string): number | '' {
  const digits = display.replace(/\D/g, '');
  return digits === '' ? '' : Number(digits);
}

/** `1500000` → `"1.500.000"`. */
export function formatRupiahInput(value: number | ''): string {
  return value === '' ? '' : GROUPER.format(value);
}

export interface CurrencyInputProps {
  /** Submitted as a plain integer string, not the grouped display value. */
  name?: string;
  label?: string;
  hint?: ReactNode;
  error?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  size?: FieldShellVariants['fieldSize'];
  /** Controlled value in rupiah. Omit to run uncontrolled from `defaultValue`. */
  value?: number | '';
  defaultValue?: number | '' | undefined;
  onValueChange?: (value: number | '') => void;
  /** Goes on the field wrapper — this is what `sm:col-span-2` belongs on. */
  className?: string;
}

/**
 * Money is read in thousands, so it has to be typed in thousands. The visible
 * input carries the grouped text and a hidden input carries the raw integer, so
 * Server Actions keep receiving `"1500000"` and nothing downstream changes.
 */
export function CurrencyInput({
  name,
  label,
  hint,
  error,
  id,
  placeholder = '0',
  required,
  disabled,
  size,
  value,
  defaultValue,
  onValueChange,
  className,
}: CurrencyInputProps) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, {
    hasHint: !!hint,
    hasError: !!error,
  });

  const [internal, setInternal] = useState<number | ''>(defaultValue ?? '');
  const current = value !== undefined ? value : internal;

  const handleChange = (raw: string) => {
    const parsed = parseRupiah(raw);
    if (value === undefined) setInternal(parsed);
    onValueChange?.(parsed);
  };

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
        <span className={cn(fieldAffixClass, 'font-medium')}>Rp</span>

        {name && <input type="hidden" name={name} value={current === '' ? '' : String(current)} />}

        <input
          id={fieldId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required={required ?? false}
          disabled={disabled ?? false}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          value={formatRupiahInput(current)}
          onChange={(event) => handleChange(event.target.value)}
          className={cn(fieldControlClass, 'h-full text-right tabular-nums')}
        />
      </div>
    </Field>
  );
}
CurrencyInput.displayName = 'CurrencyInput';
