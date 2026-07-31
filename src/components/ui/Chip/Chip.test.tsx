import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChipGroup, ChipToggle } from './Chip';

describe('ChipToggle', () => {
  it('submits under the group name and its own value', () => {
    render(<ChipToggle name="facilityIds" value="ac-1" label="AC" />);
    const input = screen.getByLabelText('AC');
    expect(input).toHaveAttribute('name', 'facilityIds');
    expect(input).toHaveAttribute('value', 'ac-1');
  });

  it('reports toggling', async () => {
    const onCheckedChange = vi.fn();
    render(
      <ChipToggle name="facilityIds" value="ac-1" label="AC" onCheckedChange={onCheckedChange} />,
    );

    await userEvent.click(screen.getByLabelText('AC'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('honours defaultChecked', () => {
    render(<ChipToggle name="facilityIds" value="ac-1" label="AC" defaultChecked />);
    expect(screen.getByLabelText('AC')).toBeChecked();
  });
});

describe('ChipGroup', () => {
  it('labels the whole set once', () => {
    render(
      <ChipGroup label="Fasilitas Kamar">
        <ChipToggle name="facilityIds" value="1" label="AC" />
        <ChipToggle name="facilityIds" value="2" label="WiFi" />
      </ChipGroup>,
    );
    expect(screen.getByText('Fasilitas Kamar')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });
});
