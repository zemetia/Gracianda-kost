import type { Meta, StoryObj } from '@storybook/nextjs';

import { Select } from './Select';

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const CYCLES = [
  { value: 'DAILY', label: 'Harian' },
  { value: 'WEEKLY', label: 'Mingguan' },
  { value: 'MONTHLY', label: 'Bulanan' },
  { value: 'YEARLY', label: 'Tahunan' },
];

export const Default: Story = {
  args: { name: 'billingCycle', label: 'Siklus Sewa', options: CYCLES, required: true },
};

export const WithHints: Story = {
  args: {
    name: 'priceId',
    label: 'Siklus Sewa / Tarif',
    options: [
      { value: '1', label: 'Bulanan', hint: 'Rp 1.500.000 / bulan' },
      { value: '2', label: '3 Bulanan', hint: 'Rp 4.200.000 / 3 bulan' },
      { value: '3', label: 'Tahunan', hint: 'Rp 15.000.000 / tahun' },
    ],
    defaultValue: '1',
  },
};

export const Clearable: Story = {
  args: {
    name: 'floorId',
    label: 'Lantai',
    placeholder: 'Tanpa Lantai',
    allowEmpty: true,
    options: [
      { value: 'f1', label: 'Lantai 1' },
      { value: 'f2', label: 'Lantai 2' },
    ],
  },
};

export const WithError: Story = {
  args: {
    name: 'billingCycle',
    label: 'Siklus Sewa',
    options: CYCLES,
    error: 'Siklus wajib dipilih.',
  },
};

export const Disabled: Story = {
  args: { name: 'billingCycle', label: 'Siklus Sewa', options: CYCLES, defaultValue: 'MONTHLY', disabled: true },
};
