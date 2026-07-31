import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Radio, RadioGroup } from './Radio';

const OPTIONS = [
  { value: 'existing', label: 'Penyewa Lama' },
  { value: 'new', label: 'Penyewa Baru' },
];

describe('Radio', () => {
  it('associates its label with the input', () => {
    render(<Radio name="mode" value="a" label="Penyewa Lama" />);
    expect(screen.getByLabelText('Penyewa Lama')).toBeInTheDocument();
  });
});

describe('RadioGroup', () => {
  it('renders one radio per option under a shared name', () => {
    render(<RadioGroup name="tenantMode" label="Jenis Penyewa" options={OPTIONS} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios.every((radio) => radio.getAttribute('name') === 'tenantMode')).toBe(true);
  });

  it('reports the chosen value', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        name="tenantMode"
        label="Jenis Penyewa"
        options={OPTIONS}
        defaultValue="existing"
        onValueChange={onValueChange}
      />,
    );

    await userEvent.click(screen.getByLabelText('Penyewa Baru'));
    expect(onValueChange).toHaveBeenCalledWith('new');
  });

  it('surfaces the error once for the whole group', () => {
    render(
      <RadioGroup
        name="tenantMode"
        label="Jenis Penyewa"
        options={OPTIONS}
        error="Pilih salah satu."
      />,
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
});
