'use client';

import { ChevronDown, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  Field,
  fieldControlClass,
  fieldShellVariants,
  useFieldIds,
} from '@/components/ui/Field';
import { useDismissable } from '@/hooks/useDismissable';
import { cn } from '@/lib/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Second line — KTP + phone for a tenant, price for a room. */
  hint?: string;
  /** Destructive marker in the list, e.g. a blacklisted tenant. */
  flag?: string;
}

export interface ComboboxProps {
  name: string;
  label?: string;
  hint?: ReactNode;
  error?: string;
  id?: string;
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  required?: boolean;
  disabled?: boolean;
  /** How many matches to render at once — the list is a shortlist, not a dump. */
  maxVisible?: number;
  /** Goes on the field wrapper — this is what `sm:col-span-2` belongs on. */
  className?: string;
}

/**
 * A `<select>` listing every tenant in the building stops being usable at ~50
 * rows, which is exactly when the admin needs it most. Type-to-filter with the
 * value carried in a hidden input, so a plain `<form>` + Server Action keeps
 * working unchanged.
 */
export function Combobox({
  name,
  label,
  hint,
  error,
  id,
  options,
  value,
  onValueChange,
  placeholder = 'Ketik untuk mencari',
  emptyText = 'Tidak ada hasil.',
  required,
  disabled,
  maxVisible = 8,
  className,
}: ComboboxProps) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, {
    hasHint: !!hint,
    hasError: !!error,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const close = useCallback(() => setIsOpen(false), []);
  useDismissable(rootRef, isOpen, close);

  const selected = options.find((option) => option.value === value);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle
      ? options.filter((option) =>
          `${option.label} ${option.hint ?? ''}`.toLowerCase().includes(needle),
        )
      : options;
    return pool.slice(0, maxVisible);
  }, [options, query, maxVisible]);

  useEffect(() => {
    if (!isOpen) return;
    // Optional call: jsdom has no layout, so it does not implement this.
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [isOpen, activeIndex]);

  const commit = (option: ComboboxOption) => {
    onValueChange(option.value);
    setQuery('');
    setIsOpen(false);
  };

  const clear = () => {
    onValueChange('');
    setQuery('');
    setIsOpen(true);
    // The search input only mounts once the selection is cleared.
    queueMicrotask(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((index) => (matches.length ? (index + 1) % matches.length : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) =>
          matches.length ? (index - 1 + matches.length) % matches.length : 0,
        );
        break;
      case 'Enter': {
        // Swallowed so a half-finished search never submits the whole form.
        event.preventDefault();
        const match = matches[activeIndex];
        if (isOpen && match) commit(match);
        break;
      }
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
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
        <input type="hidden" name={name} value={value} />

        {selected ? (
          <div
            className={fieldShellVariants({
              fieldState: error ? 'error' : 'default',
              className: 'justify-between',
            })}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{selected.label}</span>
              {selected.hint && (
                <span className="truncate text-xs text-foreground-muted">{selected.hint}</span>
              )}
            </span>
            <button
              type="button"
              onClick={clear}
              disabled={disabled ?? false}
              className="flex shrink-0 items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-foreground-muted hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed"
            >
              <X aria-hidden className="size-3.5" />
              Ganti
            </button>
          </div>
        ) : (
          <div
            className={fieldShellVariants({ fieldState: error ? 'error' : 'default' })}
          >
            <Search aria-hidden className="size-4 shrink-0 text-foreground-subtle" />
            <input
              ref={inputRef}
              id={fieldId}
              type="text"
              role="combobox"
              autoComplete="off"
              disabled={disabled ?? false}
              value={query}
              placeholder={placeholder}
              aria-expanded={isOpen}
              aria-controls={`${fieldId}-list`}
              aria-autocomplete="list"
              aria-activedescendant={isOpen ? `${fieldId}-option-${activeIndex}` : undefined}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              onChange={(event) => {
                setQuery(event.target.value);
                // A new query means a new shortlist — start from its top match.
                setActiveIndex(0);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              className={cn(fieldControlClass, 'h-full')}
            />
            <ChevronDown aria-hidden className="size-4 shrink-0 text-foreground-subtle" />
          </div>
        )}

        {isOpen && !selected && (
          <ul
            ref={listRef}
            id={`${fieldId}-list`}
            role="listbox"
            className="absolute z-50 mt-1.5 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-popover"
          >
            {matches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-foreground-muted">{emptyText}</li>
            ) : (
              matches.map((option, index) => (
                <li
                  key={option.value}
                  id={`${fieldId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  data-active={index === activeIndex}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => commit(option)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'flex cursor-pointer items-start justify-between gap-2 rounded-sm px-2.5 py-2',
                    index === activeIndex && 'bg-primary-subtle',
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-foreground">{option.label}</span>
                    {option.hint && (
                      <span className="truncate text-xs text-foreground-muted">{option.hint}</span>
                    )}
                  </span>
                  {option.flag && (
                    <span className="shrink-0 rounded-full bg-destructive-subtle px-2 py-0.5 text-xs font-medium text-destructive">
                      {option.flag}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </Field>
  );
}
Combobox.displayName = 'Combobox';
