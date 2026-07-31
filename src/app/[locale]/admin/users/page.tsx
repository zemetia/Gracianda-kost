import { Badge } from '@/components/ui/Badge';
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

      <section className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">Nama</th>
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">Email</th>
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">Role</th>
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">Status</th>
              <th className="py-2 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border">
                <td className="py-2.5 pr-4 font-medium text-foreground">
                  <Link href={`/admin/users/${user.id}`} className="hover:underline">
                    {user.name ?? '—'}
                  </Link>
                  {user.id === session?.user.id && (
                    <span className="ml-2 text-xs text-foreground-subtle">(kamu)</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-foreground-muted">{user.email}</td>
                <td className="py-2.5 pr-4">
                  <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                    {ROLE_LABEL[user.role] ?? user.role}
                  </Badge>
                </td>
                <td className="py-2.5 pr-4">
                  <Badge variant={user.isActive ? 'success' : 'destructive'}>
                    {user.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="py-2.5 text-right tabular-nums text-foreground-muted">
                  {formatDate(user.createdAt, 'id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
