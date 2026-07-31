'use client';

import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react';

import {
  Field,
  fieldControlClass,
  fieldShellVariants,
  useFieldIds,
} from '@/components/ui/Field';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: ReactNode;
  error?: string;
  /** Goes on the field wrapper — this is what `sm:col-span-2` belongs on. */
  className?: string;
  /** Goes on the `<textarea>` itself. */
  textareaClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, hint, error, className, textareaClassName, id, required, rows = 3, ...props },
    ref,
  ) => {
    const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, {
      hasHint: !!hint,
      hasError: !!error,
    });

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
        <div
          className={fieldShellVariants({
            fieldSize: 'auto',
            fieldState: error ? 'error' : 'default',
          })}
        >
          <textarea
            ref={ref}
            id={fieldId}
            rows={rows}
            required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(fieldControlClass, 'resize-y leading-relaxed', textareaClassName)}
            {...props}
          />
        </div>
      </Field>
    );
  },
);

Textarea.displayName = 'Textarea';
