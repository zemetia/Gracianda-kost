import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { propertyService } from '@/services/property.service';
import { deactivatePropertyAction } from './actions';

export default async function PropertiesPage() {
  const properties = await propertyService.list();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            Properti
          </Typography>
          <Typography variant="muted">Kelola data gedung kost, rumah sewa, apartemen, atau villa.</Typography>
        </div>
        <Link href="/admin/master-data/properties/new">
          <Button>Tambah Properti</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nama Properti</th>
              <th className="px-4 py-3 font-medium">Kode</th>
              <th className="px-4 py-3 font-medium">Tipe</th>
              <th className="px-4 py-3 font-medium">Alamat</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {properties.map((prop) => (
              <tr key={prop.id}>
                <td className="px-4 py-3 font-medium text-foreground">{prop.name}</td>
                <td className="px-4 py-3 text-foreground-muted font-mono">{prop.code}</td>
                <td className="px-4 py-3 text-foreground-muted">
                  <Badge variant="secondary">
                    {prop.type === 'KOST' && 'Kost'}
                    {prop.type === 'HOUSE' && 'Rumah/Villa'}
                    {prop.type === 'APARTMENT' && 'Apartemen'}
                    {prop.type === 'VILLA' && 'Villa'}
                    {prop.type === 'OTHER' && 'Lainnya'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground-muted max-w-[250px] truncate">
                  {prop.address || '-'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={prop.isActive ? 'success' : 'outline'}>
                    {prop.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/master-data/properties/${prop.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                    {prop.isActive && (
                      <form action={deactivatePropertyAction.bind(null, prop.id)}>
                        <Button variant="ghost" size="sm" type="submit">
                          Nonaktifkan
                        </Button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground-subtle">
                  Belum ada properti.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
