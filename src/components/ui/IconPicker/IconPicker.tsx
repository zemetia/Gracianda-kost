'use client';

import { Search, X } from 'lucide-react';
import { iconNames } from 'lucide-react/dynamic';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import { Field, fieldControlClass, fieldShellVariants, useFieldIds } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { useDismissable } from '@/hooks/useDismissable';
import { cn } from '@/lib/cn';

/**
 * Icons an admin actually reaches for on a kost facility — shown before the
 * user types anything, so the popover opens useful instead of alphabetical.
 * Search falls through to the full lucide set (~1600 names) beyond this.
 */
const COMMON_ICON_NAMES = [
  'wifi',
  'cctv',
  'shield-check',
  'key-round',
  'clock',
  'motorbike',
  'car',
  'cooking-pot',
  'microwave',
  'refrigerator',
  'glass-water',
  'sofa',
  'laptop',
  'washing-machine',
  'sun',
  'bath',
  'shower-head',
  'moon-star',
  'building',
  'trees',
  'store',
  'dumbbell',
  'waves',
  'brush-cleaning',
  'trash-2',
  'fire-extinguisher',
  'briefcase-medical',
  'plug-zap',
  'mailbox',
  'cigarette',
  'droplets',
  'snowflake',
  'fan',
  'air-vent',
  'app-window',
  'blinds',
  'bed-double',
  'bed-single',
  'bed',
  'layers',
  'shirt',
  'lamp-desk',
  'armchair',
  'rows-3',
  'frame',
  'lamp',
  'tv',
  'toilet',
  'heater',
  'droplet',
  'router',
  'plug',
  'fence',
  'lock-keyhole',
] as const;

const MAX_RESULTS = 72;

export interface IconPickerProps {
  name: string;
  label?: string;
  hint?: ReactNode;
  error?: string;
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  /** Goes on the field wrapper — this is what `sm:col-span-2` belongs on. */
  className?: string;
}

/**
 * A text input for an icon name asks the admin to memorize ~1600 lucide
 * identifiers. This is a visual grid instead: common facility icons up
 * front, full-catalog search once they type.
 */
export function IconPicker({
  name,
  label,
  hint,
  error,
  id,
  value,
  onValueChange,
  required,
  disabled,
  className,
}: IconPickerProps) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, {
    hasHint: !!hint,
    hasError: !!error,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const close = useCallback(() => setIsOpen(false), []);
  useDismissable(rootRef, isOpen, close);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return COMMON_ICON_NAMES;
    return (iconNames as readonly string[])
      .filter((iconName) => iconName.includes(needle))
      .slice(0, MAX_RESULTS);
  }, [query]);

  const openPicker = () => {
    if (disabled) return;
    setQuery('');
    setIsOpen(true);
    queueMicrotask(() => searchRef.current?.focus());
  };

  const commit = (iconName: string) => {
    onValueChange(iconName);
    setIsOpen(false);
  };

  const clear = () => {
    onValueChange('');
    queueMicrotask(() => searchRef.current?.focus());
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
          onClick={() => (isOpen ? setIsOpen(false) : openPicker())}
          className={fieldShellVariants({
            fieldState: error ? 'error' : 'default',
            className: 'cursor-pointer justify-between text-left disabled:cursor-not-allowed',
          })}
        >
          <span className={cn(fieldControlClass, 'flex items-center gap-2')}>
            <Icon name={value || null} className={value ? 'text-primary' : undefined} />
            <span className={cn('truncate', !value && 'text-foreground-subtle')}>
              {value || 'Pilih icon'}
            </span>
          </span>
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(event) => {
                event.stopPropagation();
                clear();
              }}
              aria-label="Hapus icon"
              className="text-foreground-muted hover:bg-surface-raised hover:text-foreground flex shrink-0 items-center rounded-sm p-0.5"
            >
              <X aria-hidden className="size-3.5" />
            </span>
          )}
        </button>

        {isOpen && (
          <div className="border-border bg-popover shadow-popover absolute z-50 mt-1.5 w-80 max-w-[90vw] rounded-md border p-3">
            <div
              className={fieldShellVariants({
                fieldSize: 'sm',
                className: 'mb-2.5',
              })}
            >
              <Search aria-hidden className="text-foreground-subtle size-4 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                autoComplete="off"
                value={query}
                placeholder="Cari icon…"
                onChange={(event) => setQuery(event.target.value)}
                className={fieldControlClass}
              />
            </div>

            {matches.length === 0 ? (
              <p className="text-foreground-muted px-1 py-4 text-center text-sm">
                Tidak ada icon yang cocok.
              </p>
            ) : (
              <div
                id={`${fieldId}-list`}
                role="listbox"
                aria-label="Pilihan icon"
                className="grid max-h-56 grid-cols-8 gap-1 overflow-y-auto"
              >
                {matches.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    role="option"
                    aria-selected={iconName === value}
                    title={iconName}
                    onClick={() => commit(iconName)}
                    className={cn(
                      'text-foreground-muted hover:bg-primary-subtle hover:text-primary flex h-8 w-8 items-center justify-center rounded-sm transition-colors',
                      iconName === value && 'bg-primary-subtle text-primary',
                    )}
                  >
                    <Icon name={iconName} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}
IconPicker.displayName = 'IconPicker';
