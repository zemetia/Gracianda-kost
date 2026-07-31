import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DatePicker, formatDisplayDate, fromISODate, toISODate } from './DatePicker';

describe('date helpers', () => {
  it('formats a local date without shifting the day across timezones', () => {
    expect(toISODate(new Date(2026, 6, 31))).toBe('2026-07-31');
  });

  it('parses an ISO date into local time', () => {
    const date = fromISODate('2026-07-31');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(31);
  });

  it('rejects a malformed date', () => {
    expect(fromISODate('31-07-2026')).toBeNull();
    expect(fromISODate('')).toBeNull();
  });

  it('displays dates the Indonesian way', () => {
    expect(formatDisplayDate('2026-07-31')).toMatch(/31 Jul.* 2026/);
  });
});

describe('DatePicker', () => {
  it('shows the placeholder until a date is chosen', () => {
    render(<DatePicker label="Tanggal Masuk" placeholder="Pilih tanggal" />);
    expect(screen.getByLabelText('Tanggal Masuk')).toHaveTextContent('Pilih tanggal');
  });

  it('submits the ISO value through a hidden input', () => {
    const { container } = render(
      <DatePicker name="startDate" label="Tanggal Masuk" defaultValue="2026-07-31" />,
    );
    expect(container.querySelector('input[type="hidden"][name="startDate"]')).toHaveValue(
      '2026-07-31',
    );
  });

  it('reports the ISO date when a day is picked', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        name="startDate"
        label="Tanggal Masuk"
        defaultValue="2026-07-15"
        onValueChange={onValueChange}
      />,
    );

    await userEvent.click(screen.getByLabelText('Tanggal Masuk'));
    await userEvent.click(screen.getByRole('button', { name: '20' }));

    expect(onValueChange).toHaveBeenCalledWith('2026-07-20');
  });

  it('disables days outside the allowed range', async () => {
    render(
      <DatePicker
        name="endDate"
        label="Tanggal Keluar"
        defaultValue="2026-07-15"
        min="2026-07-10"
      />,
    );

    await userEvent.click(screen.getByLabelText('Tanggal Keluar'));
    expect(screen.getByRole('button', { name: '5' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '12' })).toBeEnabled();
  });

  it('closes on Escape', async () => {
    render(<DatePicker label="Tanggal Masuk" defaultValue="2026-07-15" />);

    await userEvent.click(screen.getByLabelText('Tanggal Masuk'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
