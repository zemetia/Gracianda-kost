/**
 * The search URL is the search state. Parsing and serialising it lives here so
 * the Server Component that reads `searchParams` and the client filter panel
 * that writes them can never disagree about a parameter name.
 */

export type SearchView = 'tipe' | 'kamar';

export interface SearchQuery {
  q: string;
  propertyId: string;
  propertyType: string;
  /** A RoomType id, or a `tanpa-tipe-<propertyId>` bucket id. */
  groupId: string;
  facilityIds: string[];
  onlyAvailable: boolean;
  view: SearchView;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export function parseSearchQuery(params: RawSearchParams): SearchQuery {
  const facilities = single(params['fasilitas']);

  return {
    q: single(params['q']).trim(),
    propertyId: single(params['properti']),
    propertyType: single(params['kategori']),
    groupId: single(params['tipe']),
    facilityIds: facilities ? facilities.split(',').filter(Boolean) : [],
    onlyAvailable: single(params['kosong']) === '1',
    view: single(params['tampilan']) === 'kamar' ? 'kamar' : 'tipe',
  };
}

/** Serialises back to `?a=b`, or `''` when nothing is set — never a bare `?`. */
export function buildSearchQuery(query: SearchQuery): string {
  const params = new URLSearchParams();

  if (query.q) params.set('q', query.q);
  if (query.propertyId) params.set('properti', query.propertyId);
  if (query.propertyType) params.set('kategori', query.propertyType);
  if (query.groupId) params.set('tipe', query.groupId);
  if (query.facilityIds.length > 0) params.set('fasilitas', query.facilityIds.join(','));
  if (query.onlyAvailable) params.set('kosong', '1');
  if (query.view === 'kamar') params.set('tampilan', 'kamar');

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}
