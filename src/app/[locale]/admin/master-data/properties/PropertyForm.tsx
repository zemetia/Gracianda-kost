'use client';

import { MapPin } from 'lucide-react';
import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ChipGroup, ChipToggle } from '@/components/ui/Chip';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { formatPropertyAddress } from '@/lib/utils';

import type { PropertyFormState } from './actions';

interface Facility {
  id: string;
  name: string;
}

type GenderPolicy = 'PUTRA' | 'PUTRI' | 'CAMPUR';

type LocationFields = Record<'address' | 'district' | 'city' | 'province' | 'postalCode', string>;

/** Realistic curfew window, half-hour steps — 18:00 through 04:00. */
const CURFEW_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const minutes = (18 * 60 + index * 30) % (24 * 60);
  const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  return { value, label: value };
});

interface PropertyFormProps {
  action: (prevState: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;
  facilities: Facility[];
  initial?: {
    name: string;
    code: string;
    type: 'KOST' | 'HOUSE' | 'APARTMENT' | 'VILLA' | 'OTHER';
    description: string | null;
    address: string | null;
    district: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
    mapsUrl: string | null;
    contactName: string | null;
    contactPhone: string | null;
    whatsappNumber: string | null;
    contactEmail: string | null;
    genderPolicy: GenderPolicy;
    curfewTime: string | null;
    rules: string | null;
    isActive: boolean;
    facilityIds: string[];
  };
  submitLabel: string;
}

const initialState: PropertyFormState = {};

export function PropertyForm({ action, facilities, initial, submitLabel }: PropertyFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy>(initial?.genderPolicy ?? 'CAMPUR');
  // Held in state only so the admin can see the assembled address while typing
  // — the same formatPropertyAddress() the list and public page use.
  const [location, setLocation] = useState<LocationFields>({
    address: initial?.address ?? '',
    district: initial?.district ?? '',
    city: initial?.city ?? '',
    province: initial?.province ?? '',
    postalCode: initial?.postalCode ?? '',
  });

  const setLocationField = (field: keyof LocationFields, value: string) =>
    setLocation((prev) => ({ ...prev, [field]: value }));

  const addressPreview = formatPropertyAddress(location);

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

          <Textarea
            name="description"
            label="Deskripsi"
            hint="Ditampilkan di halaman publik properti."
            defaultValue={initial?.description ?? undefined}
            error={state.fieldErrors?.description?.[0]}
          />
        </FormCard>

        <FormCard
          title="Lokasi"
          description="Alamat lengkap dipakai di halaman publik, kuitansi, dan link peta yang dikirim ke calon penyewa."
        >
          <Textarea
            name="address"
            label="Alamat Jalan"
            rows={2}
            placeholder="Jl. Melati No. 12, RT 03 / RW 05"
            hint="Nama jalan, nomor, dan RT/RW saja — kecamatan hingga kode pos diisi di bawah."
            value={location.address}
            onChange={(event) => setLocationField('address', event.target.value)}
            error={state.fieldErrors?.address?.[0]}
          />

          <FormGrid columns={2}>
            <Input
              label="Kecamatan"
              name="district"
              placeholder="Lowokwaru"
              value={location.district}
              onChange={(event) => setLocationField('district', event.target.value)}
              error={state.fieldErrors?.district?.[0]}
            />
            <Input
              label="Kota / Kabupaten"
              name="city"
              placeholder="Kota Malang"
              value={location.city}
              onChange={(event) => setLocationField('city', event.target.value)}
              error={state.fieldErrors?.city?.[0]}
            />
          </FormGrid>

          <FormGrid columns={2}>
            <Input
              label="Provinsi"
              name="province"
              placeholder="Jawa Timur"
              value={location.province}
              onChange={(event) => setLocationField('province', event.target.value)}
              error={state.fieldErrors?.province?.[0]}
            />
            <Input
              label="Kode Pos"
              name="postalCode"
              inputMode="numeric"
              placeholder="65141"
              inputClassName="tabular-nums"
              value={location.postalCode}
              onChange={(event) => setLocationField('postalCode', event.target.value)}
              error={state.fieldErrors?.postalCode?.[0]}
            />
          </FormGrid>

          <div className="border-border bg-surface-raised flex items-start gap-2.5 rounded-md border border-dashed p-3.5">
            <MapPin aria-hidden className="text-foreground-subtle mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-foreground-subtle text-xs font-medium tracking-wide uppercase">
                Tampil sebagai
              </p>
              <p className="text-foreground mt-1 text-sm leading-relaxed">
                {addressPreview ?? (
                  <span className="text-foreground-subtle italic">
                    Isi kolom di atas untuk melihat alamat lengkapnya.
                  </span>
                )}
              </p>
            </div>
          </div>

          <Input
            label="Link Google Maps"
            name="mapsUrl"
            type="url"
            placeholder="https://maps.app.goo.gl/..."
            hint="Tempel link bagikan dari Google Maps — dipakai tombol petunjuk arah."
            defaultValue={initial?.mapsUrl ?? undefined}
            error={state.fieldErrors?.mapsUrl?.[0]}
          />

          <FormGrid columns={2}>
            <Input
              label="Latitude"
              name="latitude"
              type="number"
              step="0.0000001"
              placeholder="-7.954722"
              inputClassName="text-right tabular-nums"
              defaultValue={initial?.latitude ?? undefined}
              error={state.fieldErrors?.latitude?.[0]}
            />
            <Input
              label="Longitude"
              name="longitude"
              type="number"
              step="0.0000001"
              placeholder="112.614167"
              inputClassName="text-right tabular-nums"
              defaultValue={initial?.longitude ?? undefined}
              error={state.fieldErrors?.longitude?.[0]}
            />
          </FormGrid>
        </FormCard>

        <FormCard
          title="Kontak Penanggung Jawab"
          description="Nomor yang dihubungi calon penyewa untuk properti ini — bisa berbeda dari kontak pusat."
        >
          <FormGrid columns={2}>
            <Input
              label="Nama Pengelola"
              name="contactName"
              placeholder="Ibu Sri"
              defaultValue={initial?.contactName ?? undefined}
              error={state.fieldErrors?.contactName?.[0]}
            />
            <Input
              label="Email"
              name="contactEmail"
              type="email"
              placeholder="admin@graciandahouse.com"
              defaultValue={initial?.contactEmail ?? undefined}
              error={state.fieldErrors?.contactEmail?.[0]}
            />
          </FormGrid>

          <FormGrid columns={2}>
            <Input
              label="Nomor Telepon"
              name="contactPhone"
              type="tel"
              placeholder="0341 123456"
              defaultValue={initial?.contactPhone ?? undefined}
              error={state.fieldErrors?.contactPhone?.[0]}
            />
            <Input
              label="Nomor WhatsApp"
              name="whatsappNumber"
              type="tel"
              placeholder="081234567890"
              hint="Dipakai tombol tanya kamar di halaman publik."
              defaultValue={initial?.whatsappNumber ?? undefined}
              error={state.fieldErrors?.whatsappNumber?.[0]}
            />
          </FormGrid>
        </FormCard>

        <FormCard
          title="Aturan & Ketentuan"
          description="Ditampilkan ke calon penyewa dan jadi rujukan saat ada pelanggaran."
        >
          <SegmentedControl
            name="genderPolicy"
            label="Peruntukan"
            value={genderPolicy}
            onValueChange={setGenderPolicy}
            error={state.fieldErrors?.genderPolicy?.[0]}
            options={[
              { value: 'PUTRA', label: 'Putra' },
              { value: 'PUTRI', label: 'Putri' },
              { value: 'CAMPUR', label: 'Campur' },
            ]}
          />

          <Select
            name="curfewTime"
            label="Jam Malam"
            placeholder="Tidak ada jam malam"
            allowEmpty
            className="sm:max-w-xs"
            hint="Batas jam gerbang dikunci."
            defaultValue={initial?.curfewTime ?? ''}
            options={CURFEW_OPTIONS}
            error={state.fieldErrors?.curfewTime?.[0]}
          />

          <Textarea
            name="rules"
            label="Peraturan Kost"
            rows={5}
            placeholder={'Tamu lawan jenis tidak boleh masuk kamar\nDilarang merokok di dalam kamar'}
            hint="Satu aturan per baris."
            defaultValue={initial?.rules ?? undefined}
            error={state.fieldErrors?.rules?.[0]}
          />
        </FormCard>

        <FormCard
          title="Fasilitas Umum"
          description="Fasilitas bersama yang berlaku untuk seluruh properti — parkir, wifi, keamanan, dsb."
        >
          {facilities.length > 0 ? (
            <ChipGroup>
              {facilities.map((facility) => (
                <ChipToggle
                  key={facility.id}
                  name="facilityIds"
                  value={facility.id}
                  label={facility.name}
                  defaultChecked={initial?.facilityIds.includes(facility.id) ?? false}
                />
              ))}
            </ChipGroup>
          ) : (
            <p className="text-sm text-foreground-muted">
              Belum ada fasilitas umum — tambahkan di menu Fasilitas.
            </p>
          )}
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
