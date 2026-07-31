import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { attachmentService } from '@/services/attachment.service';
import { expenseService } from '@/services/expense.service';

import {
  removeExpenseReceiptAction,
  updateExpenseAction,
  uploadExpenseReceiptAction,
} from '../actions';
import { ExpenseForm } from '../ExpenseForm';
import { MediaGallery } from '../../master-data/MediaGallery';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({ params }: Props) {
  const { id } = await params;
  const expense = await expenseService.getById(id);

  if (!expense) notFound();

  const attachments = await attachmentService.listFor('EXPENSE', id);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader
        title={`Pengeluaran — ${expense.property.name}`}
        description={`Dicatat oleh ${expense.createdBy.name ?? expense.createdBy.email}`}
        backHref="/admin/expenses"
        backLabel="Daftar Pengeluaran"
      />

      <ExpenseForm
        action={updateExpenseAction.bind(null, id)}
        propertyId={expense.propertyId}
        submitLabel="Simpan Perubahan"
        initial={{
          category: expense.category,
          date: expense.date.toISOString().slice(0, 10),
          amount: expense.amount.toNumber(),
          payee: expense.payee,
          note: expense.note,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Bukti Bayar</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaGallery
            entityId={id}
            attachments={attachments}
            onUpload={uploadExpenseReceiptAction}
            onRemove={removeExpenseReceiptAction}
            emptyLabel="Belum ada bukti bayar/struk."
          />
        </CardContent>
      </Card>
    </div>
  );
}
