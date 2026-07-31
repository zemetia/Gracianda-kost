import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  /** One line on what this page is for, or which record it belongs to. */
  description?: ReactNode;
  /** Where "back" goes. A form reached from a list should always offer it. */
  backHref?: string;
  backLabel?: string;
  /** Right-aligned slot — page-level actions that aren't the form's submit. */
  action?: ReactNode;
  className?: string;
}

/** The one page title treatment for admin, so every screen opens the same way. */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = 'Kembali',
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {backLabel}
        </Link>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-sm leading-relaxed text-foreground-muted">{description}</p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
PageHeader.displayName = 'PageHeader';
