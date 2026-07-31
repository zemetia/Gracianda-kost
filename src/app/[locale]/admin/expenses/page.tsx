import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { EXPENSE_CATEGORIES, expenseCategoryLabel, type ExpenseCategory } from '@/lib/expense';
import { getPropertyScope } from '@/lib/property-scope';
import { formatDate, formatRupiah } from '@/lib/utils';
import { expenseService } from '@/services/expense.service';
import { propertyService } from '@/services/property.service';

import { ExpenseRowActions } from './ExpenseRowActions';

interface Props {
  searchParams: Promise<{ propertyId?: string; category?: string; from?: string; to?: string }>;
}

export default async function ExpensesPage({ searchParams }: Props) {
  const { propertyId, category, from, to } = await searchParams;
  const activeProperties = await propertyService.listActive();

  let selectedPropertyId = await getPropertyScope(propertyId);
  if (!selectedPropertyId && activeProperties.length > 0) {
    selectedPropertyId = activeProperties[0]?.id;
  }

  const [expenses, session] = await Promise.all([
    selectedPropertyId
      ? expenseService.list({
          propertyId: selectedPropertyId,
          category: (category as ExpenseCategory) || undefined,
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
        })
      : Promise.resolve([]),
    getSession(),
  ]);
  const canManage = !!session && ['SUPER_ADMIN', 'KEUANGAN'].includes(session.user.role);

  const total = expenses.reduce((sum, expense) => sum + expense.amount.toNumber(), 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Pengeluaran"
        description="Catatan biaya operasional — renovasi, kebersihan, listrik, gaji staf, dan lainnya."
        action={
          selectedPropertyId && canManage ? (
            <Link href={`/admin/expenses/new?propertyId=${selectedPropertyId}`}>
              <Button>Tambah Pengeluaran</Button>
            </Link>
          ) : undefined
        }
      />

      {/* Property Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-border pb-px">
        {activeProperties.map((prop) => (
          <Link
            key={prop.id}
            href={`/admin/expenses?propertyId=${prop.id}`}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-all ${
              selectedPropertyId === prop.id
                ? 'border-primary font-bold text-primary'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
          >
            {prop.name} ({prop.code})
          </Link>
        ))}
        {activeProperties.length === 0 && (
          <Typography variant="muted" className="py-2">
            Belum ada properti aktif. Tambahkan properti terlebih dahulu di menu Properti.
          </Typography>
        )}
      </div>

      {selectedPropertyId && (
        <>
          <Card noPadding>
            <CardContent className="p-4">
              <form
                method="get"
                className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
              >
                <input type="hidden" name="propertyId" value={selectedPropertyId} />
                <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4 lg:max-w-3xl lg:grid-cols-4">
                  <Select
                    name="category"
                    label="Kategori"
                    size="sm"
                    placeholder="Semua"
                    allowEmpty
                    defaultValue={category ?? ''}
                    options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                  />
                  <DatePicker label="Dari Tanggal" name="from" size="sm" defaultValue={from} />
                  <DatePicker label="Sampai Tanggal" name="to" size="sm" defaultValue={to} />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button type="submit" size="sm" variant="secondary">
                    Terapkan Filter
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left [&>th]:py-2 [&>th]:pr-4 [&>th]:text-xs [&>th]:font-medium [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-foreground-muted">
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Penerima</th>
                  <th>Catatan</th>
                  <th className="text-right">Nominal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border [&>td]:py-2.5 [&>td]:pr-4">
                    <td className="whitespace-nowrap text-foreground-muted">
                      {formatDate(expense.date, 'id-ID')}
                    </td>
                    <td>
                      <Badge variant="outline">{expenseCategoryLabel(expense.category)}</Badge>
                    </td>
                    <td className="text-foreground">{expense.payee || '—'}</td>
                    <td className="max-w-xs truncate text-foreground-muted">{expense.note || '—'}</td>
                    <td className="text-right tabular-nums">{formatRupiah(expense.amount.toNumber())}</td>
                    <td className="pr-0">
                      {canManage && (
                        <ExpenseRowActions
                          id={expense.id}
                          categoryLabel={expenseCategoryLabel(expense.category)}
                          amount={expense.amount.toNumber()}
                        />
                      )}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-foreground-muted">
                      Belum ada pengeluaran tercatat pada filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
              {expenses.length > 0 && (
                <tfoot>
                  <tr className="border-t border-border font-semibold">
                    <td colSpan={4} className="py-2.5 pr-4">
                      Total
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{formatRupiah(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
}
