import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Money } from './Money';

describe('Money', () => {
  it('formats id-ID and keeps the unit out of the number', () => {
    const { container } = render(<Money value={12_400_000} />);
    expect(screen.getByText('12.400.000')).toBeInTheDocument();
    expect(screen.getByText('Rp')).toHaveClass('text-foreground-muted');
    expect(container.firstElementChild).toHaveClass('tabular-nums');
  });

  it('rounds to whole rupiah', () => {
    render(<Money value={1_499.6} />);
    expect(screen.getByText('1.500')).toBeInTheDocument();
  });

  it('renders a negative as a leading minus on the unit, not on the digits', () => {
    render(<Money value={-850_000} />);
    expect(screen.getByText('-Rp')).toBeInTheDocument();
    expect(screen.getByText('850.000')).toBeInTheDocument();
  });

  it('marks positives when signed', () => {
    render(<Money value={2_000} signed />);
    expect(screen.getByText('+Rp')).toBeInTheDocument();
  });

  it('mutes zero but still renders it as a number', () => {
    const { container } = render(<Money value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('text-foreground-muted');
  });

  it('keeps zero at full weight when muteZero is false', () => {
    const { container } = render(<Money value={0} muteZero={false} />);
    expect(container.firstElementChild).toHaveClass('text-foreground');
  });

  it('renders an em dash for a missing value', () => {
    render(<Money value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('uses the compact form when short', () => {
    render(<Money value={12_400_000} short />);
    expect(screen.getByText('12,4 jt')).toBeInTheDocument();
  });

  it('bolds row-level money harder than metric-level money', () => {
    const { container: row } = render(<Money value={1} size="inline" />);
    const { container: metric } = render(<Money value={1} size="primary" />);
    expect(row.firstElementChild).toHaveClass('font-bold');
    expect(metric.firstElementChild).toHaveClass('font-semibold');
  });
});
