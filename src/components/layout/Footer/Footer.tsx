import { cn } from '@/lib/cn';
import { siteConfig } from '@/config/site';
import { MapPin, Mail, Phone, ExternalLink } from 'lucide-react';


export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn('bg-foreground text-primary-foreground', className)}>
      <div className="container-page py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-black shadow-sm">
                G
              </span>
              <span className="font-extrabold text-lg tracking-tight">{siteConfig.name}</span>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/60 max-w-xs">
              {siteConfig.tagline}
            </p>
            {siteConfig.company.socialLinks.instagram && (
              <a
                href={siteConfig.company.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />

                @graciandahouse
              </a>
            )}
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/40 mb-4">Navigasi</p>
            <nav className="flex flex-col gap-2.5" aria-label="Footer navigation">
              {[
                { href: '#kamar', label: 'Kamar Tersedia' },
                { href: '#fasilitas', label: 'Fasilitas' },
                { href: '#aksesibilitas', label: 'Aksesibilitas' },
                { href: '#faq', label: 'FAQ' },
                { href: '#lokasi', label: 'Lokasi' },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors font-medium"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/40 mb-4">Kontak</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5 text-sm text-primary-foreground/60">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary-foreground/40" />
                <span>{siteConfig.company.address}</span>
              </div>
              <a
                href={`mailto:${siteConfig.company.contactEmail}`}
                className="flex items-center gap-2.5 text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0 text-primary-foreground/40" />
                {siteConfig.company.contactEmail}
              </a>
              <a
                href={`tel:${siteConfig.company.contactPhone}`}
                className="flex items-center gap-2.5 text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <Phone className="h-4 w-4 shrink-0 text-primary-foreground/40" />
                {siteConfig.company.contactPhone}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/40">
          <p>© {year} {siteConfig.name}. Semua hak dilindungi.</p>
          <p>Dibuat dengan ❤ untuk kenyamanan penghuninya.</p>
        </div>
      </div>
    </footer>
  );
}
