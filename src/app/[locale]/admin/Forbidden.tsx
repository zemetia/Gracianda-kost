import { ShieldOff } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';

export function Forbidden() {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <ShieldOff className="h-10 w-10 text-destructive" aria-hidden="true" />
        <Typography variant="h3">403 — Akses Ditolak</Typography>
        <Typography variant="muted">
          Role akun kamu tidak punya akses ke halaman ini. Hubungi Super Admin kalau ini keliru.
        </Typography>
        <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
          Kembali ke Dashboard
        </Link>
      </CardContent>
    </Card>
  );
}
