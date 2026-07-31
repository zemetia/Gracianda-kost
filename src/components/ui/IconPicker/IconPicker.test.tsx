import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { IconPicker } from './IconPicker';

describe('IconPicker', () => {
  it('carries the value in a hidden input', () => {
    const { container } = render(
      <IconPicker name="icon" label="Icon" value="snowflake" onValueChange={() => {}} />,
    );
    expect(container.querySelector('input[type="hidden"][name="icon"]')).toHaveValue('snowflake');
  });

  it('shows common icons by default when opened', async () => {
    render(<IconPicker name="icon" label="Icon" value="" onValueChange={() => {}} />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'wifi' })).toBeInTheDocument();
  });

  it('searches the full icon catalog once the admin types', async () => {
    render(<IconPicker name="icon" label="Icon" value="" onValueChange={() => {}} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByPlaceholderText('Cari icon…'), 'wardrobe');
    expect(screen.queryByRole('option', { name: 'wifi' })).not.toBeInTheDocument();
  });

  it('commits a value on click and closes the popover', async () => {
    const onValueChange = vi.fn();
    render(<IconPicker name="icon" label="Icon" value="" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'wifi' }));
    expect(onValueChange).toHaveBeenCalledWith('wifi');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('clears the selection through the X button without opening the picker', async () => {
    const onValueChange = vi.fn();
    render(<IconPicker name="icon" label="Icon" value="snowflake" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByLabelText('Hapus icon'));
    expect(onValueChange).toHaveBeenCalledWith('');
  });
});
