import type { Meta, StoryObj } from '@storybook/nextjs';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { ChipGroup, ChipToggle } from '../Chip';
import { CurrencyInput } from '../CurrencyInput';
import { DatePicker } from '../DatePicker';
import { Input } from '../Input';
import { Select } from '../Select';
import { Textarea } from '../Textarea';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from './Form';

const meta = {
  title: 'UI/Form',
  component: FormCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FormCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminForm: Story = {
  args: { title: '' },
  render: () => (
    <form className="max-w-5xl">
      <FormLayout>
        <FormCard title="Identitas Unit" description="Nomor dan lokasi kamar di dalam properti.">
          <FormGrid>
            <Input label="Nomor / Nama Unit" required />
            <Select
              label="Lantai"
              placeholder="Tanpa Lantai"
              allowEmpty
              options={[
                { value: '1', label: 'Lantai 1' },
                { value: '2', label: 'Lantai 2' },
              ]}
            />
          </FormGrid>
        </FormCard>

        <FormCard title="Harga Sewa" description="Harga bulanan wajib; siklus lain opsional.">
          <FormGrid columns={3}>
            <CurrencyInput label="Harga / Bulan" defaultValue={1500000} required />
            <CurrencyInput label="Harian" />
            <CurrencyInput label="Tahunan" />
          </FormGrid>
        </FormCard>

        <FormCard title="Masa Sewa" description="Tanggal keluar dihitung dari durasi.">
          <FormGrid>
            <DatePicker label="Tanggal Masuk" defaultValue="2026-07-31" required />
            <DatePicker label="Tanggal Keluar" hint="Terisi otomatis, masih bisa diubah." />
          </FormGrid>
        </FormCard>

        <FormCard title="Detail & Fasilitas" description="Muncul di halaman publik kamar.">
          <Textarea label="Deskripsi" />
          <ChipGroup label="Fasilitas Kamar">
            <ChipToggle name="facilityIds" value="1" label="AC" defaultChecked />
            <ChipToggle name="facilityIds" value="2" label="WiFi" />
            <ChipToggle name="facilityIds" value="3" label="Kamar Mandi Dalam" defaultChecked />
          </ChipGroup>
          <Checkbox label="Aktif" hint="Tampil di website publik." defaultChecked />
        </FormCard>

        <FormError message="Nomor unit sudah dipakai di properti ini." />

        <FormStickyBar secondary="Perubahan langsung terlihat di halaman publik.">
          <Button variant="outline" type="button">
            Batal
          </Button>
          <Button type="submit">Simpan Kamar</Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  ),
};
