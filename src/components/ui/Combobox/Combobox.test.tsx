import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Combobox } from './Combobox';

const TENANTS = [
  { value: 't1', label: 'Budi Santoso', hint: 'KTP 3201… · 0812…' },
  { value: 't2', label: 'Ani Rahayu', hint: 'KTP 3202… · 0813…' },
  { value: 't3', label: 'Citra Dewi', hint: 'KTP 3203… · 0814…', flag: 'Blacklist' },
];

function setup(value = '', onValueChange = vi.fn()) {
  render(
    <Combobox
      name="tenantId"
      label="Pilih Penyewa"
      options={TENANTS}
      value={value}
      onValueChange={onValueChange}
    />,
  );
  return onValueChange;
}

describe('Combobox', () => {
  it('carries the value in a hidden input', () => {
    const { container } = render(
      <Combobox
        name="tenantId"
        label="Pilih Penyewa"
        options={TENANTS}
        value="t2"
        onValueChange={() => {}}
      />,
    );
    expect(container.querySelector('input[type="hidden"][name="tenantId"]')).toHaveValue('t2');
  });

  it('filters on both label and hint', async () => {
    setup();
    await userEvent.type(screen.getByRole('combobox'), 'ani');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveTextContent('Ani Rahayu');
  });

  it('selects a match with the keyboard without submitting the form', async () => {
    const onValueChange = setup();
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'citra');
    await userEvent.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('t3');
  });

  it('surfaces a flag on the option that has one', async () => {
    setup();
    await userEvent.type(screen.getByRole('combobox'), 'citra');
    expect(screen.getByText('Blacklist')).toBeInTheDocument();
  });

  it('shows the empty text when nothing matches', async () => {
    setup();
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByText('Tidak ada hasil.')).toBeInTheDocument();
  });

  it('clears the selection through the Ganti button', async () => {
    const onValueChange = vi.fn();
    render(
      <Combobox
        name="tenantId"
        label="Pilih Penyewa"
        options={TENANTS}
        value="t1"
        onValueChange={onValueChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Ganti/ }));
    expect(onValueChange).toHaveBeenCalledWith('');
  });
});
