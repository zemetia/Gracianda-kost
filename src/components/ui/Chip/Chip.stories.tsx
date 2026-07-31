import type { Meta, StoryObj } from '@storybook/nextjs';
import { BedDouble, Snowflake, Wifi } from 'lucide-react';

import { ChipGroup, ChipToggle } from './Chip';

const meta = {
  title: 'UI/Chip',
  component: ChipGroup,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChipGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Fasilitas Kamar',
    hint: 'Tampil di halaman publik kamar.',
    children: null,
  },
  render: (args) => (
    <ChipGroup {...args}>
      <ChipToggle name="facilityIds" value="1" label="AC" icon={<Snowflake className="size-4" />} defaultChecked />
      <ChipToggle name="facilityIds" value="2" label="WiFi" icon={<Wifi className="size-4" />} />
      <ChipToggle
        name="facilityIds"
        value="3"
        label="Kasur"
        icon={<BedDouble className="size-4" />}
        defaultChecked
      />
    </ChipGroup>
  ),
};

export const WithoutIcons: Story = {
  args: { label: 'Fasilitas Umum', children: null },
  render: (args) => (
    <ChipGroup {...args}>
      <ChipToggle name="facilityIds" value="4" label="Dapur Bersama" />
      <ChipToggle name="facilityIds" value="5" label="Parkir Motor" defaultChecked />
      <ChipToggle name="facilityIds" value="6" label="CCTV" />
    </ChipGroup>
  ),
};
