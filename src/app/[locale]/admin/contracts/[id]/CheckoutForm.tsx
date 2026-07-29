'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { checkoutContractAction, type ContractFormState } from '../actions';

interface Props {
  contractId: string;
  deposit: number;
  outstanding: number;
}

const initialState: ContractFormState = {};

function rupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function CheckoutForm({ contractId, deposit, outstanding }: Props) {
  const [state, formAction, isPending] = useActionState(
    checkoutContractAction.bind(null, contractId),
    initialState,
  );

  const [deduction, setDeduction] = useState(0);
  const [hasDamage, setHasDamage] = useState(false);

  const refund = Math.max(deposit - Math.min(deduction, deposit), 0);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Tanggal Keluar"
          name="actualEndDate"
          type="date"
          required
          defaultValue={new Date().toISOString().split('T')[0]}
          error={state.fieldErrors?.actualEndDate?.[0]}
        />
      </div>

      <div
        className={`rounded-lg border p-4 ${
          outstanding > 0 ? 'border-destructive/30 bg-destructive-subtle' : 'border-border bg-surface-raised'
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Sisa Tunggakan
        </p>
        <p
          className={`mt-1 text-2xl font-bold ${
            outstanding > 0 ? 'text-destructive' : 'text-success'
          }`}
        >
          {rupiah(outstanding)}
        </p>
        <p className="mt-1 text-xs text-foreground-muted">
          {outstanding > 0
            ? 'Tagih atau potong dari deposit sebelum penyewa keluar.'
            : 'Semua tagihan penyewa ini sudah lunas.'}
        </p>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium text-foreground">Penyelesaian Deposit</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-foreground-muted">Deposit Diterima</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{rupiah(deposit)}</p>
          </div>
          <Input
            label="Potongan"
            name="depositDeduction"
            type="number"
            min={0}
            max={deposit}
            step="1000"
            value={deduction || ''}
            onChange={(event) => setDeduction(Number(event.target.value))}
          />
          <div>
            <p className="text-xs text-foreground-muted">Dikembalikan</p>
            <p className="mt-1 text-sm font-semibold text-success">{rupiah(refund)}</p>
          </div>
        </div>

        <Input label="Catatan Deposit" name="depositNote" placeholder="Alasan potongan, cara pengembalian" />
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium text-foreground">Kondisi Kamar</legend>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={hasDamage}
            onChange={(event) => setHasDamage(event.target.checked)}
          />
          Ada kerusakan yang perlu diperbaiki
        </label>

        {hasDamage && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Kerusakan" name="damageNote" required placeholder="Kaca jendela retak" />
            <Input label="Perkiraan Biaya" name="damageCost" type="number" min={0} step="1000" />
            <p className="text-xs text-foreground-muted sm:col-span-2">
              Akan otomatis tercatat sebagai maintenance kamar ini.
            </p>
          </div>
        )}
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="destructive" isLoading={isPending} className="self-start">
        Proses Check-out
      </Button>
    </form>
  );
}
