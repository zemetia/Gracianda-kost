import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { IconPicker } from './IconPicker';

const meta = {
  title: 'UI/IconPicker',
  component: IconPicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof IconPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    name: 'icon',
    label: 'Icon',
    value: '',
    onValueChange: () => {},
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <IconPicker {...args} value={value} onValueChange={setValue} />;
  },
};

export const Selected: Story = {
  args: {
    name: 'icon',
    label: 'Icon',
    value: 'snowflake',
    onValueChange: () => {},
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <IconPicker {...args} value={value} onValueChange={setValue} />;
  },
};

export const WithError: Story = {
  args: {
    name: 'icon',
    label: 'Icon',
    value: '',
    onValueChange: () => {},
    error: 'Icon tidak dikenal.',
  },
};
