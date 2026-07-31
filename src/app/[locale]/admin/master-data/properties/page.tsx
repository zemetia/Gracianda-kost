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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left [&>th]:py-2 [&>th]:pr-4 [&>th]:text-xs [&>th]:font-medium [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-foreground-muted">
              <th>Nama Properti</th>
              <th>Kode</th>
              <th>Tipe</th>
              <th>Alamat</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {properties.map((prop) => (
              <tr key={prop.id} className="border-b border-border [&>td]:py-2.5 [&>td]:pr-4">
                <td className="font-medium text-foreground">{prop.name}</td>
                <td className="font-mono text-foreground-muted">{prop.code}</td>
                <td>
                  <Badge variant="secondary">
                    {prop.type === 'KOST' && 'Kost'}
                    {prop.type === 'HOUSE' && 'Rumah/Villa'}
                    {prop.type === 'APARTMENT' && 'Apartemen'}
                    {prop.type === 'VILLA' && 'Villa'}
                    {prop.type === 'OTHER' && 'Lainnya'}
                  </Badge>
                </td>
                <td className="max-w-[250px] truncate text-foreground-muted">
                  {prop.address || '—'}
                </td>
                <td>
                  <Badge variant={prop.isActive ? 'success' : 'outline'}>
                    {prop.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="pr-0 text-right">
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
                <td colSpan={6} className="py-8 text-center text-foreground-muted">
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
