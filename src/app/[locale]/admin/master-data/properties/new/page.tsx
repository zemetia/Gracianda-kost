import { PageHeader } from '@/components/ui/PageHeader';
import { facilityService } from '@/services/facility.service';

import { createPropertyAction } from '../actions';
import { PropertyForm } from '../PropertyForm';

export default async function NewPropertyPage() {
  const facilities = await facilityService.list();
  const commonFacilities = facilities.filter((facility) => facility.category === 'COMMON');

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Tambah Properti"
        description="Daftarkan gedung kost atau rumah penyewaan baru."
        backHref="/admin/master-data/properties"
        backLabel="Daftar Properti"
      />

      <PropertyForm
        action={createPropertyAction}
        facilities={commonFacilities}
        submitLabel="Simpan Properti"
      />
    </div>
  );
}
