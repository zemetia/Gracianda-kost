import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Field } from './Field';

describe('Field', () => {
  it('associates the label with the control it points at', () => {
    render(
      <Field label="Nama Lengkap" htmlFor="nama">
        <input id="nama" />
      </Field>,
    );
    expect(screen.getByLabelText('Nama Lengkap')).toBeInTheDocument();
  });

  it('marks required fields with an asterisk hidden from assistive tech', () => {
    render(
      <Field label="Nama" htmlFor="nama" required>
        <input id="nama" />
      </Field>,
    );
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the hint when there is no error', () => {
    render(
      <Field label="Harga" htmlFor="harga" hint="Tanpa titik atau koma.">
        <input id="harga" />
      </Field>,
    );
    expect(screen.getByText('Tanpa titik atau koma.')).toBeInTheDocument();
  });

  it('replaces the hint with the error and announces it', () => {
    render(
      <Field label="Harga" htmlFor="harga" hint="Tanpa titik atau koma." error="Wajib diisi.">
        <input id="harga" />
      </Field>,
    );
    expect(screen.queryByText('Tanpa titik atau koma.')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Wajib diisi.');
  });
});
