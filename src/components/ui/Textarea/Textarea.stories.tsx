import type { Meta, StoryObj } from '@storybook/nextjs';

import { Textarea } from './Textarea';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Deskripsi', placeholder: 'Kamar sudut, kena matahari pagi…' },
};

export const WithHint: Story = {
  args: { label: 'Catatan', hint: 'Terlihat oleh admin lain, bukan penyewa.' },
};

export const WithError: Story = {
  args: { label: 'Deskripsi', error: 'Deskripsi maksimal 500 karakter' },
};
