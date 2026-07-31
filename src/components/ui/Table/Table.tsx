import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

/**
 * Editorial data table — see docs/blueprint/DATA_PRESENTATION.md §9. A dataset
 * region is one of the few places a border/container is allowed; individual
 * cells never get their own box.
 */
export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <Card noPadding className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className={cn('w-full text-left text-sm', className)} {...props}>
          {children}
        </table>
      </div>
    </Card>
  );
}
Table.displayName = 'Table';

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-border', className)} {...props} />;
}
TableHeader.displayName = 'TableHeader';

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        '[&>tr]:border-b [&>tr]:border-border [&>tr]:transition-colors [&>tr:last-child]:border-0',
        '[&>tr:hover]:bg-surface-raised',
        className,
      )}
      {...props}
    />
  );
}
TableBody.displayName = 'TableBody';

export function TableFooter({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn('[&_tr]:border-t [&_tr]:border-border [&_tr]:font-semibold', className)}
      {...props}
    />
  );
}
TableFooter.displayName = 'TableFooter';

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn(className)} {...props} />;
}
TableRow.displayName = 'TableRow';

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-medium uppercase tracking-wide text-foreground-muted first:pl-5 last:pr-5',
        className,
      )}
      {...props}
    />
  );
}
TableHead.displayName = 'TableHead';

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 align-middle first:pl-5 last:pr-5', className)} {...props} />
  );
}
TableCell.displayName = 'TableCell';

export interface TableEmptyProps {
  colSpan: number;
  children: ReactNode;
}

/** One row spanning every column — the empty/zero-result state for a table body. */
export function TableEmpty({ colSpan, children }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-foreground-muted">
        {children}
      </td>
    </tr>
  );
}
TableEmpty.displayName = 'TableEmpty';
