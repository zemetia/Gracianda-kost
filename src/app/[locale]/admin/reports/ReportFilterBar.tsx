import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';

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
    <Card noPadding className="print:hidden">
      <CardContent className="p-4">
        <form
          method="get"
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4 lg:max-w-3xl lg:grid-cols-4">
            <DatePicker label="Dari Tanggal" name="from" size="sm" defaultValue={from} />
            <DatePicker label="Sampai Tanggal" name="to" size="sm" defaultValue={to} />
            <Select
              name="floorId"
              label="Lantai"
              size="sm"
              placeholder="Semua"
              allowEmpty
              defaultValue={floorId ?? ''}
              options={floors.map((floor) => ({ value: floor.id, label: floor.name }))}
            />
            {extra}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button type="submit" size="sm" variant="secondary">
              Terapkan Filter
            </Button>
            <PrintButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
