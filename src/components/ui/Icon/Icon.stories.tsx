import type { Meta, StoryObj } from '@storybook/nextjs';

import { Icon } from './Icon';

const meta = {
  title: 'UI/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { name: 'snowflake' },
};

export const Larger: Story = {
  args: { name: 'bed-double', className: 'h-6 w-6 text-primary' },
};

export const UnknownName: Story = {
  args: { name: 'wardrobe' },
};

export const Missing: Story = {
  args: { name: null },
};
