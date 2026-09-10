import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TrendBarChart } from './TrendBarChart';

describe('TrendBarChart', () => {
  const data = [
    { label: 'Jan', value: 10, tooltip: 'Jan: 10 orang' },
    { label: 'Feb', value: 20, tooltip: 'Feb: 20 orang' },
  ];

  it('renders an accessible chart with the given label', () => {
    render(<TrendBarChart data={data} ariaLabel="Grafik contoh" />);
    expect(screen.getByRole('img', { name: 'Grafik contoh' })).toBeInTheDocument();
  });

  it('renders one bar per data point', () => {
    const { container } = render(<TrendBarChart data={data} ariaLabel="Grafik contoh" />);
    expect(container.querySelectorAll('rect')).toHaveLength(data.length);
  });

  it('falls back to "label: value" when tooltip is omitted', () => {
    render(<TrendBarChart data={[{ label: 'Mar', value: 5 }]} ariaLabel="Grafik contoh" />);
    expect(screen.getByText('Mar: 5')).toBeInTheDocument();
  });

  it('renders a muted placeholder instead of a chart when there is no data', () => {
    render(<TrendBarChart data={[]} ariaLabel="Grafik kosong" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
