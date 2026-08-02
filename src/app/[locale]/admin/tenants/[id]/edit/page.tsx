import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/ui/PageHeader';
import { tenantService } from '@/services/tenant.service';

import { updateTenantAction } from '../../actions';
import { TenantForm } from '../../TenantForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTenantPage({ params }: Props) {
  const { id } = await params;
  const tenant = await tenantService.getById(id);

  if (!tenant) notFound();

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Edit Penyewa"
        description={`Ubah data ${tenant.fullName}.`}
        backHref={`/admin/tenants/${id}`}
        backLabel="Detail Penyewa"
      />

      <TenantForm
        action={updateTenantAction.bind(null, id)}
        initial={{
          fullName: tenant.fullName,
          ktpNumber: tenant.ktpNumber,
          phone: tenant.phone,
          email: tenant.email,
          gender: tenant.gender,
          maritalStatus: tenant.maritalStatus,
          birthPlace: tenant.birthPlace,
          birthDate: tenant.birthDate,
          idAddress: tenant.idAddress,
          occupation: tenant.occupation,
          institution: tenant.institution,
          vehicleType: tenant.vehicleType,
          vehiclePlate: tenant.vehiclePlate,
          emergencyName: tenant.emergencyName,
          emergencyRelation: tenant.emergencyRelation,
          emergencyPhone: tenant.emergencyPhone,
        }}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
