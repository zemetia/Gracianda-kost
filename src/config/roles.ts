import type { UserRoleValue } from '@/lib/validations';

export const ROLE_LABEL: Record<UserRoleValue | string, string> = {
  SUPER_ADMIN: 'Super Admin',
  OPERASIONAL: 'Operasional',
  KEUANGAN: 'Keuangan',
  SECURITY: 'Security',
};
