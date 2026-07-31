import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { SegmentedControl } from './SegmentedControl';

const meta = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Jenis Penyewa',
    value: 'existing',
    onValueChange: () => {},
    options: [
      { value: 'existing', label: 'Penyewa Lama' },
      { value: 'new', label: 'Penyewa Baru' },
    ],
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onValueChange={setValue} />;
  },
};

export const ThreeOptions: Story = {
  args: {
    label: 'Status Tagihan',
    hint: 'Menyaring daftar di bawah.',
    value: 'ALL',
    onValueChange: () => {},
    options: [
      { value: 'ALL', label: 'Semua' },
      { value: 'UNPAID', label: 'Belum Bayar' },
      { value: 'PAID', label: 'Lunas' },
    ],
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onValueChange={setValue} />;
  },
};
