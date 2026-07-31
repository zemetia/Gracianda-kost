import type { Meta, StoryObj } from '@storybook/nextjs';

import { CurrencyInput } from './CurrencyInput';

const meta = {
  title: 'UI/CurrencyInput',
  component: CurrencyInput,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CurrencyInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { name: 'price', label: 'Harga Sewa / Bulan', defaultValue: 1500000, required: true },
};

export const Empty: Story = {
  args: { name: 'deposit', label: 'Deposit', hint: 'Kosongkan bila tidak ada deposit.' },
};

export const WithError: Story = {
  args: { name: 'price', label: 'Harga Sewa', error: 'Harga wajib diisi.' },
};

export const Disabled: Story = {
  args: { name: 'price', label: 'Harga Sewa', defaultValue: 850000, disabled: true },
};
