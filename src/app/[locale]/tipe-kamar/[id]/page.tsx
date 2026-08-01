import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, DoorOpen, Ruler, Building2 } from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Money } from '@/components/ui/Money';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cycleWording } from '@/lib/billing';
import { propertyTypeLabel } from '@/lib/property';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbSchema, serializeSchema, webPageSchema } from '@/lib/structured-data';
import { formatRoomSize, formatRupiah } from '@/lib/utils';
import { buildRoomTypeInquiryMessage, buildWaLink } from '@/lib/whatsapp';
import { siteConfig } from '@/config/site';
import { catalogService, type CatalogRoom } from '@/services/catalog.service';

import { CatalogGallery } from '../../CatalogGallery';
import { RoomUnitCard } from '../../RoomUnitCard';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const group = await catalogService.getGroup(id);
  if (!group) return buildMetadata({ path: `/tipe-kamar/${id}`, locale, noIndex: true });

  return buildMetadata({
    title: `Kamar Tipe ${group.name} — ${group.propertyName}`,
    description:
      group.description ??
      `${group.availableRooms} dari ${group.totalRooms} kamar tipe ${group.name} di ${group.propertyName} masih kosong. Lihat harga, fasilitas, dan nomor kamarnya.`,
    path: `/tipe-kamar/${id}`,
    locale,
  });
}

/** Units keep the service's floor-then-number order; this only cuts them into sections. */
function byFloor(rooms: CatalogRoom[]): { name: string; rooms: CatalogRoom[] }[] {
  const sections: { name: string; rooms: CatalogRoom[] }[] = [];

  for (const room of rooms) {
    const name = room.floorName ?? 'Unit hunian';
    const last = sections.at(-1);
    if (last && last.name === name) last.rooms.push(room);
    else sections.push({ name, rooms: [room] });
  }

  return sections;
}

export default async function RoomTypePage({ params }: Props) {
  const { locale, id } = await params;
  const group = await catalogService.getGroup(id);
  if (!group) notFound();

  const size = formatRoomSize(group.lengthM, group.widthM);
  const floors = byFloor(group.rooms);
  const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const waLink = buildWaLink(
    group.propertyWhatsapp ?? siteConfig.company.whatsappNumber,
    buildRoomTypeInquiryMessage(group.name, group.propertyName),
  );

  return (
    <>
      <script
        id="webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema(
            webPageSchema({
              name: `Kamar Tipe ${group.name} — ${group.propertyName}`,
              description:
                group.description ??
                `Kamar tipe ${group.name} di ${group.propertyName}, mulai ${formatRupiah(group.priceFrom)} per bulan.`,
              url: `${siteConfig.url}${localePrefix}/tipe-kamar/${group.id}`,
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
              { name: group.name, url: `${siteConfig.url}${localePrefix}/tipe-kamar/${group.id}` },
            ]),
          ),
        }}
      />

      <Header />

      <main className="min-h-screen bg-background pt-28 pb-20 lg:pt-32">
        <div className="container-page flex flex-col gap-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-foreground-muted">
            <Link href="/" className="hover:text-primary">
              Beranda
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <Link href="/cari-kamar" className="hover:text-primary">
              Cari Kamar
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="text-foreground">{group.name}</span>
          </nav>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={group.availableRooms > 0 ? 'success' : 'secondary'} size="lg" dot>
                {group.availableRooms > 0 ? `${group.availableRooms} kamar kosong` : 'Semua kamar terisi'}
              </Badge>
              <Badge variant="outline" size="lg">
                {propertyTypeLabel(group.propertyType)}
              </Badge>
              {group.roomTypeId === null && (
                <Badge variant="warning" size="lg">
                  Belum dikelompokkan ke tipe
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {group.roomTypeId ? `Kamar Tipe ${group.name}` : 'Kamar Tanpa Tipe'}
            </h1>

            <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-foreground-muted">
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Properti</dt>
                <Building2 className="h-4 w-4 text-primary" aria-hidden />
                <dd>
                  {group.propertyName}
                  {group.propertyCity ? ` · ${group.propertyCity}` : ''}
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Jumlah unit</dt>
                <DoorOpen className="h-4 w-4 text-primary" aria-hidden />
                <dd>
                  {group.availableRooms} dari {group.totalRooms} kamar kosong
                </dd>
              </div>
              {size && (
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Ukuran kamar</dt>
                  <Ruler className="h-4 w-4 text-primary" aria-hidden />
                  <dd>{size}</dd>
                </div>
              )}
            </dl>
          </div>

          <CatalogGallery photos={group.photos} alt={`Kamar tipe ${group.name}`} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="flex flex-col gap-10">
              {group.description && (
                <section>
                  <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground">
                    Tentang tipe ini
                  </h2>
                  <p className="text-sm leading-relaxed text-foreground-muted">{group.description}</p>
                </section>
              )}

              {group.facilities.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
                    Fasilitas kamar
                  </h2>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {group.facilities.map((facility) => (
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
                  <p className="mt-3 text-xs text-foreground-subtle">
                    Fasilitas di atas dimiliki semua kamar tipe ini. Beberapa kamar bisa punya tambahan —
                    cek halaman kamarnya.
                  </p>
                </section>
              )}

              <section>
                <h2 className="mb-1 text-xl font-bold tracking-tight text-foreground">
                  Pilih nomor kamar
                </h2>
                <p className="mb-5 text-sm text-foreground-muted">
                  Harga per kamar bisa berbeda walau tipenya sama. Klik satu kamar untuk detailnya.
                </p>

                <div className="flex flex-col gap-6">
                  {floors.map((floor) => (
                    <div key={floor.name} className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">{floor.name}</span>
                        <span className="h-px flex-1 bg-border/50" />
                        <span className="text-xs font-semibold text-foreground-muted tabular-nums">
                          {floor.rooms.filter((room) => room.status === 'AVAILABLE').length} /{' '}
                          {floor.rooms.length} kosong
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {floor.rooms.map((room) => (
                          <RoomUnitCard key={room.id} room={room} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Price panel — the figure someone screenshots before deciding. */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="flex flex-col gap-5 rounded-[1.5rem] border border-border/50 bg-surface p-6 shadow-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
                    {group.priceFrom === group.priceTo ? 'Harga sewa' : 'Mulai dari'}
                  </p>
                  <Money value={group.priceFrom} size="primary" tone="primary" />
                  <span className="ml-1 text-sm font-normal text-foreground-muted">/bulan</span>
                  {group.priceFrom !== group.priceTo && (
                    <p className="mt-1 text-xs text-foreground-muted">
                      Sampai {formatRupiah(group.priceTo)} tergantung kamar yang dipilih.
                    </p>
                  )}
                </div>

                {group.prices.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-border/30 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
                      Paket sewa standar tipe ini
                    </p>
                    {group.prices.map((price) => {
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
                  className="flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-primary-glow transition-all hover:bg-primary-hover"
                >
                  Tanya ketersediaan via WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
