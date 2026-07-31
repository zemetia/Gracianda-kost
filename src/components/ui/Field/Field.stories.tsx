import type { Meta, StoryObj } from '@storybook/nextjs';

import { Field } from './Field';
import { fieldControlClass, fieldShellVariants } from './fieldStyles';

const meta = {
  title: 'UI/Field',
  component: Field,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

function Shell({ size }: { size: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={fieldShellVariants({ fieldSize: size })}>
      <input className={fieldControlClass} placeholder="Budi Santoso" />
    </div>
  );
}

export const Default: Story = {
  args: { label: 'Nama Lengkap', htmlFor: 'nama' },
  render: (args) => (
    <Field {...args}>
      <Shell size="md" />
    </Field>
  ),
};

export const WithHint: Story = {
  args: { label: 'Nama Lengkap', hint: 'Sesuai KTP.', required: true },
  render: (args) => (
    <Field {...args}>
      <Shell size="md" />
    </Field>
  ),
};

export const WithError: Story = {
  args: { label: 'Nama Lengkap', hint: 'Sesuai KTP.', error: 'Nama wajib diisi.' },
  render: (args) => (
    <Field {...args}>
      <div className={fieldShellVariants({ fieldState: 'error' })}>
        <input className={fieldControlClass} placeholder="Budi Santoso" />
      </div>
    </Field>
  ),
};

export const Sizes: Story = {
  args: { label: '' },
  render: () => (
    <div className="flex flex-col gap-4">
      <Field label="Small">
        <Shell size="sm" />
      </Field>
      <Field label="Medium (default)">
        <Shell size="md" />
      </Field>
      <Field label="Large">
        <Shell size="lg" />
      </Field>
    </div>
  ),
};
