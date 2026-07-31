import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('toggles when its label is clicked', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Aktif" onChange={onChange} />);
    await userEvent.click(screen.getByText('Aktif'));
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('renders the hint under the label', () => {
    render(<Checkbox label="Aktif" hint="Tampil di website publik" />);
    expect(screen.getByText('Tampil di website publik')).toBeInTheDocument();
  });

  it('does not toggle when disabled', async () => {
    render(<Checkbox label="Aktif" disabled />);
    await userEvent.click(screen.getByText('Aktif'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
