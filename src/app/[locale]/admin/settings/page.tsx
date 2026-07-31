import { ChevronRight } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Link } from '@/i18n/navigation';
import { settingService } from '@/services/setting.service';

import { SettingsForm } from './SettingsForm';

export default async function SettingsPage() {
  const settings = await settingService.getAll();

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Pengaturan"
        description="Angka yang dipakai berulang oleh modul lain. Berlaku untuk seluruh properti."
      />

      <SettingsForm electricityTariffPerKwh={settings.electricityTariffPerKwh} />

      <Card noPadding>
        <Link
          href="/admin/settings/payment-methods"
          className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm"
        >
          <span>
            <span className="block font-medium text-foreground">Metode Pembayaran</span>
            <span className="block text-foreground-muted">Kelola tunai, rekening bank, dan e-wallet.</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-foreground-subtle" aria-hidden />
        </Link>
      </Card>
    </div>
  );
}
