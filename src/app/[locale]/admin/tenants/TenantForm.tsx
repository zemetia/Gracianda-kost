'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { DatePicker, toISODate } from '@/components/ui/DatePicker';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS } from '@/lib/tenant';

import type { TenantFormState } from './actions';

export interface TenantFormInitial {
  fullName: string;
  ktpNumber: string;
  phone: string;
  email: string | null;
  gender: string | null;
  maritalStatus: string | null;
  birthPlace: string | null;
  birthDate: Date | null;
  idAddress: string | null;
  occupation: string | null;
  institution: string | null;
  vehicleType: string | null;
  vehiclePlate: string | null;
  emergencyName: string | null;
  emergencyRelation: string | null;
  emergencyPhone: string | null;
}

interface Props {
  action: (prevState: TenantFormState, formData: FormData) => Promise<TenantFormState>;
  initial: TenantFormInitial;
  submitLabel: string;
}

const initialState: TenantFormState = {};

/**
 * The same identity fields the contract wizard collects for a new tenant, on
 * their own page — data typed in a hurry at check-in has to be correctable
 * later without opening a contract.
 */
export function TenantForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <FormLayout>
        <FormCard
          title="Identitas"
          description="Nama, KTP, dan nomor HP dipakai lintas kontrak — perbaiki di sini, bukan per kontrak."
        >
          <FormGrid>
            <Input
              label="Nama Lengkap"
              name="fullName"
              required
              defaultValue={initial.fullName}
              error={state.fieldErrors?.fullName?.[0]}
            />
            <Input
              label="Nomor KTP"
              name="ktpNumber"
              required
              defaultValue={initial.ktpNumber}
              error={state.fieldErrors?.ktpNumber?.[0]}
            />
            <Select
              label="Jenis Kelamin"
              name="gender"
              placeholder="Pilih jenis kelamin"
              allowEmpty
              options={GENDER_OPTIONS}
              defaultValue={initial.gender ?? ''}
              error={state.fieldErrors?.gender?.[0]}
            />
            <Select
              label="Status Pernikahan"
              name="maritalStatus"
              placeholder="Pilih status"
              allowEmpty
              options={MARITAL_STATUS_OPTIONS}
              defaultValue={initial.maritalStatus ?? ''}
              error={state.fieldErrors?.maritalStatus?.[0]}
            />
            <Input
              label="Tempat Lahir"
              name="birthPlace"
              defaultValue={initial.birthPlace ?? ''}
              error={state.fieldErrors?.birthPlace?.[0]}
            />
            <DatePicker
              label="Tanggal Lahir"
              name="birthDate"
              defaultValue={initial.birthDate ? toISODate(initial.birthDate) : ''}
              max={toISODate(new Date())}
              error={state.fieldErrors?.birthDate?.[0]}
            />
            <Input
              label="Nomor HP"
              name="phone"
              required
              defaultValue={initial.phone}
              error={state.fieldErrors?.phone?.[0]}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              defaultValue={initial.email ?? ''}
              error={state.fieldErrors?.email?.[0]}
            />
            <Textarea
              label="Alamat Asal (sesuai KTP)"
              name="idAddress"
              rows={2}
              className="sm:col-span-2"
              defaultValue={initial.idAddress ?? ''}
              error={state.fieldErrors?.idAddress?.[0]}
            />
          </FormGrid>
        </FormCard>

        <FormCard
          title="Pekerjaan & Kendaraan"
          description="Dipakai saat menghubungi penyewa di jam kerja dan mencocokkan kendaraan di parkiran."
        >
          <FormGrid>
            <Input
              label="Pekerjaan"
              name="occupation"
              defaultValue={initial.occupation ?? ''}
              error={state.fieldErrors?.occupation?.[0]}
            />
            <Input
              label="Kantor / Kampus"
              name="institution"
              placeholder="PT Maju Jaya / Universitas Brawijaya"
              defaultValue={initial.institution ?? ''}
              error={state.fieldErrors?.institution?.[0]}
            />
            <Input
              label="Jenis Kendaraan"
              name="vehicleType"
              placeholder="Motor Honda Beat"
              defaultValue={initial.vehicleType ?? ''}
              error={state.fieldErrors?.vehicleType?.[0]}
            />
            <Input
              label="Plat Nomor"
              name="vehiclePlate"
              defaultValue={initial.vehiclePlate ?? ''}
              error={state.fieldErrors?.vehiclePlate?.[0]}
            />
          </FormGrid>
        </FormCard>

        <FormCard
          title="Kontak Darurat"
          description="Nomor yang dihubungi kalau penyewa sakit, hilang kontak, atau menunggak."
        >
          <FormGrid>
            <Input
              label="Nama Kontak Darurat"
              name="emergencyName"
              defaultValue={initial.emergencyName ?? ''}
              error={state.fieldErrors?.emergencyName?.[0]}
            />
            <Input
              label="Hubungan"
              name="emergencyRelation"
              placeholder="Orang tua / Saudara / Suami"
              defaultValue={initial.emergencyRelation ?? ''}
              error={state.fieldErrors?.emergencyRelation?.[0]}
            />
            <Input
              label="Nomor HP Kontak Darurat"
              name="emergencyPhone"
              defaultValue={initial.emergencyPhone ?? ''}
              error={state.fieldErrors?.emergencyPhone?.[0]}
            />
          </FormGrid>
        </FormCard>

        <FormError message={state.error} />

        <FormStickyBar secondary="Perubahan berlaku untuk seluruh kontrak penyewa ini.">
          <Button type="submit" isLoading={isPending}>
            {submitLabel}
          </Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
