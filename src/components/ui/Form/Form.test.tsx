import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormActions, FormCard, FormError, FormField, FormStickyBar } from './Form';

describe('FormCard', () => {
  it('renders its title as a legend with the fields inside', () => {
    render(
      <FormCard title="Identitas" description="Data dasar penyewa.">
        <input aria-label="Nama" />
      </FormCard>,
    );
    expect(screen.getByText('Identitas').tagName).toBe('LEGEND');
    expect(screen.getByText('Data dasar penyewa.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nama')).toBeInTheDocument();
  });

  it('drops the header when bare', () => {
    render(
      <FormCard title="Identitas" bare>
        <input aria-label="Nama" />
      </FormCard>,
    );
    expect(screen.queryByText('Identitas')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nama')).toBeInTheDocument();
  });
});

describe('FormField', () => {
  it('shows the error and drops the hint', () => {
    render(
      <FormField label="Lantai" hint="Opsional" error="Wajib dipilih">
        <input aria-label="Lantai control" />
      </FormField>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Wajib dipilih');
    expect(screen.queryByText('Opsional')).not.toBeInTheDocument();
  });
});

describe('FormError', () => {
  it('renders nothing without a message', () => {
    const { container } = render(<FormError />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces the failure once', () => {
    render(<FormError message="Gagal menyimpan" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Gagal menyimpan');
  });
});

describe('FormActions', () => {
  it('renders the secondary note alongside the actions', () => {
    render(
      <FormActions secondary="Tagihan pertama terbit otomatis.">
        <button type="submit">Simpan</button>
      </FormActions>,
    );
    expect(screen.getByText('Tagihan pertama terbit otomatis.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument();
  });
});

describe('FormStickyBar', () => {
  it('keeps the submit action reachable without scrolling', () => {
    render(
      <FormStickyBar secondary="Perubahan belum disimpan.">
        <button type="submit">Simpan Kamar</button>
      </FormStickyBar>,
    );
    expect(screen.getByText('Perubahan belum disimpan.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan Kamar' })).toBeInTheDocument();
  });
});
