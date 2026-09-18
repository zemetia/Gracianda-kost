import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';

interface Props {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
}

// One of the four "at a glance" panels on the dashboard overview grid — see
// admin/page.tsx. A shared shell so the grid reads as four equal panels
// instead of four differently-styled widgets bolted together.
export function DashboardPanel({ title, description, href, hrefLabel = 'Lihat semua', children }: Props) {
  return (
    <Card className="flex flex-col border-border/80 shadow-xs">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 border-b border-border/40 pb-3">
        <div>
          <CardTitle className="text-sm font-bold text-foreground">{title}</CardTitle>
          {description && <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>}
        </div>
        {href && (
          <Link
            href={href}
            className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
          >
            {hrefLabel}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-4">{children}</CardContent>
    </Card>
  );
}
DashboardPanel.displayName = 'DashboardPanel';
