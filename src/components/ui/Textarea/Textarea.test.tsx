import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('associates the label with the control', () => {
    render(<Textarea label="Deskripsi" />);
    expect(screen.getByLabelText('Deskripsi')).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('renders the error and marks the control invalid', () => {
    render(<Textarea label="Catatan" error="Terlalu panjang" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Terlalu panjang');
  });

  it('defaults to three rows', () => {
    render(<Textarea label="Catatan" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3');
  });
});
