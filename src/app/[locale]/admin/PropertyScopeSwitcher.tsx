'use client';

import { Building2 } from 'lucide-react';
import { useTransition } from 'react';

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
      <select
        id="property-scope"
        defaultValue={value}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(() => setPropertyScopeAction(next));
        }}
        className="h-8 rounded-md border border-input bg-surface px-2 text-sm font-medium text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        <option value="">Semua Properti</option>
        {properties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.name}
          </option>
        ))}
      </select>
    </div>
  );
}

PropertyScopeSwitcher.displayName = 'PropertyScopeSwitcher';
