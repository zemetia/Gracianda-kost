import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { ROLE_LABEL } from '@/config/roles';
import { Link } from '@/i18n/navigation';
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

const SELECT_CLASS =
  'h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

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

      <Card>
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-entity" className="text-sm font-medium text-foreground">
                Entitas
              </label>
              <select
                id="filter-entity"
                name="entityType"
                defaultValue={query.entityType ?? ''}
                className={SELECT_CLASS}
              >
                <option value="">Semua</option>
                {entityTypes.map((entityType) => (
                  <option key={entityType} value={entityType}>
                    {entityType}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-user" className="text-sm font-medium text-foreground">
                Pengguna
              </label>
              <select
                id="filter-user"
                name="userId"
                defaultValue={query.userId ?? ''}
                className={SELECT_CLASS}
              >
                <option value="">Semua</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-action" className="text-sm font-medium text-foreground">
                Aksi
              </label>
              <select
                id="filter-action"
                name="action"
                defaultValue={query.action ?? ''}
                className={SELECT_CLASS}
              >
                <option value="">Semua</option>
                <option value="CREATE">Buat</option>
                <option value="UPDATE">Ubah</option>
                <option value="DELETE">Hapus</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-from" className="text-sm font-medium text-foreground">
                Dari
              </label>
              <input
                id="filter-from"
                name="from"
                type="date"
                defaultValue={query.from ?? ''}
                className={SELECT_CLASS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-to" className="text-sm font-medium text-foreground">
                Sampai
              </label>
              <input
                id="filter-to"
                name="to"
                type="date"
                defaultValue={query.to ?? ''}
                className={SELECT_CLASS}
              />
            </div>

            <button
              type="submit"
              className="h-9 rounded-md border border-border bg-surface-raised px-4 text-sm font-medium text-foreground hover:border-border-strong"
            >
              Filter
            </button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Waktu</th>
              <th className="px-4 py-3 font-medium">Pengguna</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
              <th className="px-4 py-3 font-medium">Entitas</th>
              <th className="px-4 py-3 font-medium">Perubahan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-foreground-muted">
                  {row.createdAt.toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{row.user.name ?? row.user.email}</div>
                  <div className="text-xs text-foreground-subtle">
                    {ROLE_LABEL[row.user.role] ?? row.user.role}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ACTION_VARIANT[row.action]}>{ACTION_LABEL[row.action]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{row.entityType}</div>
                  <div className="font-mono text-xs text-foreground-subtle">{row.entityId}</div>
                </td>
                <td className="max-w-lg px-4 py-3">
                  <AuditDiff before={row.before} after={row.after} />
                </td>
              </tr>
            ))}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground-subtle">
                  Tidak ada catatan audit untuk filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-foreground-muted">
        <span>
          {result.total} catatan · halaman {result.page} dari {result.pageCount}
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
