import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, Clock, MapPin, Ruler, Users } from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Money } from '@/components/ui/Money';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cycleWording } from '@/lib/billing';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, serializeSchema, webPageSchema } from '@/lib/structured-data';
import { GENDER_POLICY_LABEL } from '@/lib/tenant';
import { formatPropertyAddress, formatRoomSize, formatRupiah } from '@/lib/utils';
import { buildWaLink } from '@/lib/whatsapp';
import { siteConfig } from '@/config/site';
import { catalogService } from '@/services/catalog.service';

import { CatalogGallery } from '../../CatalogGallery';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const room = await catalogService.getRoom(id);
  if (!room) return buildMetadata({ path: `/kamar/${id}`, locale, noIndex: true });

  const status = room.status === 'AVAILABLE' ? 'masih kosong' : 'sedang terisi';
  return buildMetadata({
    title: `Kamar ${room.number} — ${room.property.name}`,
    description: `Kamar ${room.number}${room.roomTypeName ? ` (tipe ${room.roomTypeName})` : ''} di ${room.property.name} ${status}, ${formatRupiah(room.price)} per bulan. Lihat fasilitas dan paket sewanya.`,
    path: `/kamar/${id}`,
    locale,
  });
}

export default async function RoomPage({ params }: Props) {
  const { locale, id } = await params;
  const room = await catalogService.getRoom(id);
  if (!room) notFound();

  const isAvailable = room.status === 'AVAILABLE';
  const size = formatRoomSize(room.lengthM, room.widthM);
  const address = formatPropertyAddress(room.property);
  const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;

  // Monthly first, then the longer packages — the order a tenant compares them in.
  const prices = [...room.prices].sort((a, b) => a.price - b.price);

  const waLink = buildWaLink(
    room.property.whatsappNumber ?? siteConfig.company.whatsappNumber,
    isAvailable
      ? `Halo Admin ${room.property.name}, saya tertarik menyewa kamar ${room.number}${
          room.roomTypeName ? ` (tipe ${room.roomTypeName})` : ''
        } yang masih kosong. Bisakah saya menjadwalkan survei lokasi?`
      : `Halo Admin ${room.property.name}, kamar ${room.number} sedang terisi. Kapan perkiraan kosongnya, atau adakah kamar sejenis yang tersedia?`,
  );

  return (
    <>
      <script
        id="webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema(
            webPageSchema({
              name: `Kamar ${room.number} — ${room.property.name}`,
              description: `Kamar ${room.number} di ${room.property.name}, ${formatRupiah(room.price)} per bulan.`,
              url: `${siteConfig.url}${localePrefix}/kamar/${room.id}`,
            }),
          ),
        }}
      />
      <script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema(
            breadcrumbSchema([
              { name: 'Beranda', url: `${siteConfig.url}${localePrefix}` },
              { name: 'Cari Kamar', url: `${siteConfig.url}${localePrefix}/cari-kamar` },
              {
                name: room.roomTypeName ?? 'Tanpa Tipe',
                url: `${siteConfig.url}${localePrefix}/tipe-kamar/${room.groupId}`,
              },
              { name: `Kamar ${room.number}`, url: `${siteConfig.url}${localePrefix}/kamar/${room.id}` },
            ]),
          ),
        }}
      />

      <Header />

      <main className="min-h-screen bg-background pt-28 pb-20 lg:pt-32">
        <div className="container-page flex flex-col gap-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-foreground-muted"
          >
            <Link href="/" className="hover:text-primary">
              Beranda
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <Link href="/cari-kamar" className="hover:text-primary">
              Cari Kamar
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <Link href={`/tipe-kamar/${room.groupId}`} className="hover:text-primary">
              {room.roomTypeName ?? 'Tanpa Tipe'}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="text-foreground">Kamar {room.number}</span>
          </nav>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isAvailable ? 'success' : 'secondary'} size="lg" dot>
                {isAvailable ? 'Masih kosong' : 'Sedang terisi'}
              </Badge>
              {room.roomTypeName && (
                <Link href={`/tipe-kamar/${room.groupId}`}>
                  <Badge variant="outline" size="lg">
                    Tipe {room.roomTypeName}
                  </Badge>
                </Link>
              )}
              {room.floorName && (
                <Badge variant="outline" size="lg">
                  {room.floorName}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Kamar {room.number}
            </h1>

            <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-foreground-muted">
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Lokasi</dt>
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
                <dd>{address ?? room.property.name}</dd>
              </div>
              {size && (
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Ukuran kamar</dt>
                  <Ruler className="h-4 w-4 text-primary" aria-hidden />
                  <dd>{size}</dd>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Aturan penghuni</dt>
                <Users className="h-4 w-4 text-primary" aria-hidden />
                {/* The label is written for mid-sentence use — "khusus putra", not "Khusus Putra". */}
                <dd>Hunian {GENDER_POLICY_LABEL[room.property.genderPolicy] ?? 'campur'}</dd>
              </div>
              {room.property.curfewTime && (
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Jam malam</dt>
                  <Clock className="h-4 w-4 text-primary" aria-hidden />
                  <dd>Jam malam {room.property.curfewTime}</dd>
                </div>
              )}
            </dl>
          </div>

          <CatalogGallery photos={room.photos} alt={`Kamar ${room.number}`} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="flex flex-col gap-10">
              {room.description && (
                <section>
                  <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground">
                    Tentang kamar ini
                  </h2>
                  <p className="text-sm leading-relaxed text-foreground-muted">{room.description}</p>
                </section>
              )}

              {room.facilities.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
                    Fasilitas kamar
                  </h2>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {room.facilities.map((facility) => (
                      <li
                        key={facility.id}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface p-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                          <Icon name={facility.icon} className="h-4 w-4" />
                        </span>
                        <span className="text-xs font-semibold text-foreground-muted">
                          {facility.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {room.property.rules && (
                <section>
                  <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground">
                    Aturan hunian
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {room.property.rules
                      .split('\n')
                      .map((rule) => rule.trim())
                      .filter(Boolean)
                      .map((rule) => (
                        <li
                          key={rule}
                          className="flex gap-2.5 text-sm leading-relaxed text-foreground-muted"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                          {rule}
                        </li>
                      ))}
                  </ul>
                </section>
              )}

              {room.property.mapsUrl && (
                <section>
                  <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground">Lokasi</h2>
                  <a
                    href={room.property.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                  >
                    <MapPin className="h-4 w-4" aria-hidden />
                    Buka {room.property.name} di Google Maps
                  </a>
                </section>
              )}
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="flex flex-col gap-5 rounded-[1.5rem] border border-border/50 bg-surface p-6 shadow-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
                    Harga sewa
                  </p>
                  <Money value={room.price} size="primary" tone="primary" />
                  <span className="ml-1 text-sm font-normal text-foreground-muted">/bulan</span>
                </div>

                {prices.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-border/30 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
                      Pilihan paket sewa
                    </p>
                    {prices.map((price) => {
                      const wording = cycleWording(price.billingCycle, price.interval);
                      return (
                        <div
                          key={`${price.billingCycle}-${price.interval}`}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="text-xs font-semibold text-foreground-muted">
                            {wording.label}
                          </span>
                          <span>
                            <Money value={price.price} size="inline" />
                            <span className="ml-1 text-[10px] font-normal text-foreground-muted">
                              /{wording.per}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-center text-sm font-bold text-primary-foreground shadow-primary-glow transition-all hover:bg-primary-hover"
                >
                  {isAvailable ? 'Booking kamar ini via WhatsApp' : 'Tanya estimasi kosong'}
                </a>

                <Link
                  href={`/tipe-kamar/${room.groupId}`}
                  className="text-center text-xs font-bold text-primary hover:underline"
                >
                  Lihat kamar lain di tipe yang sama →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
