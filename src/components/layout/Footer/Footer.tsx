import { cn } from '@/lib/cn';
import { siteConfig } from '@/config/site';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn('border-t border-border/50 bg-surface', className)}>
      <div className="container-page flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <p className="text-sm text-foreground-subtle">
          © {year} {siteConfig.name}. Semua hak dilindungi.
        </p>

        <nav aria-label="Footer links" className="flex flex-wrap items-center gap-4 text-sm text-foreground-subtle">
          <span>{siteConfig.company.address}</span>
          <a href={`mailto:${siteConfig.company.contactEmail}`} className="hover:text-foreground">
            {siteConfig.company.contactEmail}
          </a>
        </nav>
      </div>
    </footer>
  );
}
