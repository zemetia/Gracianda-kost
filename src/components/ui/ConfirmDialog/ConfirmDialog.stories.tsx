import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';

import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

const meta = {
  title: 'UI/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  open: true,
  title: 'Hapus fasilitas AC?',
  description: 'Fasilitas ini akan dilepas dari semua kamar yang memakainya.',
  onConfirm: () => {},
  onCancel: () => {},
};

export const Destructive: Story = {
  args: baseArgs,
};

export const Primary: Story = {
  args: {
    ...baseArgs,
    tone: 'primary',
    title: 'Aktifkan kembali kamar ini?',
    description: 'Kamar akan tampil lagi di website publik.',
    confirmLabel: 'Aktifkan',
  },
};

export const Pending: Story = {
  args: { ...baseArgs, isPending: true },
};

function TriggeredDemo(args: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Hapus fasilitas
      </Button>
      <ConfirmDialog
        {...args}
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

export const Triggered: Story = {
  args: baseArgs,
  render: (args) => <TriggeredDemo {...args} />,
};
