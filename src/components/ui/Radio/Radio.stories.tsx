import type { Meta, StoryObj } from '@storybook/nextjs';

import { RadioGroup } from './Radio';

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'tenantMode',
    label: 'Jenis Penyewa',
    defaultValue: 'existing',
    options: [
      { value: 'existing', label: 'Penyewa Lama' },
      { value: 'new', label: 'Penyewa Baru' },
    ],
  },
};

export const WithHints: Story = {
  args: {
    name: 'method',
    label: 'Metode Pembayaran',
    defaultValue: 'TRANSFER',
    options: [
      { value: 'CASH', label: 'Tunai', hint: 'Uang diterima langsung di lokasi.' },
      { value: 'TRANSFER', label: 'Transfer', hint: 'Perlu bukti transfer.' },
    ],
  },
};

export const Inline: Story = {
  args: {
    name: 'status',
    label: 'Status',
    inline: true,
    defaultValue: 'active',
    options: [
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Nonaktif' },
    ],
  },
};

export const WithError: Story = {
  args: {
    name: 'tenantMode',
    label: 'Jenis Penyewa',
    error: 'Pilih salah satu.',
    options: [
      { value: 'existing', label: 'Penyewa Lama' },
      { value: 'new', label: 'Penyewa Baru' },
    ],
  },
};
