import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Money } from '@/components/ui/Money';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { EXPENSE_CATEGORIES, expenseCategoryLabel, type ExpenseCategory } from '@/lib/expense';
import { getPropertyScope } from '@/lib/property-scope';
import { formatDate } from '@/lib/utils';
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap text-foreground-muted">
                    {formatDate(expense.date, 'id-ID')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{expenseCategoryLabel(expense.category)}</Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{expense.payee || '—'}</TableCell>
                  <TableCell className="max-w-xs truncate text-foreground-muted">{expense.note || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Money value={expense.amount.toNumber()} />
                  </TableCell>
                  <TableCell>
                    {canManage && (
                      <ExpenseRowActions
                        id={expense.id}
                        categoryLabel={expenseCategoryLabel(expense.category)}
                        amount={expense.amount.toNumber()}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableEmpty colSpan={6}>Belum ada pengeluaran tercatat pada filter ini.</TableEmpty>
              )}
            </TableBody>
            {expenses.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right">
                    <Money value={total} size="total" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </>
      )}
    </div>
  );
}
