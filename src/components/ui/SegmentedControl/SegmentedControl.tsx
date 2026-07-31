'use client';

import type { ReactNode } from 'react';

import { Field, type FieldProps } from '@/components/ui/Field';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string>
  extends Omit<FieldProps, 'htmlFor' | 'children'> {
  /** Set to submit the choice with a plain `<form>`; omit for local-only state. */
  name?: string;
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
}

/**
 * Two to four mutually exclusive choices that change what the rest of the form
 * asks for — "Penyewa Lama / Penyewa Baru". Radios underneath, so keyboard and
 * form submission behave like radios; the pill is presentation only.
 */
export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onValueChange,
  ...fieldProps
}: SegmentedControlProps<T>) {
  return (
    <Field {...fieldProps}>
      <div
        role="radiogroup"
        aria-label={typeof fieldProps.label === 'string' ? fieldProps.label : undefined}
        className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-md border border-border bg-surface-raised p-1"
      >
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                'relative rounded-sm px-3.5 py-1.5 text-sm transition-colors duration-150',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/25',
                option.disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer',
                selected
                  ? 'bg-card font-semibold text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              <input
                type="radio"
                {...(name ? { name } : {})}
                value={option.value}
                checked={selected}
                disabled={option.disabled ?? false}
                onChange={() => onValueChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </Field>
  );
}
SegmentedControl.displayName = 'SegmentedControl';
