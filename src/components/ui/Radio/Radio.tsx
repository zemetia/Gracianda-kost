'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

import { Field, type FieldProps } from '@/components/ui/Field';
import { cn } from '@/lib/cn';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  /** Secondary line under the label — what choosing this option means. */
  hint?: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, hint, className, disabled, ...props }, ref) => (
    <label
      className={cn(
        'group flex items-start gap-2.5 text-sm text-foreground',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative mt-px flex size-[18px] shrink-0">
        <input
          ref={ref}
          type="radio"
          disabled={disabled}
          className={cn(
            'peer size-full appearance-none rounded-full border border-border bg-field shadow-field',
            'transition-[background-color,border-color,box-shadow] duration-150',
            'checked:border-primary checked:border-[5px] checked:bg-field checked:shadow-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
            'disabled:cursor-not-allowed',
            !disabled && 'group-hover:border-border-strong',
          )}
          {...props}
        />
      </span>

      <span className="flex flex-col gap-0.5">
        <span className="leading-snug">{label}</span>
        {hint && <span className="text-xs leading-relaxed text-foreground-muted">{hint}</span>}
      </span>
    </label>
  ),
);

Radio.displayName = 'Radio';

export interface RadioGroupProps extends Omit<FieldProps, 'htmlFor' | 'children'> {
  name: string;
  options: { value: string; label: ReactNode; hint?: ReactNode; disabled?: boolean }[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Lay the options out side by side instead of stacked. */
  inline?: boolean;
}

/**
 * A radio group is one question, so it carries the label and the error — the
 * individual radios never do.
 */
export function RadioGroup({
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  inline,
  ...fieldProps
}: RadioGroupProps) {
  const controlled = value !== undefined;

  return (
    <Field {...fieldProps}>
      <div
        role="radiogroup"
        aria-label={typeof fieldProps.label === 'string' ? fieldProps.label : undefined}
        className={cn('flex gap-x-6 gap-y-3', inline ? 'flex-wrap' : 'flex-col')}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            {...(option.hint !== undefined ? { hint: option.hint } : {})}
            disabled={option.disabled ?? false}
            {...(controlled
              ? { checked: value === option.value }
              : { defaultChecked: defaultValue === option.value })}
            onChange={(event) => {
              if (event.target.checked) onValueChange?.(option.value);
            }}
          />
        ))}
      </div>
    </Field>
  );
}
RadioGroup.displayName = 'RadioGroup';
