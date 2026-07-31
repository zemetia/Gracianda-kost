import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { Combobox } from './Combobox';

const meta = {
  title: 'UI/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const TENANTS = [
  { value: 't1', label: 'Budi Santoso', hint: 'KTP 3201234567890001 · 081234567890' },
  { value: 't2', label: 'Ani Rahayu', hint: 'KTP 3201234567890002 · 081234567891' },
  { value: 't3', label: 'Citra Dewi', hint: 'KTP 3201234567890003 · 081234567892', flag: 'Blacklist' },
];

export const Default: Story = {
  args: {
    name: 'tenantId',
    label: 'Pilih Penyewa',
    placeholder: 'Ketik nama, KTP, atau nomor HP',
    options: TENANTS,
    value: '',
    onValueChange: () => {},
    required: true,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <Combobox {...args} value={value} onValueChange={setValue} />;
  },
};

export const Selected: Story = {
  args: {
    name: 'tenantId',
    label: 'Pilih Penyewa',
    options: TENANTS,
    value: 't1',
    onValueChange: () => {},
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <Combobox {...args} value={value} onValueChange={setValue} />;
  },
};

export const WithError: Story = {
  args: {
    name: 'tenantId',
    label: 'Pilih Penyewa',
    options: TENANTS,
    value: '',
    onValueChange: () => {},
    error: 'Penyewa wajib dipilih.',
  },
};
