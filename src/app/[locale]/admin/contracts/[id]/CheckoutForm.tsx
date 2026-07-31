'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DatePicker, toISODate } from '@/components/ui/DatePicker';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { MetricBlock } from '@/components/ui/Metric';
import { formatNumber, formatRupiah } from '@/lib/utils';

import { checkoutContractAction, type ContractFormState } from '../actions';

interface Props {
  contractId: string;
  deposit: number;
  outstanding: number;
}

const initialState: ContractFormState = {};

export function CheckoutForm({ contractId, deposit, outstanding }: Props) {
  const [state, formAction, isPending] = useActionState(
    checkoutContractAction.bind(null, contractId),
    initialState,
  );

  const [deduction, setDeduction] = useState<number | ''>('');
  const [hasDamage, setHasDamage] = useState(false);

  const refund = Math.max(deposit - Math.min(Number(deduction) || 0, deposit), 0);

  return (
    <form action={formAction}>
      <FormLayout>
        {/* Metrics stay typographic — cards are for input, not for numbers. */}
        <section className="border-y border-border py-6">
          <MetricBlock
            label="Sisa Tunggakan"
            value={formatNumber(outstanding)}
            prefix="Rp"
            size="secondary"
            tone={outstanding > 0 ? 'destructive' : 'muted'}
            meta={
              outstanding > 0
                ? 'Tagih atau potong dari deposit sebelum penyewa keluar.'
                : 'Semua tagihan penyewa ini sudah lunas.'
            }
          />
        </section>

        <FormCard title="Tanggal Keluar" description="Tanggal penyewa benar-benar meninggalkan unit.">
          <DatePicker
            label="Tanggal Keluar"
            name="actualEndDate"
            required
            className="sm:max-w-xs"
            defaultValue={toISODate(new Date())}
            error={state.fieldErrors?.actualEndDate?.[0]}
          />
        </FormCard>

        <FormCard
          title="Penyelesaian Deposit"
          description={`Deposit diterima ${formatRupiah(deposit)}. Sisa setelah potongan dikembalikan ke penyewa.`}
        >
          <FormGrid>
            <CurrencyInput
              label="Potongan"
              name="depositDeduction"
              value={deduction}
              onValueChange={setDeduction}
              hint={`Maksimal ${formatRupiah(deposit)}.`}
            />
            <MetricBlock
              label="Dikembalikan"
              value={formatNumber(refund)}
              prefix="Rp"
              size="secondary"
              className="self-end pb-1"
            />
          </FormGrid>

          <Input label="Catatan Deposit" name="depositNote" placeholder="Alasan potongan, cara pengembalian" />
        </FormCard>

        <FormCard title="Kondisi Kamar" description="Kerusakan otomatis tercatat sebagai maintenance kamar ini.">
          <Checkbox
            checked={hasDamage}
            onChange={(event) => setHasDamage(event.target.checked)}
            label="Ada kerusakan yang perlu diperbaiki"
          />

          {hasDamage && (
            <FormGrid>
              <Input label="Kerusakan" name="damageNote" required placeholder="Kaca jendela retak" />
              <CurrencyInput label="Perkiraan Biaya" name="damageCost" />
            </FormGrid>
          )}
        </FormCard>

        <FormError message={state.error} />

        <FormStickyBar secondary="Kontrak ditutup dan kamar kembali tersedia setelah check-out diproses.">
          <Button type="submit" variant="destructive" isLoading={isPending}>
            Proses Check-out
          </Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
