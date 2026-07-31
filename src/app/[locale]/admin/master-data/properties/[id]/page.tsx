import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { propertyService } from '@/services/property.service';
import { updatePropertyAction } from '../actions';
import { PropertyForm } from '../PropertyForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: Props) {
  const { id } = await params;
  const property = await propertyService.getById(id);

  if (!property) notFound();

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
        initial={{
          name: property.name,
          code: property.code,
          type: property.type as 'KOST' | 'HOUSE' | 'APARTMENT' | 'VILLA' | 'OTHER',
          address: property.address,
          description: property.description,
          isActive: property.isActive,
        }}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
