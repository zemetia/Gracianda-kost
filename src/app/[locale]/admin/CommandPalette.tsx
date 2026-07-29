'use client';

import { DoorOpen, FileText, Search, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { adminSearchService } from '@/services/adminSearch.service';
import type { AdminSearchResponse, SearchResultItem } from '@/services/types';

type Group = 'rooms' | 'tenants' | 'contracts';

const GROUP_LABEL: Record<Group, string> = {
  rooms: 'Kamar',
  tenants: 'Penyewa',
  contracts: 'Kontrak',
};

const GROUP_ICON: Record<Group, typeof DoorOpen> = {
  rooms: DoorOpen,
  tenants: Users,
  contracts: FileText,
};

const EMPTY_RESULTS: AdminSearchResponse = { rooms: [], tenants: [], contracts: [] };
const DEBOUNCE_MS = 200;

// Global "find anything" — an admin thinks in terms of a room, a tenant, or
// a contract, not which module holds it. Mounted once in the admin layout so
// Ctrl+K works no matter which page is open.
export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminSearchResponse>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flatResults: (SearchResultItem & { group: Group })[] = (
    ['rooms', 'tenants', 'contracts'] as Group[]
  ).flatMap((group) => results[group].map((item) => ({ ...item, group })));

  const close = () => {
    clearTimeout(debounceRef.current);
    setIsOpen(false);
    setQuery('');
    setResults(EMPTY_RESULTS);
    setActiveIndex(0);
  };

  const navigateTo = (item: SearchResultItem) => {
    close();
    router.push(item.href);
  };

  // Ctrl+K / Cmd+K opens from anywhere; Escape closes.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(true);
      } else if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Clears any pending debounced search if the palette unmounts mid-typing.
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const runSearch = (term: string) => {
    clearTimeout(debounceRef.current);
    if (!term.trim()) {
      setResults(EMPTY_RESULTS);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      adminSearchService
        .search(term.trim())
        .then((data) => {
          setResults(data);
          setActiveIndex(0);
        })
        .catch(() => setResults(EMPTY_RESULTS))
        .finally(() => setIsLoading(false));
    }, DEBOUNCE_MS);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const active = flatResults[activeIndex];
      if (active) navigateTo(active);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-8 items-center gap-2 rounded-md border border-input bg-surface px-3 text-xs font-medium text-foreground-muted hover:border-border-strong hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Cari kamar, penyewa, kontrak…</span>
        <kbd className="hidden shrink-0 rounded border border-border bg-surface-raised px-1.5 py-0.5 text-[10px] font-semibold text-foreground-subtle sm:inline">
          Ctrl K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs"
            onClick={close}
            aria-hidden="true"
          />
          <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-foreground-subtle" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  runSearch(next);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Cari nomor kamar, nama penyewa, atau kode kontrak…"
                className="h-12 flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
              />
              <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-foreground-subtle">
                Esc
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {!query.trim() && (
                <p className="px-3 py-6 text-center text-sm text-foreground-subtle">
                  Ketik untuk mencari lintas kamar, penyewa, dan kontrak.
                </p>
              )}

              {query.trim() && isLoading && (
                <p className="px-3 py-6 text-center text-sm text-foreground-subtle">Mencari…</p>
              )}

              {query.trim() && !isLoading && flatResults.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-foreground-subtle">
                  Tidak ada hasil untuk &ldquo;{query}&rdquo;.
                </p>
              )}

              {(['rooms', 'tenants', 'contracts'] as Group[]).map((group) => {
                if (results[group].length === 0) return null;
                const Icon = GROUP_ICON[group];
                return (
                  <div key={group} className="mb-1 last:mb-0">
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                      {GROUP_LABEL[group]}
                    </p>
                    {results[group].map((item) => {
                      const flatIndex = flatResults.findIndex(
                        (r) => r.group === group && r.id === item.id,
                      );
                      const active = flatIndex === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          onClick={() => navigateTo(item)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                            active ? 'bg-primary-subtle' : 'hover:bg-surface-raised',
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              active ? 'text-primary' : 'text-foreground-subtle',
                            )}
                            aria-hidden="true"
                          />
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-foreground">
                              {item.title}
                            </span>
                            <span className="truncate text-xs text-foreground-muted">
                              {item.subtitle}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

CommandPalette.displayName = 'CommandPalette';
