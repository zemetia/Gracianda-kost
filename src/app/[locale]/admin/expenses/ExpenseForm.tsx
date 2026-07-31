'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DatePicker, toISODate } from '@/components/ui/DatePicker';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/expense';

import type { ExpenseFormState } from './actions';

export interface ExpenseFormInitial {
  category: ExpenseCategory;
  date?: string;
  amount: number;
  payee: string | null;
  note: string | null;
}

interface ExpenseFormProps {
  action: (prevState: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
  propertyId: string;
  initial?: ExpenseFormInitial;
  submitLabel: string;
}

const initialState: ExpenseFormState = {};

export function ExpenseForm({ action, propertyId, initial, submitLabel }: ExpenseFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="propertyId" value={propertyId} />

      <FormLayout>
        <FormCard title="Detail Pengeluaran" description="Kategori, tanggal, dan nominal biaya yang dikeluarkan.">
          <FormGrid columns={2}>
            <Select
              name="category"
              label="Kategori"
              required
              defaultValue={initial?.category}
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
              error={state.fieldErrors?.category?.[0]}
            />
            <DatePicker
              name="date"
              label="Tanggal"
              required
              defaultValue={initial?.date ?? toISODate(new Date())}
              error={state.fieldErrors?.date?.[0]}
            />
          </FormGrid>

          <CurrencyInput
            label="Nominal"
            name="amount"
            required
            className="sm:max-w-sm"
            defaultValue={initial?.amount}
            error={state.fieldErrors?.amount?.[0]}
          />

          <FormGrid columns={2}>
            <Input
              label="Penerima / Vendor"
              name="payee"
              placeholder="PLN, Budi (ART), Indihome, dll"
              defaultValue={initial?.payee ?? undefined}
              error={state.fieldErrors?.payee?.[0]}
            />
          </FormGrid>

          <Textarea
            name="note"
            label="Catatan"
            defaultValue={initial?.note ?? undefined}
            error={state.fieldErrors?.note?.[0]}
          />
        </FormCard>

        <FormError message={state.error} />

        <FormStickyBar>
          <Button type="submit" isLoading={isPending}>
            {submitLabel}
          </Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
