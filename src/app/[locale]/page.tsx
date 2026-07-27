import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { buildMetadata } from '@/lib/seo';
import { buildWaLink } from '@/lib/whatsapp';
import { serializeSchema, organizationSchema, webPageSchema } from '@/lib/structured-data';
import { siteConfig } from '@/config/site';
import { publicRoomService } from '@/services/room.service';
import { publicPromoService } from '@/services/promo.service';

import { RoomFloorPlan } from './RoomFloorPlan';

const GENERAL_FACILITIES = [
  { title: 'Wifi Kencang', description: 'Internet stabil di seluruh area kost.' },
  { title: 'Keamanan 24 Jam', description: 'CCTV dan akses pintu terjaga sepanjang hari.' },
  { title: 'Area Parkir', description: 'Parkir motor dan mobil yang luas dan aman.' },
  { title: 'Dapur Bersama', description: 'Ruang dapur bersih untuk memasak sehari-hari.' },
  { title: 'Ruang Jemur', description: 'Area jemur pakaian yang teduh dan tertata.' },
  { title: 'Laundry', description: 'Layanan laundry terdekat untuk kebutuhan cucian.' },
] as const;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = siteConfig.pages['home'];
  return buildMetadata({
    title: page?.title,
    description: page?.description,
    path: '/',
    locale,
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  const [floors, promos] = await Promise.all([
    publicRoomService.listFloorsWithRooms(),
    publicPromoService.listActive(),
  ]);

  const contactWaLink = buildWaLink(
    siteConfig.company.whatsappNumber,
    'Halo Admin Gracianda House, saya mau tanya tentang kamar kost.',
  );

  return (
    <>
      <script
        id="org-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchema(organizationSchema()) }}
      />
      <script
        id="webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema(
            webPageSchema({
              name: siteConfig.pages['home']?.title ?? siteConfig.name,
              description: siteConfig.pages['home']?.description ?? siteConfig.description,
              url: siteConfig.url,
            }),
          ),
        }}
      />

      <Header />
      <main>
        {/* Hero */}
        <section className="container-page flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-24 text-center">
          <Badge variant="secondary" className="mb-6">
            {t('hero.badge')}
          </Badge>

          <Typography
            variant="h1"
            className="mb-6 max-w-3xl text-balance bg-gradient-to-b from-foreground to-foreground-muted bg-clip-text text-transparent"
            style={{ whiteSpace: 'pre-line' }}
          >
            {t('hero.title')}
          </Typography>

          <Typography variant="lead" className="mb-10 max-w-xl text-foreground-muted">
            {t('hero.description')}
          </Typography>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="#kamar">
              <Button size="lg">{t('hero.ctaPrimary')}</Button>
            </a>
            <a href={contactWaLink} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline">
                {t('hero.ctaSecondary')}
              </Button>
            </a>
          </div>
        </section>

        {/* Promo */}
        {promos.length > 0 && (
          <section className="container-page pb-16">
            <Typography variant="h3" className="mb-6 text-center">
              {t('promo.heading')}
            </Typography>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {promos.map((promo) => (
                <Card key={promo.id} className="border-gradient">
                  <CardHeader>
                    <CardTitle>{promo.title}</CardTitle>
                  </CardHeader>
                  {promo.description && (
                    <CardContent>
                      <Typography variant="muted">{promo.description}</Typography>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Facilities */}
        <section className="container-page py-16">
          <div className="mb-12 text-center">
            <Typography variant="h2" className="mb-3">
              {t('facilities.heading')}
            </Typography>
            <Typography variant="lead" className="text-foreground-muted">
              {t('facilities.subheading')}
            </Typography>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GENERAL_FACILITIES.map((facility) => (
              <Card key={facility.title}>
                <CardHeader>
                  <CardTitle>{facility.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Typography variant="muted">{facility.description}</Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Rooms — interactive floor plan */}
        <section id="kamar" className="container-page py-16">
          <div className="mb-12 text-center">
            <Typography variant="h2" className="mb-3">
              {t('rooms.heading')}
            </Typography>
            <Typography variant="lead" className="text-foreground-muted">
              {t('rooms.subheading')}
            </Typography>
          </div>

          <RoomFloorPlan floors={floors} />
        </section>

        {/* Location */}
        <section id="lokasi" className="container-page py-16">
          <Typography variant="h2" className="mb-6 text-center">
            {t('location.heading')}
          </Typography>
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src={siteConfig.company.mapEmbedUrl}
              title="Lokasi Gracianda House"
              className="h-96 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <Typography variant="muted" className="mt-3 text-center">
            {siteConfig.company.address}
          </Typography>
        </section>

        {/* Contact */}
        <section id="kontak" className="container-page pb-24 text-center">
          <Typography variant="h2" className="mb-6">
            {t('contact.heading')}
          </Typography>
          <a href={contactWaLink} target="_blank" rel="noopener noreferrer">
            <Button size="lg">{t('contact.cta')}</Button>
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
