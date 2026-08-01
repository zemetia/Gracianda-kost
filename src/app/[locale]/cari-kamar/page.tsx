import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { buildMetadata } from '@/lib/seo';
import {
  serializeSchema,
  breadcrumbSchema,
  webPageSchema,
} from '@/lib/structured-data';
import { siteConfig } from '@/config/site';
import { catalogService } from '@/services/catalog.service';

import { RoomTypeCard } from '../RoomTypeCard';
import { RoomUnitCard } from '../RoomUnitCard';
import { parseSearchQuery, type RawSearchParams } from './query';
import { SearchFilters } from './SearchFilters';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = siteConfig.pages['search'];
  return buildMetadata({
    title: page?.title,
    description: page?.description,
    path: '/cari-kamar',
    locale,
  });
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = parseSearchQuery(await searchParams);

  const [groups, options] = await Promise.all([
    catalogService.listGroups({
      propertyId: query.propertyId || undefined,
      propertyType: query.propertyType || undefined,
      groupId: query.groupId || undefined,
      facilityIds: query.facilityIds,
      onlyAvailable: query.onlyAvailable,
      query: query.q || undefined,
    }),
    catalogService.listFilterOptions(),
  ]);

  const rooms = groups.flatMap((group) => group.rooms);
  const availableCount = rooms.filter((room) => room.status === 'AVAILABLE').length;
  const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`;

  return (
    <>
      <script
        id="webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema(
            webPageSchema({
              name: siteConfig.pages['search']?.title ?? 'Cari Kamar',
              description: siteConfig.pages['search']?.description ?? siteConfig.description,
              url: `${siteConfig.url}${localePrefix}/cari-kamar`,
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
            ]),
          ),
        }}
      />

      <Header />

      <main className="min-h-screen bg-background pt-28 pb-20 lg:pt-32">
        <div className="container-page flex flex-col gap-8">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">Cari Kamar</p>
            <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Temukan kamar yang benar-benar cocok
            </h1>
            <p className="text-base leading-relaxed text-foreground-muted">
              Saring berdasarkan kategori hunian, tipe kamar, fasilitas, dan ketersediaan. Hasilnya
              tampil per tipe kamar — buka satu tipe untuk melihat nomor kamar dan status terisinya.
            </p>
          </div>

          <SearchFilters
            initial={query}
            properties={options.properties}
            roomTypes={options.roomTypes}
            facilities={options.facilities}
            resultCount={rooms.length}
          />

          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[1.75rem] border border-border/50 bg-surface px-6 py-16 text-center">
              <SearchX className="h-10 w-10 text-foreground-subtle" aria-hidden />
              <p className="text-base font-bold text-foreground">Tidak ada kamar yang cocok</p>
              <p className="max-w-md text-sm leading-relaxed text-foreground-muted">
                Coba longgarkan filternya — kurangi fasilitas yang dipilih, atau tampilkan juga kamar
                yang sudah terisi untuk melihat tipe yang sedang penuh.
              </p>
              <Link href="/cari-kamar" className="mt-2 text-sm font-bold text-primary hover:underline">
                Reset semua filter
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground-muted">
                <span className="font-bold text-foreground tabular-nums">{groups.length}</span> tipe kamar ·{' '}
                <span className="font-bold text-foreground tabular-nums">{rooms.length}</span> kamar ·{' '}
                <span className="font-bold text-success tabular-nums">{availableCount}</span> masih kosong
              </p>

              {query.view === 'tipe' ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {groups.map((group) => (
                    <RoomTypeCard key={group.id} group={group} showProperty />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {groups.map((group) => (
                    <section key={group.id} className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/30 pb-3">
                        <div>
                          <Link
                            href={`/tipe-kamar/${group.id}`}
                            className="text-lg font-bold tracking-tight text-foreground hover:text-primary"
                          >
                            {group.name}
                          </Link>
                          <p className="text-xs font-semibold text-foreground-muted">
                            {group.propertyName}
                          </p>
                        </div>
                        <p className="text-sm text-foreground-muted">
                          <span className="font-bold text-success tabular-nums">
                            {group.availableRooms}
                          </span>{' '}
                          dari{' '}
                          <span className="font-bold text-foreground tabular-nums">
                            {group.totalRooms}
                          </span>{' '}
                          kamar kosong
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                        {group.rooms.map((room) => (
                          <RoomUnitCard key={room.id} room={room} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
