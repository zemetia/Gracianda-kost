'use client';

import { CircleDashed } from 'lucide-react';
import { DynamicIcon, iconNames } from 'lucide-react/dynamic';

import { cn } from '@/lib/cn';

/** Icon names are stored in the database as kebab-case lucide names, e.g. `bed-double`. */
export function isIconName(name: string | null | undefined): boolean {
  return !!name && (iconNames as readonly string[]).includes(name);
}

export interface IconProps {
  /** kebab-case lucide name. Anything unknown renders the placeholder instead. */
  name: string | null | undefined;
  className?: string;
}

/**
 * Renders a lucide icon chosen at runtime. The name comes from data, so it is
 * validated first — `DynamicIcon` logs a console error for names it cannot find.
 */
export function Icon({ name, className }: IconProps) {
  const classes = cn('h-4 w-4 shrink-0', className);

  if (!isIconName(name)) {
    return <CircleDashed className={cn(classes, 'text-foreground-subtle')} aria-hidden />;
  }

  return (
    <DynamicIcon
      name={name as Parameters<typeof DynamicIcon>[0]['name']}
      className={classes}
      fallback={() => <CircleDashed className={cn(classes, 'text-foreground-subtle')} />}
      aria-hidden
    />
  );
}
