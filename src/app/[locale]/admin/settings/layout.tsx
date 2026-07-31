import type { ReactNode } from 'react';

import { canAccess } from '@/lib/auth';

import { Forbidden } from '../Forbidden';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  if (!(await canAccess(['SUPER_ADMIN', 'KEUANGAN']))) return <Forbidden />;
  return <>{children}</>;
}
