import { apiClient } from './client';
import type { AdminSearchResponse } from './types';

export const adminSearchService = {
  search: (query: string): Promise<AdminSearchResponse> =>
    apiClient.get<AdminSearchResponse>(`/api/admin/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store',
    }),
};
