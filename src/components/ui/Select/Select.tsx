'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import {
  Field,
  fieldControlClass,
  fieldShellVariants,
  useFieldIds,
  type FieldShellVariants,
} from '@/components/ui/Field';
import { useDismissable } from '@/hooks/useDismissable';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  /** Second line in the list — a price, a cycle, a role description. */
  hint?: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Submitted with the surrounding plain `<form>`. */
  name?: string;
  label?: string;
  hint?: ReactNode;
  error?: string;
  id?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Shown when nothing is chosen; doubles as the empty option's label. */
  placeholder?: string;
  /** Allow clearing back to `''` via a leading blank row. */
  allowEmpty?: boolean;
  required?: boolean;
  disabled?: boolean;
  size?: FieldShellVariants['fieldSize'];
  /** Goes on the field wrapper — this is what `sm:col-span-2` belongs on. */
  className?: string;
}

/**
 * A native `<select>` renders OS chrome that ignores every token in the design
 * system, and its option rows cannot carry a second line. This is a real
 * listbox: the value rides in a hidden input so Server Actions are unaffected.
 */
export function Select({
  name,
  label,
  hint,
  error,
  id,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Pilih…',
  allowEmpty,
  required,
  disabled,
  size,
  className,
}: SelectProps) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, {
    hasHint: !!hint,
    hasError: !!error,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ query: '', at: 0 });

  const [isOpen, setIsOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? '');
  const current = value !== undefined ? value : internal;

  const rows: SelectOption[] = allowEmpty
    ? [{ value: '', label: placeholder }, ...options]
    : options;

  const selectedIndex = rows.findIndex((row) => row.value === current);
  const [activeIndex, setActiveIndex] = useState(selectedIndex < 0 ? 0 : selectedIndex);

  const close = useCallback(() => setIsOpen(false), []);
  useDismissable(rootRef, isOpen, close);

  /** Opening always starts on the current value, never on a stale highlight. */
  const open = () => {
    setActiveIndex(selectedIndex < 0 ? 0 : selectedIndex);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    // Optional call: jsdom has no layout, so it does not implement this.
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [isOpen, activeIndex]);

  const selected = rows.find((row) => row.value === current && row.value !== '');

  const commit = (option: SelectOption) => {
    if (option.disabled) return;
    if (value === undefined) setInternal(option.value);
    onValueChange?.(option.value);
    setIsOpen(false);
  };

  const step = (direction: 1 | -1) => {
    setActiveIndex((index) => {
      let next = index;
      for (let i = 0; i < rows.length; i += 1) {
        next = (next + direction + rows.length) % rows.length;
        if (!rows[next]?.disabled) return next;
      }
      return index;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!isOpen && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
      event.preventDefault();
      open();
      return;
    }
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        step(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        step(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(rows.length - 1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const row = rows[activeIndex];
        if (row) commit(row);
        break;
      }
      case 'Tab':
        setIsOpen(false);
        break;
      default: {
        // Type-to-jump: "ka" lands on "Kamar Mandi Dalam" the way a native
        // select does, which is how anyone used to `<select>` will try first.
        if (event.key.length !== 1) return;
        const now = Date.now();
        const query =
          now - typeahead.current.at < 800 ? typeahead.current.query + event.key : event.key;
        typeahead.current = { query, at: now };

        const match = rows.findIndex(
          (row) => !row.disabled && row.label.toLowerCase().startsWith(query.toLowerCase()),
        );
        if (match >= 0) setActiveIndex(match);
      }
    }
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
      <div ref={rootRef} className="relative">
        {name && <input type="hidden" name={name} value={current} />}

        <button
          id={fieldId}
          type="button"
          role="combobox"
          disabled={disabled ?? false}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${fieldId}-list`}
          aria-required={required ?? false}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onClick={() => {
            if (disabled) return;
            if (isOpen) setIsOpen(false);
            else open();
          }}
          onKeyDown={handleKeyDown}
          className={fieldShellVariants({
            fieldSize: size,
            fieldState: error ? 'error' : 'default',
            className: cn(
              'cursor-pointer text-left disabled:cursor-not-allowed disabled:bg-field-disabled',
              'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none',
            ),
          })}
        >
          <span
            className={cn(
              fieldControlClass,
              'truncate',
              selected ? 'text-foreground' : 'text-foreground-subtle',
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              'size-4 shrink-0 text-foreground-muted transition-transform duration-150',
              isOpen && 'rotate-180',
            )}
          />
        </button>

        {isOpen && (
          <ul
            ref={listRef}
            id={`${fieldId}-list`}
            role="listbox"
            aria-labelledby={fieldId}
            aria-activedescendant={`${fieldId}-option-${activeIndex}`}
            className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-popover"
          >
            {rows.length === 0 && (
              <li className="px-3 py-2 text-sm text-foreground-muted">Tidak ada pilihan.</li>
            )}

            {rows.map((row, index) => {
              const isSelected = row.value === current;
              const isActive = index === activeIndex;

              return (
                <li
                  key={row.value || '__empty'}
                  id={`${fieldId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={row.disabled ?? false}
                  data-active={isActive}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => commit(row)}
                  onMouseEnter={() => !row.disabled && setActiveIndex(index)}
                  className={cn(
                    'flex cursor-pointer items-start gap-2 rounded-sm px-2.5 py-2 text-sm',
                    row.disabled && 'cursor-not-allowed opacity-50',
                    isActive && !row.disabled && 'bg-primary-subtle',
                    isSelected ? 'font-medium text-foreground' : 'text-foreground-muted',
                  )}
                >
                  <Check
                    aria-hidden
                    className={cn(
                      'mt-0.5 size-4 shrink-0 text-primary',
                      isSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{row.label}</span>
                    {row.hint && (
                      <span className="truncate text-xs text-foreground-muted">{row.hint}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Field>
  );
}
Select.displayName = 'Select';
