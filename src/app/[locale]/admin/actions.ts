'use server';

import { revalidatePath } from 'next/cache';

import { signOut } from '@/auth';
import { requireAuth } from '@/lib/auth';
import { setPropertyScope } from '@/lib/property-scope';

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/sign-in' });
}

/**
 * Switches the property every admin list is scoped to. Revalidates the whole
 * admin layout because the scope changes what *every* page below it shows.
 */
export async function setPropertyScopeAction(propertyId: string): Promise<void> {
  await requireAuth();
  await setPropertyScope(propertyId || null);
  revalidatePath('/[locale]/admin', 'layout');
}
