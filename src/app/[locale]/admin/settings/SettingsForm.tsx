'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { FormCard, FormError, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { electricityCharge } from '@/lib/electricity';
import { formatRupiah } from '@/lib/utils';

import { saveSettingsAction, type SettingsFormState } from './actions';

const initialState: SettingsFormState = {};

/** A reading an admin recognises, so the tariff is checked against a real bill. */
const SAMPLE_KWH = 100;

export function SettingsForm({ electricityTariffPerKwh }: { electricityTariffPerKwh: number }) {
  const [state, formAction, isPending] = useActionState(saveSettingsAction, initialState);
  const [tariff, setTariff] = useState<number | ''>(electricityTariffPerKwh);

  return (
    <form action={formAction}>
      <FormLayout>
        <FormCard
          title="Listrik"
          description="Dipakai untuk kamar yang cara bayar listriknya “Bayar (non-token)”. Tagihan periode itu bertambah sebesar pemakaian kWh × tarif ini."
        >
          <CurrencyInput
            label="Tarif per kWh"
            name="electricityTariffPerKwh"
            required
            className="sm:max-w-sm"
            value={tariff}
            onValueChange={setTariff}
            hint="Isi sesuai tarif yang ditagihkan PLN ke properti, dalam rupiah penuh."
            error={state.fieldErrors?.electricityTariffPerKwh?.[0]}
          />

          <p className="text-sm text-foreground-muted">
            Contoh: pemakaian {SAMPLE_KWH} kWh ditagih{' '}
            <span className="font-medium tabular-nums text-foreground">
              {formatRupiah(electricityCharge(SAMPLE_KWH, tariff === '' ? 0 : tariff))}
            </span>
            .
          </p>

          <p className="text-sm text-foreground-muted">
            Mengubah tarif tidak menghitung ulang tagihan yang pemakaiannya sudah dicatat — tiap
            tagihan menyimpan tarif yang berlaku saat pencatatan.
          </p>
        </FormCard>

        <FormError message={state.error} />

        <FormStickyBar
          secondary={
            state.saved ? 'Pengaturan tersimpan.' : 'Berlaku untuk semua properti dan kamar.'
          }
        >
          <Button type="submit" isLoading={isPending}>
            Simpan Pengaturan
          </Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
