'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/cn';

export interface PickerOption {
  value: string;
  label: string;
  /** Secondary line — KTP + phone for a tenant, price for a room. */
  hint?: string;
  /** Shown as a destructive marker in the list, e.g. blacklist. */
  flag?: string;
}

interface Props {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  options: PickerOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  emptyText?: string;
}

const MAX_VISIBLE = 8;

/**
 * A `<select>` listing every tenant in the building stops being usable at ~50
 * rows, which is exactly when the admin needs it most. Type-to-filter with the
 * value carried in a hidden input, so the surrounding plain `<form>` +
 * Server Action keeps working unchanged.
 */
export function SearchablePicker({
  id,
  name,
  label,
  placeholder,
  options,
  value,
  onChange,
  required,
  error,
  emptyText = 'Tidak ada hasil.',
}: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle
      ? options.filter((option) =>
          `${option.label} ${option.hint ?? ''}`.toLowerCase().includes(needle),
        )
      : options;
    return pool.slice(0, MAX_VISIBLE);
  }, [options, query]);

  const select = (option: PickerOption) => {
    onChange(option.value);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <input type="hidden" name={name} value={value} />

      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-raised px-3 py-2">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{selected.label}</span>
            {selected.hint && (
              <span className="truncate text-xs text-foreground-muted">{selected.hint}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(true);
            }}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground-muted hover:bg-surface hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Ganti
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
            aria-hidden="true"
          />
          <input
            id={id}
            type="text"
            autoComplete="off"
            value={query}
            placeholder={placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="h-9 w-full rounded-md border border-input bg-surface pl-9 pr-8 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
            aria-hidden="true"
          />
        </div>
      )}

      {!selected && isOpen && (
        <ul className="max-h-64 overflow-y-auto rounded-md border border-border bg-surface p-1">
          {matches.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => select(option)}
                className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-surface-raised"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-transparent" aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {option.label}
                    </span>
                    {option.flag && (
                      <span className="shrink-0 rounded-full bg-destructive-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                        {option.flag}
                      </span>
                    )}
                  </span>
                  {option.hint && (
                    <span className="truncate text-xs text-foreground-muted">{option.hint}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
          {matches.length === 0 && (
            <li className="px-3 py-3 text-center text-sm text-foreground-subtle">{emptyText}</li>
          )}
          {!query && options.length > MAX_VISIBLE && (
            <li className="px-3 py-2 text-center text-xs text-foreground-subtle">
              Menampilkan {MAX_VISIBLE} dari {options.length} — ketik untuk mempersempit.
            </li>
          )}
        </ul>
      )}

      {error && <p className={cn('text-xs text-destructive')}>{error}</p>}
    </div>
  );
}

SearchablePicker.displayName = 'SearchablePicker';
