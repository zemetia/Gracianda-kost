import type { Meta, StoryObj } from '@storybook/nextjs';

import { DeltaPill, MetricBlock, MetricInline, MetricRow, MetricSkeleton } from './Metric';

const meta = {
  title: 'UI/Metric',
  component: MetricBlock,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MetricBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Block: Story = {
  args: {
    label: 'Pendapatan Bulan Ini',
    value: '12.400.000',
    prefix: 'Rp',
    delta: 4.2,
    period: 'vs bulan lalu',
  },
};

export const Hero: Story = {
  args: {
    label: 'Total Tunggakan',
    value: '3.850.000',
    prefix: 'Rp',
    size: 'hero',
    delta: -12.4,
    goodWhen: 'down',
    period: 'vs bulan lalu',
    meta: 'Per 28 Jul 2026, 14:05',
  },
};

export const Linked: Story = {
  args: {
    label: 'Kamar Kosong',
    value: '7',
    href: '/admin/master-data/rooms?occupancy=available',
  },
};

export const HighlightRow: Story = {
  args: { label: '', value: '' },
  render: () => (
    <MetricRow columns={4}>
      <MetricBlock label="Total Pendapatan" value="12.400.000" prefix="Rp" delta={4.2} period="vs periode lalu" />
      <MetricBlock label="Biaya Maintenance" value="1.150.000" prefix="Rp" delta={-3.1} goodWhen="down" period="vs periode lalu" />
      <MetricBlock label="Profit" value="11.250.000" prefix="Rp" delta={7.5} period="vs periode lalu" />
      <MetricBlock label="Okupansi" value="86,4" suffix="%" delta={1.8} period="vs periode lalu" />
    </MetricRow>
  ),
};

export const Deltas: Story = {
  args: { label: '', value: '' },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <DeltaPill value={4.2} />
      <DeltaPill value={-3.1} />
      <DeltaPill value={-3.1} goodWhen="down" />
      <DeltaPill value={0} />
      <DeltaPill value={null} />
    </div>
  ),
};

export const Inline: Story = {
  args: { label: '', value: '' },
  render: () => (
    <div className="max-w-sm">
      <MetricInline label="Sewa per bulan" value="Rp 1.250.000" />
      <MetricInline label="Deposit" value="Rp 500.000" />
      <MetricInline label="Tunggakan" value="—" />
    </div>
  ),
};

export const Loading: Story = {
  args: { label: '', value: '' },
  render: () => (
    <MetricRow columns={3}>
      <MetricSkeleton />
      <MetricSkeleton />
      <MetricSkeleton />
    </MetricRow>
  ),
};
