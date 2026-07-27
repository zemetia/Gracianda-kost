import type { ReactNode } from 'react';

import { canAccess } from '@/lib/auth';

import { Forbidden } from '../Forbidden';

export default async function ContractsLayout({ children }: { children: ReactNode }) {
  if (!(await canAccess(['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN']))) return <Forbidden />;
  return <>{children}</>;
}
