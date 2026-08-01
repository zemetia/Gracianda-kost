import { Badge } from '@/components/ui/Badge';
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
import { genderLabel } from '@/lib/tenant';
import { tenantService } from '@/services/tenant.service';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function TenantsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const tenants = await tenantService.search(q ?? '');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h2" className="mb-1">
          Penyewa
        </Typography>
        <Typography variant="muted">Data penyewa — dipakai ulang lintas kontrak.</Typography>
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
              <TableCell>{tenant.isBlacklisted && <Badge variant="destructive">Blacklist</Badge>}</TableCell>
            </TableRow>
          ))}
          {tenants.length === 0 && <TableEmpty colSpan={5}>Tidak ada penyewa ditemukan.</TableEmpty>}
        </TableBody>
      </Table>
    </div>
  );
}
