import type { ReactNode } from 'react';

import { getSession } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
import { redirect } from '@/i18n/navigation';
import { propertyService } from '@/services/property.service';

import { AdminSidebar } from './AdminSidebar';
import { CommandPalette } from './CommandPalette';
import { PropertyScopeSwitcher } from './PropertyScopeSwitcher';

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) {
    redirect({ href: '/sign-in', locale });
    return null;
  }

  const [properties, scope] = await Promise.all([
    propertyService.listActive(),
    getPropertyScope(),
  ]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      <AdminSidebar role={session.user.role} userName={session.user.name ?? session.user.email ?? ''} />
      <div className="flex flex-1 flex-col">
        {/* The scope lives above every module, not inside one of them, so it
            survives navigation instead of resetting on each page. The search
            trigger lives in the same row so it's reachable from anywhere too. */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-6 py-2.5 pt-20 md:pt-2.5 print:hidden">
          <CommandPalette />
          {properties.length > 1 && (
            <PropertyScopeSwitcher properties={properties} value={scope ?? ''} />
          )}
        </div>
        <main className="flex-1 p-6 pt-6 md:pt-8 lg:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
