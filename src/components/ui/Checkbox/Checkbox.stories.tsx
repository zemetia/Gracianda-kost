import type { Meta, StoryObj } from '@storybook/nextjs';

import { Checkbox } from './Checkbox';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Aktif' },
};

export const WithHint: Story = {
  args: { label: 'Aktif', hint: 'Kamar ini tampil di website publik.' },
};

export const Disabled: Story = {
  args: { label: 'Aktif', disabled: true },
};

export const Group: Story = {
  args: { label: '' },
  render: () => (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      <Checkbox name="facilityIds" value="1" label="AC" />
      <Checkbox name="facilityIds" value="2" label="Kamar Mandi Dalam" />
      <Checkbox name="facilityIds" value="3" label="WiFi" />
    </div>
  ),
};
