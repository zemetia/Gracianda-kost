import { cva, type VariantProps } from 'class-variance-authority';

/**
 * The box a value lives in — shared by every control so `Input`, `Select`,
 * `DatePicker` and friends cannot drift apart in height, radius or focus
 * treatment. The shell owns the border, fill and focus ring; the control
 * inside is always transparent and borderless.
 */
export const fieldShellVariants = cva(
  [
    'relative flex w-full items-center rounded-md border bg-field',
    'shadow-field transition-[background-color,border-color,box-shadow] duration-150',
    'has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-field-disabled has-[:disabled]:shadow-none',
    'focus-within:bg-field focus-within:shadow-none focus-within:ring-2',
  ],
  {
    variants: {
      fieldSize: {
        sm: 'h-9 gap-1.5 px-2.5 text-sm',
        md: 'h-11 gap-2 px-3 text-sm',
        lg: 'h-12 gap-2 px-3.5 text-base',
        /** Multi-line: grows with content instead of locking a height. */
        auto: 'min-h-11 items-start gap-2 px-3 py-2.5 text-sm',
      },
      fieldState: {
        default: 'border-border hover:border-border-strong focus-within:border-primary focus-within:ring-primary/20',
        error: 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
      },
    },
    defaultVariants: {
      fieldSize: 'md',
      fieldState: 'default',
    },
  },
);

export type FieldShellVariants = VariantProps<typeof fieldShellVariants>;

/** The bare control inside the shell — no chrome of its own. */
export const fieldControlClass =
  'w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-foreground-subtle disabled:cursor-not-allowed';

/** Static text glued to a value: the `Rp` on money, the unit on a measurement. */
export const fieldAffixClass = 'shrink-0 select-none text-foreground-muted';
