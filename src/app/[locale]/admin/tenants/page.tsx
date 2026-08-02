import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { canAccess } from '@/lib/auth';
import { blacklistReasonLabel, blacklistReasonTone } from '@/lib/blacklist';
import { genderLabel } from '@/lib/tenant';
import { tenantService } from '@/services/tenant.service';

import { TenantRowActions } from './TenantRowActions';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function TenantsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  // KEUANGAN may read this list but not mutate it — an action column it would
  // only get Forbidden from is worse than no column.
  const [tenants, canManage] = await Promise.all([
    tenantService.search(q ?? ''),
    canAccess(['SUPER_ADMIN', 'OPERASIONAL']),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography variant="h2" className="mb-1">
            Penyewa
          </Typography>
          <Typography variant="muted">Data penyewa — dipakai ulang lintas kontrak.</Typography>
        </div>
        <Link href="/admin/tenants/blacklist">
          <Button variant="secondary">Lihat Blacklist</Button>
        </Link>
      </div>

      <Card noPadding>
        <CardContent className="p-4">
          <form method="get" className="max-w-sm">
            <Input
              label="Cari"
              name="q"
              size="sm"
              defaultValue={q}
              placeholder="Nama, KTP, atau nomor HP"
            />
          </form>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>KTP</TableHead>
            <TableHead>Jenis Kelamin</TableHead>
            <TableHead>HP</TableHead>
            <TableHead>Status</TableHead>
            {canManage && (
              <TableHead className="text-right">
                <span className="sr-only">Aksi</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="font-medium text-foreground">
                <Link href={`/admin/tenants/${tenant.id}`} className="hover:underline">
                  {tenant.fullName}
                </Link>
              </TableCell>
              <TableCell className="tabular-nums text-foreground-muted">{tenant.ktpNumber}</TableCell>
              <TableCell className="text-foreground-muted">{genderLabel(tenant.gender)}</TableCell>
              <TableCell className="tabular-nums text-foreground-muted">{tenant.phone}</TableCell>
              <TableCell>
                {tenant.isBlacklisted && (
                  <Badge variant={blacklistReasonTone(tenant.blacklistReason)}>
                    {blacklistReasonLabel(tenant.blacklistReason)}
                  </Badge>
                )}
              </TableCell>
              {canManage && (
                <TableCell>
                  <TenantRowActions
                    tenant={{
                      id: tenant.id,
                      fullName: tenant.fullName,
                      ktpNumber: tenant.ktpNumber,
                      phone: tenant.phone,
                      isBlacklisted: tenant.isBlacklisted,
                      blacklistReason: tenant.blacklistReason,
                      blacklistNote: tenant.blacklistNote,
                    }}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
          {tenants.length === 0 && (
            <TableEmpty colSpan={canManage ? 6 : 5}>Tidak ada penyewa ditemukan.</TableEmpty>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
