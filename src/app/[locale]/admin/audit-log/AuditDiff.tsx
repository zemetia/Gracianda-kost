import type { ReactNode } from 'react';

// Plain <details> so the JSON viewer stays a Server Component — no client JS
// needed just to expand a row.
function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-xs font-medium text-foreground-muted">{title}</p>
      <pre className="overflow-x-auto rounded-md border border-border bg-surface-raised p-3 text-xs text-foreground-muted">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export function AuditDiff({ before, after }: { before: unknown; after: unknown }): ReactNode {
  const hasBefore = before !== null && before !== undefined;
  const hasAfter = after !== null && after !== undefined;
  if (!hasBefore && !hasAfter) {
    return <span className="text-xs text-foreground-subtle">—</span>;
  }

  return (
    <details className="group">
      <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
        Lihat perubahan
      </summary>
      <div className="mt-2 flex flex-col gap-3 lg:flex-row">
        {hasBefore && <JsonBlock title="Sebelum" value={before} />}
        {hasAfter && <JsonBlock title="Sesudah" value={after} />}
      </div>
    </details>
  );
}
