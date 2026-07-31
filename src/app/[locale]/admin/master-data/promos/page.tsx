import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { formatDate } from '@/lib/utils';
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

      <section className="max-w-2xl">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Tambah Promo</h3>
        <NewPromoForm />
      </section>

      <section className="flex flex-col">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Daftar Promo
        </h3>
        {promos.map((promo) => {
          const isRunning = promo.isActive && promo.startDate <= today && promo.endDate >= today;
          return (
            <div
              key={promo.id}
              className="flex items-center justify-between gap-4 border-b border-border py-3"
            >
              <div>
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{promo.title}</span>
                  <Badge variant={isRunning ? 'success' : 'outline'}>
                    {isRunning ? 'Berjalan' : promo.isActive ? 'Terjadwal/Selesai' : 'Nonaktif'}
                  </Badge>
                </div>
                <span className="text-xs tabular-nums text-foreground-muted">
                  {formatDate(promo.startDate, 'id-ID')} – {formatDate(promo.endDate, 'id-ID')}
                </span>
              </div>
              <form action={removePromoAction.bind(null, promo.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Hapus
                </Button>
              </form>
            </div>
          );
        })}
        {promos.length === 0 && (
          <p className="py-3 text-sm text-foreground-muted">Belum ada promo.</p>
        )}
      </section>
    </div>
  );
}
