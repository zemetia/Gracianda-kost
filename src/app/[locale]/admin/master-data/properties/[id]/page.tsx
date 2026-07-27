import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
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
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h2" className="mb-1">
          Edit Properti
        </Typography>
        <Typography variant="muted">Ubah data properti {property.name}.</Typography>
      </div>

      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
