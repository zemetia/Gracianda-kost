import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './Select';

const OPTIONS = [
  { value: 'DAILY', label: 'Harian' },
  { value: 'WEEKLY', label: 'Mingguan' },
  { value: 'MONTHLY', label: 'Bulanan' },
];

describe('Select', () => {
  it('shows the placeholder until something is chosen', () => {
    render(<Select label="Siklus" options={OPTIONS} placeholder="Pilih siklus" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Pilih siklus');
  });

  it('carries the value in a hidden input for the surrounding form', () => {
    const { container } = render(
      <Select name="billingCycle" label="Siklus" options={OPTIONS} defaultValue="WEEKLY" />,
    );
    expect(container.querySelector('input[type="hidden"][name="billingCycle"]')).toHaveValue(
      'WEEKLY',
    );
  });

  it('opens on click and selects an option', async () => {
    const onValueChange = vi.fn();
    render(<Select label="Siklus" options={OPTIONS} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Bulanan/ }));

    expect(onValueChange).toHaveBeenCalledWith('MONTHLY');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('is fully operable from the keyboard', async () => {
    const onValueChange = vi.fn();
    render(<Select label="Siklus" options={OPTIONS} onValueChange={onValueChange} />);

    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('WEEKLY');
  });

  it('closes on Escape without changing the value', async () => {
    const onValueChange = vi.fn();
    render(<Select label="Siklus" options={OPTIONS} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('jumps to an option by typing its first letters', async () => {
    const onValueChange = vi.fn();
    render(<Select label="Siklus" options={OPTIONS} onValueChange={onValueChange} />);

    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('bu{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('MONTHLY');
  });

  it('offers a blank row when clearing is allowed', async () => {
    render(<Select label="Lantai" options={OPTIONS} allowEmpty placeholder="Tanpa Lantai" />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length + 1);
  });
});
