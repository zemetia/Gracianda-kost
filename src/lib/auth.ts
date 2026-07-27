import { auth } from '@/auth';
import type { Session } from 'next-auth';

export async function getSession(): Promise<Session | null> {
  return auth();
}

export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session;
}

export async function requireRole(role: string | string[]): Promise<Session> {
  const session = await requireAuth();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(session.user.role)) throw new Error('Forbidden');
  return session;
}

// Non-throwing variant for pages/layouts: lets the caller render a 403 screen
// instead of crashing into the error boundary. Server Actions keep requireRole().
export async function canAccess(role: string | string[]): Promise<boolean> {
  const session = await getSession();
  if (!session?.user?.id) return false;
  const allowed = Array.isArray(role) ? role : [role];
  return allowed.includes(session.user.role);
}
