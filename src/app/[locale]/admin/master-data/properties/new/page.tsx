import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { createPropertyAction } from '../actions';
import { PropertyForm } from '../PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h2" className="mb-1">
          Tambah Properti
        </Typography>
        <Typography variant="muted">Daftarkan gedung kost atau rumah penyewaan baru.</Typography>
      </div>

      <Card>
        <CardContent className="pt-6">
          <PropertyForm action={createPropertyAction} submitLabel="Simpan Properti" />
        </CardContent>
      </Card>
    </div>
  );
}
