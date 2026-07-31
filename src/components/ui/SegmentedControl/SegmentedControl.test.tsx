import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'existing', label: 'Penyewa Lama' },
  { value: 'new', label: 'Penyewa Baru' },
];

describe('SegmentedControl', () => {
  it('marks the current value as checked', () => {
    render(
      <SegmentedControl
        label="Jenis Penyewa"
        options={OPTIONS}
        value="existing"
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Penyewa Lama')).toBeChecked();
    expect(screen.getByLabelText('Penyewa Baru')).not.toBeChecked();
  });

  it('reports the new value when another segment is chosen', async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        label="Jenis Penyewa"
        options={OPTIONS}
        value="existing"
        onValueChange={onValueChange}
      />,
    );

    await userEvent.click(screen.getByLabelText('Penyewa Baru'));
    expect(onValueChange).toHaveBeenCalledWith('new');
  });

  it('submits under the given name when one is provided', () => {
    render(
      <SegmentedControl
        name="tenantMode"
        label="Jenis Penyewa"
        options={OPTIONS}
        value="new"
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Penyewa Baru')).toHaveAttribute('name', 'tenantMode');
  });
});
