import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CurrencyInput, formatRupiahInput, parseRupiah } from './CurrencyInput';

describe('parseRupiah', () => {
  it('strips grouping separators', () => {
    expect(parseRupiah('1.500.000')).toBe(1500000);
  });

  it('treats a value with no digits as empty rather than zero', () => {
    expect(parseRupiah('')).toBe('');
    expect(parseRupiah('Rp')).toBe('');
  });

  it('keeps an explicit zero', () => {
    expect(parseRupiah('0')).toBe(0);
  });
});

describe('formatRupiahInput', () => {
  it('groups thousands the Indonesian way', () => {
    expect(formatRupiahInput(1500000)).toBe('1.500.000');
  });

  it('renders empty as empty', () => {
    expect(formatRupiahInput('')).toBe('');
  });
});

describe('CurrencyInput', () => {
  it('shows the grouped value while submitting the raw integer', () => {
    const { container } = render(
      <CurrencyInput name="price" label="Harga Sewa" defaultValue={1500000} />,
    );

    expect(screen.getByLabelText('Harga Sewa')).toHaveValue('1.500.000');
    expect(container.querySelector('input[type="hidden"][name="price"]')).toHaveValue('1500000');
  });

  it('regroups as the user types', async () => {
    render(<CurrencyInput name="price" label="Harga Sewa" />);
    const input = screen.getByLabelText('Harga Sewa');

    await userEvent.type(input, '750000');
    expect(input).toHaveValue('750.000');
  });

  it('reports the parsed number, not the display text', async () => {
    const onValueChange = vi.fn();
    render(<CurrencyInput name="price" label="Harga Sewa" onValueChange={onValueChange} />);

    await userEvent.type(screen.getByLabelText('Harga Sewa'), '12');
    expect(onValueChange).toHaveBeenLastCalledWith(12);
  });

  it('shows the error instead of the hint', () => {
    render(
      <CurrencyInput name="price" label="Harga Sewa" hint="Per bulan." error="Wajib diisi." />,
    );
    expect(screen.queryByText('Per bulan.')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Wajib diisi.');
  });
});
