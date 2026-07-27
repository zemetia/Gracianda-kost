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

      <Card>
        <CardContent>
          <form method="get" className="max-w-sm">
            <Input
              label="Cari"
              name="q"
              defaultValue={q}
              placeholder="Nama, KTP, atau nomor HP"
            />
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">KTP</th>
              <th className="px-4 py-3 font-medium">HP</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link href={`/admin/tenants/${tenant.id}`} className="hover:underline">
                    {tenant.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground-muted">{tenant.ktpNumber}</td>
                <td className="px-4 py-3 text-foreground-muted">{tenant.phone}</td>
                <td className="px-4 py-3">
                  {tenant.isBlacklisted && <Badge variant="destructive">Blacklist</Badge>}
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-foreground-subtle">
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
