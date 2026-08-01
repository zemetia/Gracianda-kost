'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Money } from '@/components/ui/Money';
import { electricityCharge } from '@/lib/electricity';
import { formatRupiah } from '@/lib/utils';

import { recordElectricityAction, type RecordElectricityFormState } from '../actions';

const initialState: RecordElectricityFormState = {};

interface ElectricityFormProps {
  paymentId: string;
  /** Tariff in force now — snapshotted onto the payment the moment this saves. */
  tariffPerKwh: number;
  currentKwh: number | null;
}

export function ElectricityForm({ paymentId, tariffPerKwh, currentKwh }: ElectricityFormProps) {
  const [state, formAction, isPending] = useActionState(
    recordElectricityAction.bind(null, paymentId),
    initialState,
  );
  const [kwh, setKwh] = useState(currentKwh === null ? '' : String(currentKwh));

  const parsedKwh = Number(kwh);
  const preview = Number.isFinite(parsedKwh) ? electricityCharge(parsedKwh, tariffPerKwh) : 0;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          label="Pemakaian"
          name="kwh"
          type="number"
          min={0}
          step="0.01"
          required
          rightAddon="kWh"
          inputClassName="text-right tabular-nums"
          className="sm:max-w-3xs"
          value={kwh}
          onChange={(event) => setKwh(event.target.value)}
          hint={`Tarif berlaku ${formatRupiah(tariffPerKwh)} / kWh.`}
          error={state.fieldErrors?.kwh?.[0]}
        />

        <p className="pb-1 text-sm text-foreground-muted">
          Tambahan tagihan{' '}
          <Money value={preview} />
        </p>
      </div>

      <FormError message={state.error} />

      <Button type="submit" isLoading={isPending} className="self-start">
        {currentKwh === null ? 'Catat Pemakaian' : 'Perbarui Pemakaian'}
      </Button>
    </form>
  );
}
