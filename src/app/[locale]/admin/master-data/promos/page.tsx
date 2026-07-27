import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { promoService } from '@/services/promo.service';

import { removePromoAction } from './actions';
import { NewPromoForm } from './NewPromoForm';

export default async function PromosPage() {
  const promos = await promoService.list();
  const today = new Date();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Typography variant="h2" className="mb-1">
          Promo
        </Typography>
        <Typography variant="muted">Promo yang tampil sebagai banner di website publik.</Typography>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Promo</CardTitle>
        </CardHeader>
        <CardContent>
          <NewPromoForm />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {promos.map((promo) => {
          const isRunning = promo.isActive && promo.startDate <= today && promo.endDate >= today;
          return (
            <Card key={promo.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Typography variant="large">{promo.title}</Typography>
                    <Badge variant={isRunning ? 'success' : 'outline'}>
                      {isRunning ? 'Berjalan' : promo.isActive ? 'Terjadwal/Selesai' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <Typography variant="muted">
                    {promo.startDate.toLocaleDateString('id-ID')} –{' '}
                    {promo.endDate.toLocaleDateString('id-ID')}
                  </Typography>
                </div>
                <form action={removePromoAction.bind(null, promo.id)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Hapus
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
        {promos.length === 0 && <Typography variant="muted">Belum ada promo.</Typography>}
      </div>
    </div>
  );
}
