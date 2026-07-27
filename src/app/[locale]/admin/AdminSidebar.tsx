'use client';

import {
  LayoutDashboard,
  DoorOpen,
  Sparkles,
  Tag,
  Users,
  FileText,
  Wallet,
  Wrench,
  ShieldAlert,
  BarChart3,
  ScrollText,
  UserCog,
  LogOut,
} from 'lucide-react';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { Typography } from '@/components/ui/Typography';

import { signOutAction } from './actions';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN', 'SECURITY'],
  },
  {
    href: '/admin/master-data/rooms',
    label: 'Kamar',
    icon: DoorOpen,
    roles: ['SUPER_ADMIN', 'OPERASIONAL'],
  },
  {
    href: '/admin/master-data/facilities',
    label: 'Fasilitas',
    icon: Sparkles,
    roles: ['SUPER_ADMIN', 'OPERASIONAL'],
  },
  {
    href: '/admin/master-data/promos',
    label: 'Promo',
    icon: Tag,
    roles: ['SUPER_ADMIN', 'OPERASIONAL'],
  },
  {
    href: '/admin/tenants',
    label: 'Penyewa',
    icon: Users,
    roles: ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'],
  },
  {
    href: '/admin/contracts',
    label: 'Kontrak',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'],
  },
  {
    href: '/admin/payments',
    label: 'Pembayaran',
    icon: Wallet,
    roles: ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'],
  },
  {
    href: '/admin/maintenance',
    label: 'Maintenance',
    icon: Wrench,
    roles: ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'],
  },
  {
    href: '/admin/incidents',
    label: 'Insiden',
    icon: ShieldAlert,
    roles: ['SUPER_ADMIN', 'SECURITY', 'OPERASIONAL'],
  },
  {
    href: '/admin/reports/financial',
    label: 'Laporan Keuangan',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'KEUANGAN'],
  },
  {
    href: '/admin/reports/tenants',
    label: 'Laporan Penyewa',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'OPERASIONAL'],
  },
  {
    href: '/admin/reports/maintenance',
    label: 'Laporan Maintenance',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'OPERASIONAL'],
  },
  {
    href: '/admin/reports/incidents',
    label: 'Laporan Insiden',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'SECURITY'],
  },
  {
    href: '/admin/audit-log',
    label: 'Audit Log',
    icon: ScrollText,
    roles: ['SUPER_ADMIN'],
  },
  {
    href: '/admin/users',
    label: 'Pengguna',
    icon: UserCog,
    roles: ['SUPER_ADMIN'],
  },
];

export function AdminSidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface print:hidden">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Typography variant="h6" as="span">
          Gracianda House
        </Typography>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 space-y-1 p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-subtle text-primary'
                  : 'text-foreground-muted hover:bg-surface-raised hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 truncate px-3 text-xs text-foreground-subtle">{userName}</div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
