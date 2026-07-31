import type { Meta, StoryObj } from '@storybook/nextjs';

import { DatePicker } from './DatePicker';

const meta = {
  title: 'UI/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { name: 'startDate', label: 'Tanggal Masuk', defaultValue: '2026-07-31', required: true },
};

export const Empty: Story = {
  args: { name: 'endDate', label: 'Tanggal Keluar', hint: 'Terisi otomatis dari durasi sewa.' },
};

export const WithMinimum: Story = {
  args: {
    name: 'endDate',
    label: 'Tanggal Keluar',
    defaultValue: '2026-08-31',
    min: '2026-07-31',
    hint: 'Tidak bisa lebih awal dari tanggal masuk.',
  },
};

export const WithError: Story = {
  args: { name: 'startDate', label: 'Tanggal Masuk', error: 'Tanggal masuk wajib diisi.' },
};
