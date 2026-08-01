import type { Meta, StoryObj } from '@storybook/nextjs';

import { Money } from './Money';

const meta = {
  title: 'UI/Money',
  component: Money,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { value: 12_400_000 },
} satisfies Meta<typeof Money>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Money value={12_400_000} size="hero" />
      <Money value={12_400_000} size="primary" />
      <Money value={12_400_000} size="secondary" />
      <Money value={12_400_000} size="total" />
      <Money value={12_400_000} size="inline" />
      <Money value={12_400_000} size="meta" />
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Money value={4_250_000} size="secondary" tone="primary" />
      <Money value={-1_150_000} size="secondary" tone="destructive" />
      <Money value={0} size="secondary" />
      <Money value={null} size="secondary" />
    </div>
  ),
};

export const Signed: Story = {
  args: { value: 2_150_000, signed: true, size: 'total', tone: 'success' },
};

export const Short: Story = {
  args: { value: 12_400_000, short: true, size: 'hero' },
};

export const TableColumn: Story = {
  render: () => (
    <table className="w-full max-w-md">
      <tbody>
        {[850_000, 1_250_000, 12_400_000, 0].map((amount) => (
          <tr key={amount} className="border-b border-border">
            <td className="py-2 text-sm text-foreground-muted">Kamar A-{amount % 97}</td>
            <td className="py-2 text-right">
              <Money value={amount} />
            </td>
          </tr>
        ))}
        <tr>
          <td className="py-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Total
          </td>
          <td className="py-2 text-right">
            <Money value={14_500_000} size="total" />
          </td>
        </tr>
      </tbody>
    </table>
  ),
};
