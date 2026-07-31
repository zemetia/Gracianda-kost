'use client';

import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { Field, type FieldProps } from '@/components/ui/Field';
import { cn } from '@/lib/cn';

export interface ChipToggleProps {
  name: string;
  value: string;
  label: ReactNode;
  /** Leading glyph — a lucide icon for a facility, for instance. */
  icon?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * One checkbox wearing a pill. Twenty facilities as a checkbox grid is a wall
 * of identical squares; as chips the selected ones read at a glance.
 */
export function ChipToggle({
  name,
  value,
  label,
  icon,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
}: ChipToggleProps) {
  return (
    <label
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm',
        'transition-[background-color,border-color,color,box-shadow] duration-150',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/25',
        'has-[:checked]:border-primary has-[:checked]:bg-primary-subtle has-[:checked]:font-medium has-[:checked]:text-primary',
        disabled
          ? 'cursor-not-allowed border-border bg-field-disabled text-foreground-subtle'
          : 'cursor-pointer border-border bg-field text-foreground-muted hover:border-border-strong hover:text-foreground',
        className,
      )}
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        disabled={disabled ?? false}
        className="sr-only"
        {...(checked !== undefined
          ? { checked, onChange: (event) => onCheckedChange?.(event.target.checked) }
          : {
              defaultChecked: defaultChecked ?? false,
              onChange: (event) => onCheckedChange?.(event.target.checked),
            })}
      />

      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <span
          className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-100 group-has-[:checked]:opacity-0"
          aria-hidden
        >
          {icon}
        </span>
        <Check
          aria-hidden
          strokeWidth={3}
          className="absolute inset-0 m-auto size-4 opacity-0 transition-opacity duration-100 group-has-[:checked]:opacity-100"
        />
      </span>

      {label}
    </label>
  );
}
ChipToggle.displayName = 'ChipToggle';

export interface ChipGroupProps extends Omit<FieldProps, 'htmlFor' | 'children'> {
  children: ReactNode;
}

/** Label + error frame around a row of chips. */
export function ChipGroup({ children, ...fieldProps }: ChipGroupProps) {
  return (
    <Field {...fieldProps}>
      <div className="flex flex-wrap gap-2">{children}</div>
    </Field>
  );
}
ChipGroup.displayName = 'ChipGroup';
