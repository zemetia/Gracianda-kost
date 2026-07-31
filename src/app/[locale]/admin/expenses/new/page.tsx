import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/ui/PageHeader';
import { propertyService } from '@/services/property.service';
import { expenseService } from '@/services/expense.service';

import { createExpenseAction } from '../actions';
import { ExpenseForm, type ExpenseFormInitial } from '../ExpenseForm';

interface Props {
  searchParams: Promise<{ propertyId?: string; duplicateFrom?: string }>;
}

export default async function NewExpensePage({ searchParams }: Props) {
  const { propertyId, duplicateFrom } = await searchParams;

  if (!propertyId) notFound();

  const property = await propertyService.getById(propertyId);
  if (!property) notFound();

  // "Duplikat" prefills category/nominal/penerima/catatan from a previous
  // entry — tanggal sengaja tidak ikut, biar defaultnya hari ini.
  let initial: ExpenseFormInitial | undefined;
  if (duplicateFrom) {
    const source = await expenseService.getById(duplicateFrom);
    if (source) {
      initial = {
        category: source.category,
        amount: source.amount.toNumber(),
        payee: source.payee,
        note: source.note,
      };
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader
        title="Tambah Pengeluaran"
        description={property.name}
        backHref="/admin/expenses"
        backLabel="Daftar Pengeluaran"
      />

      <ExpenseForm
        action={createExpenseAction}
        propertyId={propertyId}
        initial={initial}
        submitLabel="Simpan Pengeluaran"
      />
    </div>
  );
}
