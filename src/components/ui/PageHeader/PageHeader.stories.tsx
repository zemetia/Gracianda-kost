import type { Meta, StoryObj } from '@storybook/nextjs';

import { Button } from '../Button';
import { PageHeader } from './PageHeader';

const meta = {
  title: 'UI/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: 'Tambah Kamar/Unit', description: 'Gracianda House' },
};

export const WithBackLink: Story = {
  args: {
    title: 'Tambah Kamar/Unit',
    description: 'Gracianda House',
    backHref: '/admin/master-data/rooms',
    backLabel: 'Daftar Kamar',
  },
};

export const WithAction: Story = {
  args: {
    title: 'Kamar & Unit',
    description: 'Semua unit di properti aktif.',
    action: <Button size="sm">Tambah Kamar</Button>,
  },
};
