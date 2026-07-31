import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DeltaPill, MetricBlock, MetricValue } from './Metric';

// next-intl's navigation module pulls in next/navigation, which does not resolve
// under jsdom — the routing behaviour is next-intl's concern, not this component's.
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('DeltaPill', () => {
  it('renders success tone when an "up is good" metric rises', () => {
    const { container } = render(<DeltaPill value={4.2} />);
    expect(screen.getByText('4,2%')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('text-success');
  });

  it('treats a drop as an improvement when goodWhen is "down"', () => {
    const { container } = render(<DeltaPill value={-3.1} goodWhen="down" />);
    expect(container.firstElementChild).toHaveClass('text-success');
  });

  it('treats a rise as deterioration when goodWhen is "down"', () => {
    const { container } = render(<DeltaPill value={3.1} goodWhen="down" />);
    expect(container.firstElementChild).toHaveClass('text-destructive');
  });

  it('renders flat rather than tinted below the noise floor', () => {
    const { container } = render(<DeltaPill value={0} />);
    expect(screen.getByText('0,0%')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('text-foreground-muted');
  });

  it('renders an em dash when there is no baseline', () => {
    render(<DeltaPill value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('never renders NaN or Infinity', () => {
    const { rerender } = render(<DeltaPill value={Number.NaN} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    rerender(<DeltaPill value={Number.POSITIVE_INFINITY} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('MetricValue', () => {
  it('keeps numerals tabular', () => {
    const { container } = render(<MetricValue>12.400.000</MetricValue>);
    expect(container.firstElementChild).toHaveClass('tabular-nums');
  });

  it('renders the currency prefix smaller and muted', () => {
    render(<MetricValue prefix="Rp">12.400.000</MetricValue>);
    expect(screen.getByText('Rp')).toHaveClass('text-foreground-muted');
  });
});

describe('MetricBlock', () => {
  it('renders label, value and inline period without a container box', () => {
    const { container } = render(
      <MetricBlock label="Pendapatan" value="Rp 12.400.000" delta={4.2} period="vs bulan lalu" />,
    );
    expect(screen.getByText('Pendapatan')).toBeInTheDocument();
    expect(screen.getByText('vs bulan lalu')).toBeInTheDocument();
    expect(container.firstElementChild?.className).not.toMatch(/border|shadow|bg-/);
  });

  it('makes the whole block the hit target when href is given', () => {
    render(<MetricBlock label="Kamar Kosong" value="7" href="/admin/master-data/rooms" />);
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('Kamar Kosong');
    expect(link).toHaveTextContent('7');
  });
});
