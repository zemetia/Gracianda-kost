import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left [&>th]:py-2 [&>th]:pr-4 [&>th]:text-xs [&>th]:font-medium [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-foreground-muted">
              <th>Nama</th>
              <th>KTP</th>
              <th>HP</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b border-border [&>td]:py-2.5 [&>td]:pr-4">
                <td className="font-medium text-foreground">
                  <Link href={`/admin/tenants/${tenant.id}`} className="hover:underline">
                    {tenant.fullName}
                  </Link>
                </td>
                <td className="tabular-nums text-foreground-muted">{tenant.ktpNumber}</td>
                <td className="tabular-nums text-foreground-muted">{tenant.phone}</td>
                <td>{tenant.isBlacklisted && <Badge variant="destructive">Blacklist</Badge>}</td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-foreground-muted">
                  Tidak ada penyewa ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
