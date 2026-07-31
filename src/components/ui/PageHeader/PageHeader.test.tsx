import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PageHeader } from './PageHeader';

// next-intl's navigation module pulls in next/navigation, which does not resolve
// under jsdom — the routing behaviour is next-intl's concern, not this component's.
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('PageHeader', () => {
  it('renders the title as the page heading', () => {
    render(<PageHeader title="Tambah Kamar/Unit" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tambah Kamar/Unit');
  });

  it('renders a back link only when a destination is given', () => {
    const { rerender } = render(<PageHeader title="Tambah Kamar/Unit" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    rerender(
      <PageHeader
        title="Tambah Kamar/Unit"
        backHref="/admin/master-data/rooms"
        backLabel="Daftar Kamar"
      />,
    );
    expect(screen.getByRole('link', { name: /Daftar Kamar/ })).toBeInTheDocument();
  });

  it('renders the description and the action slot', () => {
    render(
      <PageHeader
        title="Kamar"
        description="Gracianda House"
        action={<button type="button">Tambah</button>}
      />,
    );
    expect(screen.getByText('Gracianda House')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tambah' })).toBeInTheDocument();
  });
});
