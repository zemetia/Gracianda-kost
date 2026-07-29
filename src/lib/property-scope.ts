// Server-only: the "properti mana yang sedang saya kelola" context.
// Before this, every module read its own ?propertyId, so the scope reset the
// moment the admin moved from Pembayaran to Kontrak — and with a second
// property filled, that silently mixes two buildings in one table.

import { cookies } from 'next/headers';

export const PROPERTY_SCOPE_COOKIE = 'admin_property_id';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * The property to filter by. An explicit `?propertyId` wins so deep links (the
 * dashboard action queue, a bookmarked report) keep meaning what they say;
 * otherwise the switcher's cookie applies. `undefined` means all properties.
 */
export async function getPropertyScope(explicit?: string): Promise<string | undefined> {
  if (explicit) return explicit;
  const store = await cookies();
  return store.get(PROPERTY_SCOPE_COOKIE)?.value || undefined;
}

export async function setPropertyScope(propertyId: string | null): Promise<void> {
  const store = await cookies();
  if (!propertyId) {
    store.delete(PROPERTY_SCOPE_COOKIE);
    return;
  }
  store.set(PROPERTY_SCOPE_COOKIE, propertyId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: ONE_YEAR_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  });
}
