'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

import type { PropertyFormState } from './actions';

interface PropertyFormProps {
  action: (prevState: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;
  initial?: {
    name: string;
    code: string;
    type: 'KOST' | 'HOUSE' | 'APARTMENT' | 'VILLA' | 'OTHER';
    address: string | null;
    description: string | null;
    isActive: boolean;
  };
  submitLabel: string;
}

const initialState: PropertyFormState = {};

export function PropertyForm({ action, initial, submitLabel }: PropertyFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <FormLayout>
        <FormCard
          title="Identitas Properti"
          description="Nama dan kode ini muncul di kode kontrak serta di seluruh menu admin."
        >
          <FormGrid>
            <Input
              label="Nama Properti"
              name="name"
              required
              placeholder="Gracianda House"
              defaultValue={initial?.name}
              error={state.fieldErrors?.name?.[0]}
            />
            <Input
              label="Kode Properti"
              name="code"
              required
              placeholder="GH"
              hint="Dipakai sebagai prefix kode kontrak."
              defaultValue={initial?.code}
              error={state.fieldErrors?.code?.[0]}
            />
            <Select
              name="type"
              label="Tipe Properti"
              required
              className="sm:col-span-2"
              defaultValue={initial?.type ?? 'KOST'}
              options={[
                { value: 'KOST', label: 'Rumah Kost', hint: 'Disewakan bulanan per kamar.' },
                { value: 'HOUSE', label: 'Rumah', hint: 'Disewakan satu rumah penuh.' },
                { value: 'APARTMENT', label: 'Apartemen' },
                { value: 'VILLA', label: 'Villa' },
                { value: 'OTHER', label: 'Lainnya' },
              ]}
              error={state.fieldErrors?.type?.[0]}
            />
          </FormGrid>
        </FormCard>

        <FormCard
          title="Alamat & Deskripsi"
          description="Ditampilkan di halaman publik properti."
        >
          <Textarea
            name="address"
            label="Alamat"
            rows={2}
            defaultValue={initial?.address ?? undefined}
            error={state.fieldErrors?.address?.[0]}
          />
          <Textarea
            name="description"
            label="Deskripsi"
            defaultValue={initial?.description ?? undefined}
            error={state.fieldErrors?.description?.[0]}
          />
        </FormCard>

        <FormCard title="Status" description="Properti nonaktif tidak bisa dipakai transaksi baru.">
          <Checkbox
            name="isActive"
            value="true"
            defaultChecked={initial?.isActive ?? true}
            label="Aktif"
            hint="Dapat digunakan untuk transaksi dan tampil di halaman publik."
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
