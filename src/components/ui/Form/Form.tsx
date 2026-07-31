import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle } from 'lucide-react';
import type { FieldsetHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

import { Field, type FieldProps } from '@/components/ui/Field';
import { cn } from '@/lib/cn';

/* ── Layout ───────────────────────────────────────────────────── */

export type FormLayoutProps = HTMLAttributes<HTMLDivElement>;

/** Vertical rhythm for a whole form: one stack of raised cards. */
export function FormLayout({ className, children, ...props }: FormLayoutProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {children}
    </div>
  );
}
FormLayout.displayName = 'FormLayout';

/* ── Card ─────────────────────────────────────────────────────── */

export interface FormCardProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'title'> {
  title: string;
  /** One line explaining what this group of fields decides. */
  description?: ReactNode;
  /** Right-aligned slot in the card header — a toggle, a helper link. */
  action?: ReactNode;
  /** Drop the header when the card holds a single obvious group. */
  bare?: boolean;
}

/**
 * One group of fields, raised off the page. The header lives inside the card
 * so the fields get the card's full width — an outboard title column costs
 * 16rem of the row a form is meant to be typed into.
 */
export function FormCard({
  title,
  description,
  action,
  bare,
  className,
  children,
  ...props
}: FormCardProps) {
  return (
    <fieldset
      className={cn(
        'min-w-0 rounded-lg border border-border bg-card shadow-card',
        'transition-shadow duration-200 focus-within:shadow-card-hover',
        className,
      )}
      {...props}
    >
      {!bare && (
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 flex-col gap-1">
            <legend className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </legend>
            {description && (
              <p className="text-sm leading-relaxed text-foreground-muted">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </fieldset>
  );
}
FormCard.displayName = 'FormCard';

/* ── Grid ─────────────────────────────────────────────────────── */

const formGridVariants = cva('grid grid-cols-1 gap-x-5 gap-y-5', {
  variants: {
    columns: {
      1: '',
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-2 lg:grid-cols-3',
    },
  },
  defaultVariants: { columns: 2 },
});

export type FormGridVariants = VariantProps<typeof formGridVariants>;

export interface FormGridProps extends HTMLAttributes<HTMLDivElement>, FormGridVariants {}

/** Field grid. A field that needs the full width gets `className="sm:col-span-2"`. */
export function FormGrid({ columns, className, children, ...props }: FormGridProps) {
  return (
    <div className={cn(formGridVariants({ columns }), className)} {...props}>
      {children}
    </div>
  );
}
FormGrid.displayName = 'FormGrid';

/* ── Field ────────────────────────────────────────────────────── */

export type FormFieldProps = FieldProps;

/**
 * Label / hint / error frame for controls that aren't already a primitive.
 * Kept as an alias so callers don't have to care that it moved into `Field`.
 */
export const FormField = Field;

/* ── Actions ──────────────────────────────────────────────────── */

export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Left-aligned slot — secondary actions, or a note about what submitting does. */
  secondary?: ReactNode;
}

/** Submit row for short inline forms: hairline above, primary action right. */
export function FormActions({ secondary, className, children, ...props }: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      {...props}
    >
      <div className="text-xs text-foreground-muted">{secondary}</div>
      <div className="flex items-center gap-2 sm:justify-end">{children}</div>
    </div>
  );
}
FormActions.displayName = 'FormActions';

/* ── Sticky bar ───────────────────────────────────────────────── */

export interface FormStickyBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Left-aligned note — what submitting will actually do. */
  secondary?: ReactNode;
}

/**
 * Long forms should not require a scroll to the bottom to be saved. This rides
 * the bottom of the viewport while the form is on screen, and reads as part of
 * the card stack rather than a floating toolbar.
 */
export function FormStickyBar({
  secondary,
  className,
  children,
  ...props
}: FormStickyBarProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-30 -mx-6 mt-2 border-t border-border bg-card/90 px-6 py-3.5 backdrop-blur',
        'shadow-sticky-bar lg:-mx-8 lg:px-8 print:hidden',
        'flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      {...props}
    >
      <div className="text-xs leading-relaxed text-foreground-muted">{secondary}</div>
      <div className="flex items-center gap-2 sm:justify-end">{children}</div>
    </div>
  );
}
FormStickyBar.displayName = 'FormStickyBar';

/* ── Error banner ─────────────────────────────────────────────── */

export interface FormErrorProps extends HTMLAttributes<HTMLDivElement> {
  message?: string | undefined;
}

/** Form-level failure, surfaced once above the actions — not per field. */
export function FormError({ message, className, ...props }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-md border border-destructive/30 border-l-4 border-l-destructive',
        'bg-destructive-subtle px-4 py-3 text-sm font-medium text-destructive',
        className,
      )}
      {...props}
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
FormError.displayName = 'FormError';
