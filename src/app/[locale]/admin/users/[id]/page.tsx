import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Typography } from '@/components/ui/Typography';
import { ROLE_LABEL } from '@/config/roles';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { userService } from '@/services/user.service';

import { setUserActiveAction, updateUserAction } from '../actions';
import { UserActiveToggle } from '../UserActiveToggle';
import { UserForm } from '../UserForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  const [user, session] = await Promise.all([userService.getById(id), getSession()]);
  if (!user) notFound();

  const isSelf = user.id === session?.user.id;

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <div>
        <Link href="/admin/users" className="text-sm text-foreground-muted hover:underline">
          ← Kembali ke daftar pengguna
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <Typography variant="h2">{user.name ?? user.email}</Typography>
          <Badge variant={user.isActive ? 'success' : 'destructive'}>
            {user.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
          <Badge variant="secondary">{ROLE_LABEL[user.role] ?? user.role}</Badge>
        </div>
      </div>

      <UserForm
        action={updateUserAction.bind(null, user.id)}
        initial={{ name: user.name, email: user.email, role: user.role }}
        submitLabel="Simpan Perubahan"
        passwordRequired={false}
      />

      <section className="flex flex-col gap-3 border-t border-border pt-8">
        <h3 className="text-sm font-semibold text-foreground">Status Akun</h3>
        <Typography variant="muted" className="max-w-xl text-xs leading-relaxed">
          Akun nonaktif tidak bisa login, tapi riwayat audit-nya tetap tersimpan.
        </Typography>
        {isSelf ? (
          <Typography variant="muted" className="text-xs">
            Kamu tidak bisa menonaktifkan akunmu sendiri.
          </Typography>
        ) : (
          <UserActiveToggle
            action={setUserActiveAction.bind(null, user.id)}
            isActive={user.isActive}
          />
        )}
      </section>
    </div>
  );
}
