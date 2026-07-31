'use client';

import { Building2 } from 'lucide-react';
import { useTransition } from 'react';

import { Select } from '@/components/ui/Select';

import { setPropertyScopeAction } from './actions';

interface Property {
  id: string;
  name: string;
}

interface Props {
  properties: Property[];
  value: string;
}

/**
 * Uncontrolled on purpose: the select moves the instant the admin picks, and
 * the server revalidation catches up behind it. A controlled value would leave
 * the dropdown visibly stuck on the old property until the round trip lands.
 */
export function PropertyScopeSwitcher({ properties, value }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <label htmlFor="property-scope" className="text-xs font-semibold text-foreground-muted">
        Properti
      </label>
      <Select
        id="property-scope"
        size="sm"
        placeholder="Semua Properti"
        allowEmpty
        defaultValue={value}
        disabled={isPending}
        onValueChange={(next) => startTransition(() => setPropertyScopeAction(next))}
        options={properties.map((property) => ({ value: property.id, label: property.name }))}
        className="w-auto min-w-44"
      />
    </div>
  );
}

PropertyScopeSwitcher.displayName = 'PropertyScopeSwitcher';
