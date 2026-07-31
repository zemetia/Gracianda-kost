'use client';

import { Button } from '@/components/ui/Button';

export function PrintButton() {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="print:hidden"
      onClick={() => window.print()}
    >
      Cetak
    </Button>
  );
}
