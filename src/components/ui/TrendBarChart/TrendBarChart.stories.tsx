import type { Meta, StoryObj } from '@storybook/nextjs';

import { TrendBarChart } from './TrendBarChart';

const DATA = [
  { key: '2026-4', label: 'Apr', value: 3_200_000, tooltip: 'Apr 2026: Rp 3.200.000' },
  { key: '2026-5', label: 'Mei', value: 4_100_000, tooltip: 'Mei 2026: Rp 4.100.000' },
  { key: '2026-6', label: 'Jun', value: 2_800_000, tooltip: 'Jun 2026: Rp 2.800.000' },
  { key: '2026-7', label: 'Jul', value: 5_300_000, tooltip: 'Jul 2026: Rp 5.300.000' },
  { key: '2026-8', label: 'Agu', value: 4_700_000, tooltip: 'Agu 2026: Rp 4.700.000' },
  { key: '2026-9', label: 'Sep', value: 6_100_000, tooltip: 'Sep 2026: Rp 6.100.000' },
];

const meta = {
  title: 'UI/TrendBarChart',
  component: TrendBarChart,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { ariaLabel: 'Grafik tren 6 bulan terakhir', data: DATA },
} satisfies Meta<typeof TrendBarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SinglePoint: Story = {
  args: { data: [{ label: 'Sep', value: 12, tooltip: 'Sep 2026: 12 orang' }] },
};

export const Empty: Story = {
  args: { data: [] },
};
