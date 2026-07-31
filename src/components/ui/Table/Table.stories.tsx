import type { Meta, StoryObj } from '@storybook/nextjs';

import { Badge } from '@/components/ui/Badge';

import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from './Table';

const meta = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const ROOMS = [
  { number: '101', floor: 'Lantai 1', price: 'Rp 1.500.000', status: 'Tersedia' as const },
  { number: '102', floor: 'Lantai 1', price: 'Rp 1.500.000', status: 'Terisi' as const },
  { number: '201', floor: 'Lantai 2', price: 'Rp 1.750.000', status: 'Tersedia' as const },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nomor</TableHead>
          <TableHead>Lantai</TableHead>
          <TableHead className="text-right">Harga</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROOMS.map((room) => (
          <TableRow key={room.number}>
            <TableCell className="font-medium text-foreground">{room.number}</TableCell>
            <TableCell className="text-foreground-muted">{room.floor}</TableCell>
            <TableCell className="text-right tabular-nums">{room.price}</TableCell>
            <TableCell>
              <Badge variant={room.status === 'Tersedia' ? 'success' : 'destructive'}>{room.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nomor</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty colSpan={2}>Belum ada kamar terdaftar.</TableEmpty>
      </TableBody>
    </Table>
  ),
};
