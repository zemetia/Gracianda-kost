import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { paymentMethodService } from '@/services/payment-method.service';

import { NewPaymentMethodForm } from './NewPaymentMethodForm';
import { PaymentMethodCard } from './PaymentMethodCard';

export default async function PaymentMethodsPage() {
  const methods = await paymentMethodService.list();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Metode Pembayaran"
        description="Daftar tunai dan rekening/e-wallet yang bisa dipilih saat mencatat pembayaran — dasar Rekap Kas."
        backHref="/admin/settings"
      />

      <Card>
        <CardContent>
          <NewPaymentMethodForm />
        </CardContent>
      </Card>

      {methods.length === 0 ? (
        <p className="text-sm text-foreground-muted">Belum ada metode pembayaran.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {methods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              id={method.id}
              name={method.name}
              type={method.type}
              isActive={method.isActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
