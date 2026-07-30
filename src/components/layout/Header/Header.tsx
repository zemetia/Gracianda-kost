'use client';

import { useTranslations } from 'next-intl';
import { Menu, X, LockKeyhole } from 'lucide-react';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

export interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const t = useTranslations('navigation');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className={cn(
        'fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-4 pointer-events-none md:pt-5 md:px-6',
        className,
      )}
    >
      <div className="pointer-events-auto relative w-full max-w-[1280px] flex items-center justify-between h-15 rounded-full border border-border/60 bg-surface/85 backdrop-blur-xl px-5 shadow-lg md:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-foreground shrink-0">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-black shadow-sm"
            aria-hidden="true"
          >
            G
          </span>
          <span className="hidden sm:block text-sm font-bold tracking-tight">Gracianda House</span>
        </Link>

        {/* Desktop nav links */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
          {[
            { href: '#kamar', label: t('rooms') },
            { href: '#fasilitas', label: t('facilities') },
            { href: '#lokasi', label: t('location') },
            { href: '#kontak', label: t('contact') },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-foreground-muted transition-all hover:bg-primary-subtle hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/sign-in"
            className="hidden lg:flex items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground-muted transition-all hover:bg-surface-raised hover:text-foreground"
          >
            <LockKeyhole className="h-4 w-4" />
            Login Admin
          </Link>
          <a
            href="#kamar"
            className="hidden lg:flex items-center justify-center bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-full transition-all shadow-sm"
          >
            Cari Kamar →
          </a>

          {/* Mobile hamburger */}
          <button
            aria-label="Toggle menu"
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-primary-subtle text-primary transition-all"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="pointer-events-auto absolute top-20 left-4 right-4 bg-surface/95 backdrop-blur-xl border border-border/60 rounded-3xl shadow-2xl p-4 flex flex-col gap-1 md:hidden">
          {[
            { href: '#kamar', label: t('rooms') },
            { href: '#fasilitas', label: t('facilities') },
            { href: '#lokasi', label: t('location') },
            { href: '#kontak', label: t('contact') },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-foreground-muted transition-all hover:bg-primary-subtle hover:text-primary"
            >
              {label}
            </a>
          ))}
          <div className="mt-2 pt-2 border-t border-border/40 flex flex-col gap-2">
            <Link
              href="/sign-in"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface text-foreground-muted font-bold text-sm px-5 py-3 transition-all"
            >
              <LockKeyhole className="h-4 w-4" />
              Login Admin
            </Link>
            <a
              href="#kamar"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-2xl transition-all"
            >
              Cari Kamar →
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
