import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  Star,
  ShieldCheck,
  Wifi,
  Shield,
  Car,
  Utensils,
  Sun,
  Sparkles,
  MapPin,
  Landmark,
  Compass,
  Heart,
  ChevronDown,
  CheckCircle2,
  Clock,
  Zap,
  Users,
  HeadphonesIcon,
  Wallet,
} from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { buildMetadata } from '@/lib/seo';
import { buildWaLink } from '@/lib/whatsapp';
import { serializeSchema, organizationSchema, webPageSchema, faqSchema } from '@/lib/structured-data';
import { siteConfig } from '@/config/site';
import { publicRoomService } from '@/services/room.service';
import { publicPromoService } from '@/services/promo.service';
import { propertyService } from '@/services/property.service';
import { Link } from '@/i18n/navigation';

import { RoomFloorPlan } from './RoomFloorPlan';

const GENERAL_FACILITIES = [
  {
    title: 'Wifi Kencang',
    description: 'Internet serat optik berkecepatan tinggi stabil di seluruh sudut hunian.',
    icon: <Wifi className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Keamanan 24 Jam',
    description: 'Sistem akses satu pintu (one-gate) dipantau CCTV aktif sepanjang hari.',
    icon: <Shield className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Area Parkir Luas',
    description: 'Parkir kendaraan roda dua dan empat terlindung kanopi aman.',
    icon: <Car className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Dapur Bersama',
    description: 'Dilengkapi kulkas, kompor gas, wastafel, dan peralatan masak higienis.',
    icon: <Utensils className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Area Jemur Teduh',
    description: 'Ruang jemuran pakaian semi-terbuka bebas dari risiko kehujanan.',
    icon: <Sun className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Laundry Terpadu',
    description: 'Kerjasama dengan layanan laundry kilat diantar-jemput ke kamar Anda.',
    icon: <Sparkles className="h-6 w-6 text-primary" />,
  },
] as const;

const NEARBY_LANDMARKS = [
  {
    category: 'campus',
    icon: <Landmark className="h-5 w-5 text-primary" />,
    places: [
      { name: 'Universitas Indonesia (UI) Depok', distance: '10 menit berkendara' },
      { name: 'Universitas Pancasila', distance: '12 menit berkendara' },
      { name: 'Gunadarma University (Kampus D)', distance: '8 menit berkendara' },
    ],
  },
  {
    category: 'transit',
    icon: <Compass className="h-5 w-5 text-primary" />,
    places: [
      { name: 'Stasiun KRL Pondok Cina', distance: '8 menit jalan kaki' },
      { name: 'Halte TransJakarta UI', distance: '10 menit berkendara' },
      { name: 'Akses Pintu Tol Margonda', distance: '15 menit berkendara' },
    ],
  },
  {
    category: 'mall',
    icon: <MapPin className="h-5 w-5 text-primary" />,
    places: [
      { name: 'Margo City Mall', distance: '5 menit berkendara' },
      { name: 'Depok Town Square (DETOS)', distance: '6 menit berkendara' },
      { name: 'Minimarket & Sentra Kuliner', distance: '2 menit jalan kaki' },
    ],
  },
] as const;

const TESTIMONIALS = [
  {
    name: 'Aditya Pratama',
    role: 'Software Engineer',
    rating: 5,
    initial: 'A',
    comment:
      'Kamar kost kedap suara dan sangat nyaman untuk WFH. Koneksi Wi-Fi kencang dan stabil di atas 50 Mbps. Manajemen kost sangat responsif.',
  },
  {
    name: 'Riska Amalia',
    role: 'Mahasiswi Universitas Indonesia',
    rating: 5,
    initial: 'R',
    comment:
      'Sangat dekat ke stasiun Pondok Cina jadi gampang mau ke mana-mana. Kamar mandi dalam bersih dan airnya lancar. Suasananya tenang untuk belajar.',
  },
  {
    name: 'Farhan Hidayat',
    role: 'Karyawan Swasta',
    rating: 5,
    initial: 'F',
    comment:
      'Area parkirnya aman dan dijaga 24 jam. Dapur bersamanya rapi dan peralatan lengkap. Rekomendasi kost terbaik di tengah kota.',
  },
] as const;

const FAQS = [
  {
    question: 'Apakah harga sewa sudah termasuk biaya listrik?',
    answer:
      'Biaya sewa belum termasuk listrik. Kamar menggunakan sistem meteran listrik prabayar (token) mandiri, sehingga Anda bebas mengatur penggunaan daya sendiri.',
  },
  {
    question: 'Apakah diperbolehkan membawa tamu untuk menginap?',
    answer:
      'Tamu keluarga dekat diperbolehkan berkunjung dengan batas waktu kunjung pukul 22.00 WIB. Untuk menginap, wajib melakukan konfirmasi kepada admin kost terlebih dahulu demi menjaga kenyamanan bersama.',
  },
  {
    question: 'Bagaimana sistem pembayaran sewa kamar di Gracianda House?',
    answer:
      'Pembayaran sewa dilakukan secara bulanan secara transfer ke rekening resmi kost. Jatuh tempo pembayaran dihitung sejak tanggal pertama kali Anda mulai menempati kamar.',
  },
  {
    question: 'Fasilitas apa saja yang sudah disediakan di dalam kamar?',
    answer:
      'Setiap kamar standar dilengkapi dengan AC, kasur springbed (bantal + sprei), lemari pakaian, meja belajar, kursi, cermin, dan kamar mandi dalam lengkap dengan shower.',
  },
] as const;

const TRUST_BADGES = [
  { label: 'Terpercaya', icon: <ShieldCheck className="h-5 w-5 text-primary" /> },
  { label: 'Harga Transparan', icon: <Wallet className="h-5 w-5 text-primary" /> },
  { label: 'CS Responsif', icon: <HeadphonesIcon className="h-5 w-5 text-primary" /> },
  { label: 'Proses Cepat', icon: <Zap className="h-5 w-5 text-primary" /> },
  { label: 'Kamar Bersih', icon: <CheckCircle2 className="h-5 w-5 text-primary" /> },
  { label: 'Hemat Waktu', icon: <Clock className="h-5 w-5 text-primary" /> },
  { label: 'Banyak Pilihan', icon: <Users className="h-5 w-5 text-primary" /> },
  { label: 'Garansi Puas', icon: <Heart className="h-5 w-5 text-primary" /> },
];

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ propertyId?: string }>;
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

export default async function HomePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { propertyId } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'home' });

  const activeProperties = await propertyService.listActive();

  let selectedPropertyId = propertyId;
  if (!selectedPropertyId && activeProperties.length > 0) {
    selectedPropertyId = activeProperties[0]?.id;
  }

  const [floors, promos] = await Promise.all([
    selectedPropertyId ? publicRoomService.listFloorsWithRooms(selectedPropertyId) : Promise.resolve([]),
    publicPromoService.listActive(),
  ]);

  const contactWaLink = buildWaLink(
    siteConfig.company.whatsappNumber,
    'Halo Admin Gracianda House, saya mau bertanya mengenai ketersediaan kamar kost.',
  );

  return (
    <>
      {/* Structured schemas for GEO */}
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
      <script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema(
            faqSchema(
              FAQS.map((faq) => ({
                question: faq.question,
                answer: faq.answer,
              })),
            ),
          ),
        }}
      />

      <Header />

      <main className="overflow-hidden bg-background">
        {/* ═══════════════════════════════════════════════════
            HERO — Split layout with floating image card
        ═══════════════════════════════════════════════════ */}
        <section
          id="home"
          className="relative min-h-screen w-full flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-10 container-page pt-28 pb-16 lg:pt-32 lg:pb-20"
        >
          {/* Left column — copy & CTA */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:w-[50%]">
            {/* Eyebrow badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-4 py-2 text-sm font-bold text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Hunian Premium & Terpercaya</span>
            </div>

            {/* Headline */}
            <h1 className="mb-4 max-w-[720px] font-extrabold tracking-[-0.04em] text-3xl sm:text-5xl lg:text-[3.8rem] leading-[1.05] text-foreground">
              Kost Nyaman,{' '}
              <span className="text-warning">Aman &</span>{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, oklch(0.444 0.113 125.6), oklch(0.580 0.130 140.0))',
                }}
              >
                Terkelola Rapi
              </span>
            </h1>

            <p className="mb-8 max-w-[440px] text-base text-foreground-muted leading-relaxed font-medium">
              Temukan kamar kost idealmu di Gracianda House — denah interaktif, harga transparan, dan proses sewa semudah chat WhatsApp.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-10">
              <a
                href="#kamar"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-sm px-7 py-3.5 rounded-full transition-all shadow-primary-glow"
              >
                Lihat Kamar Tersedia
              </a>
              <a
                href={contactWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-border bg-surface hover:bg-surface-raised text-foreground font-bold text-sm px-7 py-3.5 rounded-full transition-all"
              >
                Tanya via WhatsApp
              </a>
            </div>

            {/* Trust micro-badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-6 border-t border-border/40">
              <div className="flex items-center gap-2">
                <div className="flex text-warning">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">
                  4.9/5{' '}
                  <span className="font-normal text-foreground-muted">(120+ Ulasan)</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-semibold">Keamanan Terjamin 24/7</span>
              </div>
            </div>
          </div>

          {/* Right column — Image card composition */}
          <div className="relative w-full lg:w-[50%] lg:max-w-none mt-8 lg:mt-0">
            {/* Soft glow behind the card */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,oklch(0.444_0.113_125.6/0.12),transparent_70%)] blur-3xl" />

            <div className="relative flex flex-col gap-5">
              {/* Main room card */}
              <div className="group overflow-hidden rounded-[2.5rem] border border-border/50 bg-surface shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-primary/30">
                <div className="relative h-72 lg:h-80 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/kost_hero.jpg"
                    alt="Kamar Kost Premium Gracianda House"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
                  <div className="absolute top-4 right-4 rounded-full bg-surface/85 px-3 py-1.5 text-xs font-bold text-foreground backdrop-blur-md border border-border/50">
                    ✦ Kamar Premium
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">Tipe Studio Premium</span>
                    <span className="text-base font-extrabold text-primary">
                      Rp 2,2 Jt <span className="text-xs font-normal text-foreground-muted">/bln</span>
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground-muted leading-relaxed">
                    Kasur queen-size, lemari tanam, AC hemat energi, kamar mandi eksklusif.
                  </p>
                </div>
              </div>

              {/* Floating trust card */}
              <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-surface/90 p-4 shadow-xl backdrop-blur-md max-w-xs self-end -mt-14 mr-4 z-10 transition-transform hover:scale-105">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Kamar Tersertifikasi</p>
                  <p className="text-xs text-foreground-muted">Inspeksi rutin setiap bulan.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            MARQUEE TRUST BELT
        ═══════════════════════════════════════════════════ */}
        <div className="relative w-full overflow-hidden py-5 border-y border-border/40 bg-surface">
          {/* Fade masks */}
          <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-surface to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-surface to-transparent pointer-events-none" />
          <div className="flex w-max animate-marquee gap-12 items-center px-4">
            {[...TRUST_BADGES, ...TRUST_BADGES].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2.5 shrink-0 select-none">
                <span className="shrink-0">{badge.icon}</span>
                <span className="font-bold text-sm text-foreground-muted whitespace-nowrap">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            STATS BAR
        ═══════════════════════════════════════════════════ */}
        <section className="container-page py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {[
              { value: '50+', label: 'Kamar Tersedia' },
              { value: '120+', label: 'Penghuni Puas' },
              { value: '4.9/5', label: 'Rating Ulasan' },
              { value: '24/7', label: 'Keamanan Aktif' },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-1">
                <span className="font-extrabold text-3xl md:text-4xl tracking-[-0.04em] text-foreground leading-none">
                  {stat.value}
                </span>
                <span className="text-sm font-semibold text-foreground-muted leading-tight max-w-[100px]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            GALLERY — 4 grid cards
        ═══════════════════════════════════════════════════ */}
        <section className="container-page py-16 border-t border-border/30">
          <div className="mb-10 text-center">
            <p className="mb-2 font-bold text-primary text-sm md:text-base uppercase tracking-widest">Galeri Hunian</p>
            <h2 className="mb-3 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {t('gallery.heading')}
            </h2>
            <p className="text-foreground-muted max-w-lg mx-auto text-base leading-relaxed">
              {t('gallery.subheading')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { src: '/kost_room_1.jpg', label: 'Kamar Studio Premium', size: 'Double Room' },
              { src: '/kost_room_2.jpg', label: 'Kamar Deluxe Minimalis', size: 'Single Room' },
              { src: '/kost_kitchen.jpg', label: 'Dapur Bersama Modern', size: 'Communal' },
              { src: '/kost_workspace.jpg', label: 'Area Kerja & Belajar', size: 'Coworking' },
            ].map((img, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-surface shadow-md hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.label}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-bold text-sm">{img.label}</p>
                  <p className="text-white/70 text-[11px] mt-0.5 font-semibold uppercase tracking-wider">{img.size}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            FACILITIES
        ═══════════════════════════════════════════════════ */}
        <section id="fasilitas" className="container-page py-16 border-t border-border/30">
          <div className="mb-10 text-center">
            <p className="mb-2 font-bold text-primary text-sm md:text-base uppercase tracking-widest">Fasilitas</p>
            <h2 className="mb-3 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {t('facilities.heading')}
            </h2>
            <p className="text-foreground-muted max-w-lg mx-auto text-base leading-relaxed">
              {t('facilities.subheading')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GENERAL_FACILITIES.map((facility) => (
              <div
                key={facility.title}
                className="flex gap-4 rounded-[1.5rem] border border-border/40 bg-surface p-6 transition-all duration-300 hover:border-primary/30 hover:bg-primary-subtle/30 hover:-translate-y-0.5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary shadow-sm">
                  {facility.icon}
                </span>
                <div>
                  <p className="text-base font-bold text-foreground mb-1">{facility.title}</p>
                  <p className="text-sm text-foreground-muted leading-relaxed">{facility.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            PROMO (conditional)
        ═══════════════════════════════════════════════════ */}
        {promos.length > 0 && (
          <section className="container-page py-12 border-t border-border/30">
            <div className="mb-8 text-center">
              <p className="mb-2 font-bold text-primary text-sm uppercase tracking-widest">Promo Spesial</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {t('promo.heading')}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:max-w-4xl lg:mx-auto">
              {promos.map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-[1.5rem] border border-primary/20 bg-primary-subtle p-6 transition-all hover:border-primary/40"
                >
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    <span className="text-lg font-bold">{promo.title}</span>
                  </div>
                  {promo.description && (
                    <p className="text-sm text-foreground-muted leading-relaxed">{promo.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════
            ROOMS — Interactive floor plan
        ═══════════════════════════════════════════════════ */}
        <section id="kamar" className="container-page py-16 border-t border-border/30">
          <div className="mb-10 text-center">
            <p className="mb-2 font-bold text-primary text-sm md:text-base uppercase tracking-widest">Denah Kamar</p>
            <h2 className="mb-3 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {t('rooms.heading')}
            </h2>
            <p className="text-foreground-muted max-w-lg mx-auto text-base leading-relaxed">
              {t('rooms.subheading')}
            </p>
          </div>

          {/* Property selector */}
          {activeProperties.length > 0 && (
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {activeProperties.map((prop) => (
                <Link
                  key={prop.id}
                  href={`/?propertyId=${prop.id}#kamar`}
                  scroll={false}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all border ${
                    selectedPropertyId === prop.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-primary-glow'
                      : 'border-border bg-surface hover:bg-surface-raised text-foreground-muted hover:text-foreground'
                  }`}
                >
                  {prop.name}
                </Link>
              ))}
            </div>
          )}

          {selectedPropertyId ? (
            <RoomFloorPlan floors={floors} />
          ) : (
            <p className="text-center py-8 text-foreground-muted">
              Belum ada properti aktif yang tersedia saat ini.
            </p>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════
            NEARBY LANDMARKS
        ═══════════════════════════════════════════════════ */}
        <section id="aksesibilitas" className="container-page py-16 border-t border-border/30">
          <div className="mb-10 text-center">
            <p className="mb-2 font-bold text-primary text-sm md:text-base uppercase tracking-widest">Aksesibilitas</p>
            <h2 className="mb-3 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {t('nearby.heading')}
            </h2>
            <p className="text-foreground-muted max-w-lg mx-auto text-base leading-relaxed">
              {t('nearby.subheading')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {NEARBY_LANDMARKS.map((group, idx) => (
              <div key={idx} className="rounded-[1.5rem] border border-border/50 bg-surface p-6 hover:border-primary/20 transition-all">
                <div className="mb-5 flex items-center gap-3 border-b border-border/30 pb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                    {group.icon}
                  </span>
                  <span className="font-bold text-base text-foreground">
                    {t(`nearby.landmarks.${group.category}`)}
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {group.places.map((place, pIdx) => (
                    <div key={pIdx} className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">{place.name}</span>
                      <span className="text-xs text-foreground-muted">{place.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            TESTIMONIALS
        ═══════════════════════════════════════════════════ */}
        <section id="testimoni" className="container-page py-16 border-t border-border/30">
          <div className="mb-10 text-center">
            <p className="mb-2 font-bold text-primary text-sm md:text-base uppercase tracking-widest">Testimoni</p>
            <h2 className="mb-3 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {t('testimonials.heading')}
            </h2>
            <p className="text-foreground-muted max-w-lg mx-auto text-base leading-relaxed">
              {t('testimonials.subheading')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testi, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-[1.5rem] border border-border/50 bg-surface p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div>
                  <div className="mb-4 flex text-warning">
                    {[...Array(testi.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm italic leading-relaxed text-foreground-muted">
                    &ldquo;{testi.comment}&rdquo;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3 border-t border-border/30 pt-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                    {testi.initial}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{testi.name}</p>
                    <p className="text-[11px] font-semibold text-foreground-muted">{testi.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            FAQ ACCORDION
        ═══════════════════════════════════════════════════ */}
        <section id="faq" className="container-page py-16 border-t border-border/30">
          <div className="mb-10 text-center">
            <p className="mb-2 font-bold text-primary text-sm md:text-base uppercase tracking-widest">FAQ</p>
            <h2 className="mb-3 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {t('faq.heading')}
            </h2>
            <p className="text-foreground-muted max-w-lg mx-auto text-base leading-relaxed">
              {t('faq.subheading')}
            </p>
          </div>

          <div className="mx-auto max-w-3xl flex flex-col gap-3">
            {FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-[1.25rem] border border-border/50 bg-surface p-5 transition-all [&_summary::-webkit-details-marker]:hidden hover:border-primary/20"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 focus:outline-none">
                  <span className="text-sm font-bold text-foreground sm:text-base pr-4">{faq.question}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary group-open:rotate-180 transition-transform duration-300">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </summary>
                <div className="mt-4 border-t border-border/30 pt-4">
                  <p className="text-sm leading-relaxed text-foreground-muted">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            MAP / LOCATION
        ═══════════════════════════════════════════════════ */}
        <section id="lokasi" className="container-page py-16 border-t border-border/30">
          <div className="mb-10 text-center">
            <p className="mb-2 font-bold text-primary text-sm md:text-base uppercase tracking-widest">Lokasi</p>
            <h2 className="mb-3 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {t('location.heading')}
            </h2>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-border shadow-lg">
            <iframe
              src={siteConfig.company.mapEmbedUrl}
              title="Lokasi Gracianda House"
              className="h-96 w-full border-none"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-foreground-muted text-sm px-4 text-center">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span>{siteConfig.company.address}</span>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            CONTACT / CTA
        ═══════════════════════════════════════════════════ */}
        <section
          id="kontak"
          className="container-page py-20 border-t border-border/30 text-center relative"
        >
          {/* Soft bg glow */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,oklch(0.444_0.113_125.6/0.07),transparent_70%)]" />

          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle text-primary">
            <Heart className="h-7 w-7" />
          </span>
          <h2 className="mb-3 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {t('contact.heading')}
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-foreground-muted text-base leading-relaxed">
            Butuh info detail sewa harian, mingguan, atau promo terbaru? Tim kami siap melayani seluruh pertanyaan Anda dengan senang hati.
          </p>
          <a
            href={contactWaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-base px-9 py-4 rounded-full transition-all shadow-primary-glow"
          >
            {t('contact.cta')}
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}
