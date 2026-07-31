import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from './Table';

describe('Table', () => {
  it('renders headers and rows', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Kamar 101</TableCell>
            <TableCell>Tersedia</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole('columnheader', { name: 'Nama' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Kamar 101' })).toBeInTheDocument();
  });

  it('renders an empty state spanning every column', () => {
    render(
      <Table>
        <TableBody>
          <TableEmpty colSpan={2}>Tidak ada data.</TableEmpty>
        </TableBody>
      </Table>,
    );

    const cell = screen.getByRole('cell', { name: 'Tidak ada data.' });
    expect(cell).toHaveAttribute('colspan', '2');
  });
});
