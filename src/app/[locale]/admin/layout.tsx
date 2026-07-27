import type { ReactNode } from 'react';

import { getSession } from '@/lib/auth';
import { redirect } from '@/i18n/navigation';

import { AdminSidebar } from './AdminSidebar';

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

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar role={session.user.role} userName={session.user.name ?? session.user.email ?? ''} />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
