import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Typography } from '@/components/ui/Typography';
import { ROLE_LABEL } from '@/config/roles';
import { Link } from '@/i18n/navigation';
import { formatDate, formatNumber } from '@/lib/utils';
import { auditLogFilterSchema } from '@/lib/validations';
import { auditService } from '@/services/audit.service';
import { userService } from '@/services/user.service';

import { AuditDiff } from './AuditDiff';

interface Props {
  searchParams: Promise<{
    entityType?: string;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Buat',
  UPDATE: 'Ubah',
  DELETE: 'Hapus',
};

const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'destructive',
};

export default async function AuditLogPage({ searchParams }: Props) {
  const query = await searchParams;

  // Bad query strings are hand-edited URLs, not user input — fall back to
  // an unfiltered first page instead of erroring.
  const parsed = auditLogFilterSchema.safeParse({
    entityType: query.entityType || undefined,
    userId: query.userId || undefined,
    action: query.action || undefined,
    from: query.from || undefined,
    to: query.to || undefined,
    page: query.page || undefined,
  });
  const filter = parsed.success ? parsed.data : auditLogFilterSchema.parse({});

  const [result, entityTypes, users] = await Promise.all([
    auditService.list(filter),
    auditService.entityTypes(),
    userService.list(),
  ]);

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (query.entityType) params.set('entityType', query.entityType);
    if (query.userId) params.set('userId', query.userId);
    if (query.action) params.set('action', query.action);
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);
    params.set('page', String(page));
    return `/admin/audit-log?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h2" className="mb-1">
          Audit Log
        </Typography>
        <Typography variant="muted">
          Seluruh mutasi data yang tercatat sistem — siapa mengubah apa, dan kapan.
        </Typography>
      </div>

      <Card noPadding>
        <CardContent className="p-4">
          <form method="get" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-4 lg:max-w-4xl lg:grid-cols-5">
              <Select
                name="entityType"
                label="Entitas"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={query.entityType ?? ''}
                options={entityTypes.map((entityType) => ({ value: entityType, label: entityType }))}
              />

              <Select
                name="userId"
                label="Pengguna"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={query.userId ?? ''}
                options={users.map((user) => ({ value: user.id, label: user.name ?? user.email ?? '—' }))}
              />

              <Select
                name="action"
                label="Aksi"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={query.action ?? ''}
                options={[
                  { value: 'CREATE', label: 'Buat' },
                  { value: 'UPDATE', label: 'Ubah' },
                  { value: 'DELETE', label: 'Hapus' },
                ]}
              />

              <DatePicker name="from" label="Dari" size="sm" defaultValue={query.from ?? ''} />

              <DatePicker name="to" label="Sampai" size="sm" defaultValue={query.to ?? ''} />
            </div>

            <Button type="submit" size="sm" variant="secondary" className="shrink-0">
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left [&>th]:py-2 [&>th]:pr-4 [&>th]:text-xs [&>th]:font-medium [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-foreground-muted">
              <th>Waktu</th>
              <th>Pengguna</th>
              <th>Aksi</th>
              <th>Entitas</th>
              <th>Perubahan</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.id} className="border-b border-border align-top [&>td]:py-2.5 [&>td]:pr-4">
                <td className="whitespace-nowrap tabular-nums text-foreground-muted">
                  {formatDate(row.createdAt, 'id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td>
                  <div className="font-medium text-foreground">{row.user.name ?? row.user.email}</div>
                  <div className="text-xs text-foreground-muted">
                    {ROLE_LABEL[row.user.role] ?? row.user.role}
                  </div>
                </td>
                <td>
                  <Badge variant={ACTION_VARIANT[row.action]}>{ACTION_LABEL[row.action]}</Badge>
                </td>
                <td>
                  <div className="font-medium text-foreground">{row.entityType}</div>
                  <div className="font-mono text-xs text-foreground-muted">{row.entityId}</div>
                </td>
                <td className="max-w-lg pr-0">
                  <AuditDiff before={row.before} after={row.after} />
                </td>
              </tr>
            ))}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-foreground-muted">
                  Tidak ada catatan audit untuk filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-foreground-muted">
        <span>
          <span className="tabular-nums">{formatNumber(result.total)}</span> catatan · halaman{' '}
          <span className="tabular-nums">{result.page}</span> dari{' '}
          <span className="tabular-nums">{result.pageCount}</span>
        </span>
        <div className="flex gap-2">
          {result.page > 1 && (
            <Link
              href={pageHref(result.page - 1)}
              className="rounded-md border border-border px-3 py-1.5 hover:border-border-strong"
            >
              Sebelumnya
            </Link>
          )}
          {result.page < result.pageCount && (
            <Link
              href={pageHref(result.page + 1)}
              className="rounded-md border border-border px-3 py-1.5 hover:border-border-strong"
            >
              Berikutnya
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
