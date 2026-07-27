import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { ROLE_LABEL } from '@/config/roles';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
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

      <Card>
        <CardHeader>
          <CardTitle>Tambah Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm action={createUserAction} submitLabel="Buat Pengguna" passwordRequired />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Dibuat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link href={`/admin/users/${user.id}`} className="hover:underline">
                    {user.name ?? '—'}
                  </Link>
                  {user.id === session?.user.id && (
                    <span className="ml-2 text-xs text-foreground-subtle">(kamu)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-foreground-muted">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                    {ROLE_LABEL[user.role] ?? user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.isActive ? 'success' : 'destructive'}>
                    {user.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  {user.createdAt.toLocaleDateString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
