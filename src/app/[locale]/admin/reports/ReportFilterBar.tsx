import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

import { PrintButton } from './PrintButton';

interface Floor {
  id: string;
  name: string;
}

interface ReportFilterBarProps {
  floors: Floor[];
  from?: string;
  to?: string;
  floorId?: string;
  extra?: ReactNode;
}

export function ReportFilterBar({ floors, from, to, floorId, extra }: ReportFilterBarProps) {
  return (
    <Card className="print:hidden">
      <CardContent>
        <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input label="Dari Tanggal" name="from" type="date" defaultValue={from} />
          <Input label="Sampai Tanggal" name="to" type="date" defaultValue={to} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="floorId" className="text-sm font-medium text-foreground">
              Lantai
            </label>
            <select
              id="floorId"
              name="floorId"
              defaultValue={floorId ?? ''}
              className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Semua</option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))}
            </select>
          </div>
          {extra}
          <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
            <Button type="submit" variant="secondary">
              Terapkan Filter
            </Button>
            <PrintButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
