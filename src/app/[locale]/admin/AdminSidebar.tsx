'use client';

import { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Building,
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
    ],
  },
];

export function AdminSidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'master-data': true,
    'operasional': true,
    'laporan': true,
    'sistem': true,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    // 1. Read from localStorage
    let currentSectionsState: Record<string, boolean> = {
      'master-data': true,
      'operasional': true,
      'laporan': true,
      'sistem': true,
    };

    const saved = localStorage.getItem('admin_sidebar_sections');
    if (saved) {
      try {
        currentSectionsState = { ...currentSectionsState, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse sidebar sections state', e);
      }
    }

    // 2. Auto-expand section matching current route
    const activeSection = SECTIONS.find((section) =>
      section.items.some((item) => pathname.startsWith(item.href))
    );

    if (activeSection) {
      currentSectionsState[activeSection.id] = true;
      localStorage.setItem('admin_sidebar_sections', JSON.stringify(currentSectionsState));
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenSections(currentSectionsState);
  }, [pathname]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('admin_sidebar_sections', JSON.stringify(updated));
      return updated;
    });
  };

  // Filter sections and items based on role
  const filteredSections = SECTIONS.map((section) => {
    const items = section.items.filter((item) => item.roles.includes(role));
    return { ...section, items };
  }).filter((section) => section.items.length > 0);

  const showDashboard = DASHBOARD_ITEM.roles.includes(role);

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6 bg-surface-raised/40">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md shadow-primary-glow">
          G
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-foreground">Gracianda House</span>
          <span className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider">Admin Portal</span>
        </div>
      </div>

      {/* Navigation Areas */}
      <nav
        aria-label="Admin navigation"
        className="flex-1 space-y-5 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 hover:[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {/* Dashboard Link */}
        {showDashboard && (
          <div className="space-y-1">
            <Link
              href={DASHBOARD_ITEM.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-250',
                pathname === DASHBOARD_ITEM.href
                  ? 'bg-primary-subtle text-primary shadow-xs font-semibold'
                  : 'text-foreground-muted hover:bg-surface-raised hover:text-foreground',
              )}
            >
              <DASHBOARD_ITEM.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{DASHBOARD_ITEM.label}</span>
            </Link>
          </div>
        )}

        {/* Collapsible Sections */}
        {filteredSections.map((section) => {
          const isOpen = openSections[section.id] !== false; // Default to true
          return (
            <div key={section.id} className="space-y-1.5">
              {/* Section Header Button */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted/80 hover:bg-surface-raised hover:text-foreground transition-all duration-150 cursor-pointer focus:outline-hidden"
              >
                <span>{section.title}</span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-foreground-muted/60 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-foreground-muted/60 transition-transform duration-200" />
                )}
              </button>

              {/* Section Items Container with height and opacity transition */}
              <div
                className={cn(
                  'space-y-1 overflow-hidden transition-all duration-300 ease-in-out pl-2 border-l border-border/60 ml-2.5',
                  isOpen
                    ? 'max-h-[300px] opacity-100 visibility-visible'
                    : 'max-h-0 opacity-0 pointer-events-none visibility-hidden'
                )}
              >
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                        active
                          ? 'bg-primary-subtle text-primary shadow-xs font-semibold'
                          : 'text-foreground-muted hover:bg-surface-raised hover:text-foreground',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Footer Profile & Sign Out */}
      <div className="border-t border-border p-4 bg-surface-raised/20">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shadow-xs">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground truncate">{userName}</span>
            <span className="text-[10px] text-foreground-muted font-medium capitalize truncate">
              {role.toLowerCase().replace('_', ' ')}
            </span>
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-all duration-200 hover:bg-destructive-subtle hover:text-destructive cursor-pointer focus:outline-hidden"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Keluar</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface print:hidden shadow-xs h-screen sticky top-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-surface flex items-center justify-between px-4 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
            G
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground leading-none">Gracianda House</span>
            <span className="text-[10px] text-foreground-muted font-semibold uppercase tracking-wider mt-0.5">Admin Portal</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-foreground-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-lg cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer content */}
          <aside className="relative flex w-64 flex-col bg-surface border-r border-border h-full z-50 animate-in slide-in-from-left duration-200">
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 text-foreground-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderSidebarContent()}
          </aside>
        </div>
      )}
    </>
  );
}
