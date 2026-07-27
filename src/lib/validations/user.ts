import { z } from 'zod';

export const USER_ROLES = ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN', 'SECURITY'] as const;

const roleSchema = z.enum(USER_ROLES);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(100),
  role: roleSchema,
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100),
  email: z.string().email('Email tidak valid'),
  // Kosong = password tidak diubah.
  password: z.string().min(8, 'Password minimal 8 karakter').max(100).optional(),
  role: roleSchema,
});

export const setUserActiveSchema = z.object({
  isActive: z.coerce.boolean(),
});

export const auditLogFilterSchema = z.object({
  entityType: z.string().max(50).optional(),
  userId: z.string().max(50).optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
});

export type UserRoleValue = (typeof USER_ROLES)[number];
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetUserActiveInput = z.infer<typeof setUserActiveSchema>;
export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
