import type { ReactNode } from 'react';

import { canAccess } from '@/lib/auth';

import { Forbidden } from '../Forbidden';

export default async function MasterDataLayout({ children }: { children: ReactNode }) {
  if (!(await canAccess(['SUPER_ADMIN', 'OPERASIONAL']))) return <Forbidden />;
  return <>{children}</>;
}
