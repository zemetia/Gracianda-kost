import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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

      {properties.length === 0 ? (
        <p className="py-12 text-center text-sm text-foreground-muted">Belum ada properti.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((prop) => (
            <Card key={prop.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{prop.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-foreground-muted">{prop.code}</p>
                </div>
                <Badge variant={prop.isActive ? 'success' : 'outline'}>
                  {prop.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {prop.type === 'KOST' && 'Kost'}
                  {prop.type === 'HOUSE' && 'Rumah/Villa'}
                  {prop.type === 'APARTMENT' && 'Apartemen'}
                  {prop.type === 'VILLA' && 'Villa'}
                  {prop.type === 'OTHER' && 'Lainnya'}
                </Badge>
              </div>

              <p className="line-clamp-2 text-sm text-foreground-muted">{prop.address || '—'}</p>

              <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
