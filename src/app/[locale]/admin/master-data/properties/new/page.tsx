import { PageHeader } from '@/components/ui/PageHeader';

import { createPropertyAction } from '../actions';
import { PropertyForm } from '../PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Tambah Properti"
        description="Daftarkan gedung kost atau rumah penyewaan baru."
        backHref="/admin/master-data/properties"
        backLabel="Daftar Properti"
      />

      <PropertyForm action={createPropertyAction} submitLabel="Simpan Properti" />
    </div>
  );
}
