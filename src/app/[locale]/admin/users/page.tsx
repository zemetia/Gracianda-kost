import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Typography } from '@/components/ui/Typography';
import { ROLE_LABEL } from '@/config/roles';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { userService } from '@/services/user.service';

import { createUserAction } from './actions';
import { UserForm } from './UserForm';

export default async function UsersPage() {
  const [users, session] = await Promise.all([userService.list(), getSession()]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Typography variant="h2" className="mb-1">
          Pengguna
        </Typography>
        <Typography variant="muted">
          Akun admin yang bisa masuk ke sistem. Hanya Super Admin yang bisa membuat dan mengubah role.
        </Typography>
      </div>

      <section className="flex flex-col gap-6 border-t border-border pt-8">
        <h3 className="text-base font-semibold text-foreground">Tambah Pengguna</h3>
        <div className="max-w-4xl">
          <UserForm action={createUserAction} submitLabel="Buat Pengguna" passwordRequired />
        </div>
      </section>

      <section>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Dibuat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/admin/users/${user.id}`} className="hover:underline">
                    {user.name ?? '—'}
                  </Link>
                  {user.id === session?.user.id && (
                    <span className="ml-2 text-xs text-foreground-subtle">(kamu)</span>
                  )}
                </TableCell>
                <TableCell className="text-foreground-muted">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                    {ROLE_LABEL[user.role] ?? user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'success' : 'destructive'}>
                    {user.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-foreground-muted">
                  {formatDate(user.createdAt, 'id-ID')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
