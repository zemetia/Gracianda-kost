'use client';

import { Search, X } from 'lucide-react';
import { useState, useTransition, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { ChipGroup, ChipToggle } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { useRouter } from '@/i18n/navigation';
import { PROPERTY_TYPE_OPTIONS } from '@/lib/property';

import { buildSearchQuery, type SearchQuery, type SearchView } from './query';

export interface SearchFiltersProps {
  initial: SearchQuery;
  properties: { id: string; name: string; type: string }[];
  roomTypes: { id: string; name: string; propertyId: string }[];
  facilities: { id: string; name: string; icon: string | null }[];
  /** How many units the current query matched — printed next to the controls. */
  resultCount: number;
}

/**
 * The whole filter state lives in the URL, not in a store: a search someone
 * wants to send to a friend has to survive being copy-pasted, and the results
 * are rendered on the server anyway.
 */
export function SearchFilters({
  initial,
  properties,
  roomTypes,
  facilities,
  resultCount,
}: SearchFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState<SearchQuery>(initial);
  const [text, setText] = useState(initial.q ?? '');

  const apply = (next: SearchQuery) => {
    setQuery(next);
    startTransition(() => {
      router.replace(`/cari-kamar${buildSearchQuery(next)}`, { scroll: false });
    });
  };

  // Picking a property invalidates a room type that belongs to another one.
  const patch = (changes: Partial<SearchQuery>) => {
    const next = { ...query, ...changes };
    if (changes.propertyId !== undefined && next.groupId) {
      const stillValid = roomTypes.some(
        (type) => type.id === next.groupId && (!next.propertyId || type.propertyId === next.propertyId),
      );
      if (!stillValid) next.groupId = '';
    }
    apply(next);
  };

  const toggleFacility = (facilityId: string, checked: boolean) => {
    const next = checked
      ? [...query.facilityIds, facilityId]
      : query.facilityIds.filter((id) => id !== facilityId);
    apply({ ...query, facilityIds: next });
  };

  const submitText = (event: FormEvent) => {
    event.preventDefault();
    apply({ ...query, q: text.trim() });
  };

  const reset = () => {
    setText('');
    apply({
      q: '',
      propertyId: '',
      propertyType: '',
      groupId: '',
      facilityIds: [],
      onlyAvailable: false,
      view: query.view,
    });
  };

  const visibleRoomTypes = query.propertyId
    ? roomTypes.filter((type) => type.propertyId === query.propertyId)
    : roomTypes;

  const hasFilters =
    !!query.q ||
    !!query.propertyId ||
    !!query.propertyType ||
    !!query.groupId ||
    query.facilityIds.length > 0 ||
    query.onlyAvailable;

  return (
    <div
      className={`flex flex-col gap-6 rounded-[1.75rem] border border-border/50 bg-surface p-6 shadow-sm transition-opacity sm:p-8 ${
        isPending ? 'opacity-60' : ''
      }`}
    >
      <form onSubmit={submitText} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          label="Kata kunci"
          placeholder="Nomor kamar, nama tipe, atau nama properti"
          value={text}
          onChange={(event) => setText(event.target.value)}
          leftAddon={<Search className="h-4 w-4" />}
          className="flex-1"
        />
        <Button type="submit" size="lg" className="shrink-0">
          Cari
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select
          label="Kategori hunian"
          options={PROPERTY_TYPE_OPTIONS}
          value={query.propertyType}
          onValueChange={(value) => patch({ propertyType: value })}
          placeholder="Semua kategori"
          allowEmpty
        />
        <Select
          label="Properti"
          options={properties.map((property) => ({ value: property.id, label: property.name }))}
          value={query.propertyId}
          onValueChange={(value) => patch({ propertyId: value })}
          placeholder="Semua properti"
          allowEmpty
        />
        <Select
          label="Tipe kamar"
          options={visibleRoomTypes.map((type) => ({ value: type.id, label: type.name }))}
          value={query.groupId}
          onValueChange={(value) => patch({ groupId: value })}
          placeholder="Semua tipe"
          allowEmpty
        />
      </div>

      {facilities.length > 0 && (
        <ChipGroup label="Fasilitas kamar" hint="Kamar harus punya semua fasilitas yang dipilih.">
          {facilities.map((facility) => (
            <ChipToggle
              key={facility.id}
              name="facilityIds"
              value={facility.id}
              label={facility.name}
              icon={<Icon name={facility.icon} className="size-4" />}
              checked={query.facilityIds.includes(facility.id)}
              onCheckedChange={(checked) => toggleFacility(facility.id, checked)}
            />
          ))}
        </ChipGroup>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border/30 pt-5">
        <div className="flex flex-wrap items-end gap-4">
          <SegmentedControl
            label="Ketersediaan"
            options={[
              { value: 'all', label: 'Semua' },
              { value: 'available', label: 'Belum terisi' },
            ]}
            value={query.onlyAvailable ? 'available' : 'all'}
            onValueChange={(value) => apply({ ...query, onlyAvailable: value === 'available' })}
          />
          <SegmentedControl
            label="Tampilan"
            options={[
              { value: 'tipe', label: 'Per tipe' },
              { value: 'kamar', label: 'Per kamar' },
            ]}
            value={query.view}
            onValueChange={(value) => apply({ ...query, view: value as SearchView })}
          />
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm text-foreground-muted">
            <span className="font-bold text-foreground tabular-nums">{resultCount}</span> kamar cocok
          </p>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<X className="h-4 w-4" />}
              onClick={reset}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
