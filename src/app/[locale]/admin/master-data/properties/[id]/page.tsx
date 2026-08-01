import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { facilityService } from '@/services/facility.service';
import { propertyService } from '@/services/property.service';
import { updatePropertyAction } from '../actions';
import { PropertyForm } from '../PropertyForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: Props) {
  const { id } = await params;
  const [property, facilities] = await Promise.all([
    propertyService.getById(id),
    facilityService.list(),
  ]);

  if (!property) notFound();

  const commonFacilities = facilities.filter((facility) => facility.category === 'COMMON');

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Edit Properti"
        description={`Ubah data properti ${property.name}.`}
        backHref="/admin/master-data/properties"
        backLabel="Daftar Properti"
      />

      <PropertyForm
        action={updatePropertyAction.bind(null, id)}
        facilities={commonFacilities}
        initial={{
          name: property.name,
          code: property.code,
          type: property.type as 'KOST' | 'HOUSE' | 'APARTMENT' | 'VILLA' | 'OTHER',
          description: property.description,
          address: property.address,
          district: property.district,
          city: property.city,
          province: property.province,
          postalCode: property.postalCode,
          latitude: property.latitude,
          longitude: property.longitude,
          mapsUrl: property.mapsUrl,
          contactName: property.contactName,
          contactPhone: property.contactPhone,
          whatsappNumber: property.whatsappNumber,
          contactEmail: property.contactEmail,
          genderPolicy: property.genderPolicy,
          curfewTime: property.curfewTime,
          rules: property.rules,
          isActive: property.isActive,
          facilityIds: property.facilities.map((f) => f.facilityId),
        }}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
