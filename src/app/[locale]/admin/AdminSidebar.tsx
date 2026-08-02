'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  DoorOpen,
  LayoutGrid,
  Sparkles,
  Tag,
  Users,
  UserX,
  FileText,
  Wallet,
  Receipt,
  Wrench,
  ShieldAlert,
  BarChart3,
  ScrollText,
  UserCog,
  Settings,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Building,
  Landmark,
  CreditCard,
} from 'lucide-react';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

import { signOutAction } from './actions';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

const DASHBOARD_ITEM: NavItem = {
  href: '/admin',
  label: 'Dashboard',
  icon: LayoutDashboard,
  roles: ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN', 'SECURITY'],
};

const SECTIONS: NavSection[] = [
  {
    id: 'master-data',
    title: 'Master Data',
    items: [
      {
        href: '/admin/master-data/properties',
        label: 'Properti',
        icon: Building,
        roles: ['SUPER_ADMIN', 'OPERASIONAL'],
      },
      {
        href: '/admin/master-data/rooms',
        label: 'Kamar',
        icon: DoorOpen,
        roles: ['SUPER_ADMIN', 'OPERASIONAL'],
      },
      {
        href: '/admin/master-data/room-types',
        label: 'Tipe Kamar',
        icon: LayoutGrid,
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
    ],
  },
  {
    id: 'operasional',
    title: 'Manajemen Kost',
    items: [
      {
        href: '/admin/tenants',
        label: 'Penyewa',
        icon: Users,
        roles: ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'],
      },
      {
        href: '/admin/tenants/blacklist',
        label: 'Blacklist',
        icon: UserX,
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
        href: '/admin/expenses',
        label: 'Pengeluaran',
        icon: Receipt,
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
    ],
  },
  {
    id: 'laporan',
    title: 'Laporan',
    items: [
      {
        href: '/admin/reports/financial',
        label: 'Laporan Keuangan',
        icon: BarChart3,
        roles: ['SUPER_ADMIN', 'KEUANGAN'],
      },
      {
        href: '/admin/reports/cash',
        label: 'Rekap Kas',
        icon: Landmark,
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
    ],
  },
  {
    id: 'sistem',
    title: 'Sistem & Pengaturan',
    items: [
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
      {
        href: '/admin/settings',
        label: 'Pengaturan',
        icon: Settings,
        roles: ['SUPER_ADMIN', 'KEUANGAN'],
      },
      {
        href: '/admin/settings/payment-methods',
        label: 'Metode Pembayaran',
        icon: CreditCard,
        roles: ['SUPER_ADMIN', 'KEUANGAN'],
      },
    ],
  },
];

/**
 * Sebuah item menyala kalau ia rute terdalam yang cocok. `startsWith` polos
 * tidak cukup sejak `/admin/tenants/blacklist` ada di samping `/admin/tenants`
 * — keduanya akan menyala, dan penanda "kamu di sini" yang menunjuk dua tempat
 * lebih buruk daripada tidak ada.
 */
function activeHrefFor(pathname: string): string | null {
  const matches = [DASHBOARD_ITEM, ...SECTIONS.flatMap((section) => section.items)]
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`));

  return matches.reduce<string | null>(
    (longest, href) => (longest && longest.length >= href.length ? longest : href),
    null,
  );
}

const DEFAULT_SECTIONS: Record<string, boolean> = {
  'master-data': true,
  operasional: true,
  laporan: true,
  sistem: true,
};

const SECTIONS_KEY = 'admin_sidebar_sections';
const COLLAPSED_KEY = 'admin_sidebar_collapsed';

export function AdminSidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRail, setIsRail] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(DEFAULT_SECTIONS);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRail(localStorage.getItem(COLLAPSED_KEY) === '1');
  }, []);

  useEffect(() => {
    let sectionsState = { ...DEFAULT_SECTIONS };

    const saved = localStorage.getItem(SECTIONS_KEY);
    if (saved) {
      try {
        sectionsState = { ...sectionsState, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse sidebar sections state', e);
      }
    }

    // Auto-expand the section that owns the current route so the active item is
    // never hidden behind a collapsed header.
    const activeSection = SECTIONS.find((section) =>
      section.items.some((item) => pathname.startsWith(item.href))
    );

    if (activeSection) {
      sectionsState[activeSection.id] = true;
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(sectionsState));
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenSections(sectionsState);
  }, [pathname]);

  // The drawer is a full-screen overlay: freeze the page behind it and let Esc close it.
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleRail = () => {
    setIsRail((prev) => {
      localStorage.setItem(COLLAPSED_KEY, prev ? '0' : '1');
      return !prev;
    });
  };

  const filteredSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);

  const showDashboard = DASHBOARD_ITEM.roles.includes(role);
  const activeHref = activeHrefFor(pathname);

  const renderNavItem = (item: NavItem, active: boolean, rail: boolean) => (
    <Link
      key={item.href}
      href={item.href}
      title={rail ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-11 items-center rounded-lg text-sm font-medium transition-colors duration-200',
        rail ? 'justify-center px-0' : 'gap-3 px-3',
        active
          ? 'bg-primary-subtle text-primary font-semibold'
          : 'text-foreground-muted hover:bg-surface-raised hover:text-foreground',
      )}
    >
      {/* Accent rail on the active row — the ERP convention for "you are here". */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity duration-200',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
      <item.icon
        className={cn('h-[1.15rem] w-[1.15rem] shrink-0', active ? 'text-primary' : 'text-foreground-subtle group-hover:text-foreground')}
        aria-hidden="true"
      />
      {!rail && <span className="truncate">{item.label}</span>}
    </Link>
  );

  const renderSidebarContent = (rail: boolean) => (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border bg-surface-raised/40',
          rail ? 'justify-center px-2' : 'gap-3 px-4',
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md shadow-primary-glow">
          G
        </div>
        {!rail && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold tracking-tight text-foreground">Gracianda House</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Admin Portal
            </span>
          </div>
        )}
      </div>

      <nav
        aria-label="Admin navigation"
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden py-4',
          '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 hover:[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent',
          rail ? 'space-y-2 px-2' : 'space-y-4 px-3',
        )}
      >
        {showDashboard && renderNavItem(DASHBOARD_ITEM, activeHref === DASHBOARD_ITEM.href, rail)}

        {filteredSections.map((section) => {
          const isOpen = rail || openSections[section.id] !== false;
          return (
            <div key={section.id} className={cn(rail ? 'space-y-2 border-t border-border/70 pt-2' : 'space-y-1')}>
              {!rail && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-foreground-subtle transition-colors duration-150 hover:text-foreground"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      isOpen ? 'rotate-0' : '-rotate-90',
                    )}
                    aria-hidden="true"
                  />
                </button>
              )}

              {/* grid-rows 1fr↔0fr animates to the content's real height — no max-h guess. */}
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-300 ease-in-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className={cn('overflow-hidden', !isOpen && 'pointer-events-none')}>
                  <div className="space-y-1">
                    {section.items.map((item) =>
                      renderNavItem(item, activeHref === item.href, rail),
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={cn('shrink-0 border-t border-border bg-surface-raised/20 p-3', rail && 'px-2')}>
        <div className={cn('mb-2 flex items-center', rail ? 'justify-center' : 'gap-3 px-1 py-1')}>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary"
            title={rail ? userName : undefined}
          >
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          {!rail && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-foreground">{userName}</span>
              <span className="truncate text-[10px] font-medium capitalize text-foreground-muted">
                {role.toLowerCase().replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            title={rail ? 'Keluar' : undefined}
            className={cn(
              'flex h-11 w-full cursor-pointer items-center rounded-lg text-sm font-medium text-foreground-muted transition-colors duration-200 hover:bg-destructive-subtle hover:text-destructive',
              rail ? 'justify-center px-0' : 'gap-3 px-3',
            )}
          >
            <LogOut className="h-[1.15rem] w-[1.15rem] shrink-0" aria-hidden="true" />
            {!rail && <span>Keluar</span>}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — collapses to an icon rail on demand */}
      <aside
        className={cn(
          'sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-border bg-surface shadow-xs transition-[width] duration-300 ease-in-out md:flex print:hidden',
          isRail ? 'w-[4.5rem]' : 'w-64 xl:w-72',
        )}
      >
        {renderSidebarContent(isRail)}
        <button
          type="button"
          onClick={toggleRail}
          aria-label={isRail ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          title={isRail ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          className="absolute -right-3 top-20 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-foreground-muted shadow-xs transition-colors hover:border-border-strong hover:text-foreground lg:flex"
        >
          {isRail ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-surface px-4 shadow-xs md:hidden print:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground shadow-xs">
            G
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold leading-none tracking-tight text-foreground">
              Gracianda House
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
              Admin Portal
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
          aria-label="Buka menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[17rem] max-w-[85vw] flex-col border-r border-border bg-surface shadow-lg animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-3 top-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-raised hover:text-foreground"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
