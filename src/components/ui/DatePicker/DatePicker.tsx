'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  Field,
  fieldControlClass,
  fieldShellVariants,
  useFieldIds,
  type FieldShellVariants,
} from '@/components/ui/Field';
import { useDismissable } from '@/hooks/useDismissable';
import { cn } from '@/lib/cn';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/** `Date` → `YYYY-MM-DD` in local time. `toISOString` would shift a WIB date back a day. */
export function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `YYYY-MM-DD` → local `Date`, or `null` when the string isn't a real date. */
export function fromISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return isNaN(date.getTime()) ? null : date;
}

/** `2026-07-31` → `31 Jul 2026` — what an Indonesian admin expects to read. */
export function formatDisplayDate(value: string): string {
  const date = fromISODate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Monday-first grid, padded so every month renders as whole weeks. */
function buildGrid(view: Date): (Date | null)[] {
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (firstDay.getDay() + 6) % 7;

  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export interface DatePickerProps {
  /** Submitted as `YYYY-MM-DD`, exactly like a native date input. */
  name?: string;
  label?: string;
  hint?: ReactNode;
  error?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  size?: FieldShellVariants['fieldSize'];
  /** Goes on the field wrapper — this is what `sm:col-span-2` belongs on. */
  className?: string;
}

/**
 * The browser's native date input is styled by the OS and shows `mm/dd/yyyy` on
 * an English profile, which is wrong for every admin using this. This renders
 * an Indonesian calendar and submits the same `YYYY-MM-DD` the server expects.
 */
export function DatePicker({
  name,
  label,
  hint,
  error,
  id,
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  placeholder = 'Pilih tanggal',
  required,
  disabled,
  size,
  className,
}: DatePickerProps) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, {
    hasHint: !!hint,
    hasError: !!error,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? '');
  const current = value !== undefined ? value : internal;

  const close = useCallback(() => setIsOpen(false), []);
  useDismissable(rootRef, isOpen, close);

  const selected = fromISODate(current);
  const [view, setView] = useState(() => selected ?? new Date());

  const cells = useMemo(() => buildGrid(view), [view]);
  const todayIso = toISODate(new Date());

  const outOfRange = (iso: string) => (min && iso < min) || (max && iso > max);

  const commit = (date: Date) => {
    const iso = toISODate(date);
    if (outOfRange(iso)) return;
    if (value === undefined) setInternal(iso);
    onValueChange?.(iso);
    setIsOpen(false);
  };

  const shiftMonth = (delta: number) => {
    setView((currentView) => new Date(currentView.getFullYear(), currentView.getMonth() + delta, 1));
  };

  const open = () => {
    if (disabled) return;
    setView(selected ?? new Date());
    setIsOpen(true);
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
          disabled={disabled ?? false}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-describedby={describedBy}
          onClick={() => (isOpen ? setIsOpen(false) : open())}
          className={fieldShellVariants({
            fieldSize: size,
            fieldState: error ? 'error' : 'default',
            className: cn(
              'cursor-pointer text-left disabled:cursor-not-allowed disabled:bg-field-disabled',
              'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none',
            ),
          })}
        >
          <CalendarDays aria-hidden className="size-4 shrink-0 text-foreground-muted" />
          <span
            className={cn(
              fieldControlClass,
              'truncate',
              current ? 'text-foreground' : 'text-foreground-subtle',
            )}
          >
            {current ? formatDisplayDate(current) : placeholder}
          </span>
        </button>

        {isOpen && (
          <div
            role="dialog"
            aria-label={label ?? 'Pilih tanggal'}
            className="absolute z-50 mt-1.5 w-[19rem] rounded-md border border-border bg-popover p-3 shadow-popover"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Bulan sebelumnya"
                onClick={() => shiftMonth(-1)}
                className="flex size-8 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </button>

              <span className="text-sm font-semibold text-foreground">
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </span>

              <button
                type="button"
                aria-label="Bulan berikutnya"
                onClick={() => shiftMonth(1)}
                className="flex size-8 items-center justify-center rounded-sm text-foreground-muted hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((weekday) => (
                <span
                  key={weekday}
                  className="flex h-7 items-center justify-center text-xs font-medium text-foreground-subtle"
                >
                  {weekday}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((date, index) => {
                if (!date) return <span key={`pad-${index}`} className="h-9" />;

                const iso = toISODate(date);
                const isSelected = iso === current;
                const isToday = iso === todayIso;
                const isDisabled = !!outOfRange(iso);

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={isDisabled}
                    aria-current={isToday ? 'date' : undefined}
                    aria-pressed={isSelected}
                    onClick={() => commit(date)}
                    className={cn(
                      'flex h-9 items-center justify-center rounded-sm text-sm tabular-nums transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                      isDisabled && 'cursor-not-allowed text-foreground-subtle opacity-40',
                      !isDisabled && !isSelected && 'text-foreground hover:bg-primary-subtle',
                      isSelected && 'bg-primary font-semibold text-primary-foreground',
                      isToday && !isSelected && 'font-semibold text-primary',
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <button
                type="button"
                onClick={() => commit(new Date())}
                className="rounded-sm px-2 py-1 text-xs font-medium text-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                Hari ini
              </button>
              {!required && current && (
                <button
                  type="button"
                  onClick={() => {
                    if (value === undefined) setInternal('');
                    onValueChange?.('');
                    setIsOpen(false);
                  }}
                  className="rounded-sm px-2 py-1 text-xs font-medium text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                >
                  Kosongkan
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Field>
  );
}
DatePicker.displayName = 'DatePicker';
