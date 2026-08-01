/**
 * Central "company brain" — single source of truth for all SEO, GEO, and LLMs.txt.
 * Edit this file first whenever you add a page or change brand/product details.
 * Every field here propagates to: metadata, sitemap, robots.txt, structured data, llms.txt.
 */

import type { MetadataRoute } from 'next';

export type SitemapChangeFreq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

export interface PageConfig {
  path: string;
  title: string;
  description: string;
  changeFreq: SitemapChangeFreq;
  priority: number;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  company: {
    legalName: string;
    foundedYear: number;
    industry: string;
    targetAudience: string;
    problemSolved: string;
    solution: string;
    keyBenefits: string[];
    contactEmail: string;
    contactPhone: string;
    whatsappNumber: string;
    address: string;
    mapEmbedUrl: string;
    socialLinks: {
      twitter?: string;
      github?: string;
      linkedin?: string;
      instagram?: string;
    };
  };
  seo: {
    titleTemplate: string;
    defaultTitle: string;
    twitterHandle?: string;
    locale: string;
  };
  pages: Record<string, PageConfig>;
}

export const siteConfig: SiteConfig = {
  // ─── Core Identity ───────────────────────────────────────────────────────────
  name: 'Gracianda House',
  tagline: 'Kost nyaman, aman, dan terkelola rapi di tengah kota.',
  description:
    'Gracianda House adalah rumah kost dengan kamar terawat, fasilitas lengkap, dan sistem sewa yang transparan — cek ketersediaan kamar dan harga langsung dari denah interaktif.',
  url: process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://graciandahouse.com',

  // ─── Brand Assets ────────────────────────────────────────────────────────────
  ogImage: '/og.png',

  // ─── Company Details (drives Organization schema + LLMs.txt) ─────────────────
  company: {
    legalName: 'Gracianda House',
    foundedYear: 2024,
    industry: 'Properti / Kost & Hunian Sewa',
    targetAudience:
      'Pekerja dan mahasiswa yang mencari kamar kost nyaman dengan proses sewa dan pembayaran yang jelas.',
    problemSolved:
      'Calon penyewa sulit mengecek ketersediaan kamar, harga, dan fasilitas kost tanpa datang langsung atau menghubungi admin satu per satu.',
    solution:
      'Gracianda House menyediakan denah kamar interaktif dengan status ketersediaan real-time, foto, harga, dan fasilitas — cukup klik kamar yang diminati lalu hubungi admin lewat WhatsApp.',
    keyBenefits: [
      'Denah kamar interaktif — lihat status kosong/terisi tiap kamar secara langsung',
      'Info lengkap per kamar: foto, harga, ukuran, dan fasilitas',
      'Hubungi admin langsung lewat WhatsApp tanpa formulir berbelit',
    ],
    contactEmail: 'admin@graciandahouse.com',
    contactPhone: '+62 812-0000-0000',
    whatsappNumber: '628120000000',
    address: 'Jl. Contoh Alamat No. 1, Kota, Indonesia',
    mapEmbedUrl: 'https://www.google.com/maps?q=Jakarta&output=embed',
    socialLinks: {
      instagram: 'https://instagram.com/graciandahouse',
    },
  },

  // ─── SEO Settings ────────────────────────────────────────────────────────────
  seo: {
    titleTemplate: '%s | Gracianda House',
    defaultTitle: 'Gracianda House — Kost Nyaman & Terkelola Rapi',
    locale: 'id_ID',
  },

  // ─── Pages Registry ──────────────────────────────────────────────────────────
  pages: {
    home: {
      path: '/',
      title: 'Gracianda House — Kost Nyaman & Terkelola Rapi',
      description:
        'Cek ketersediaan kamar kost Gracianda House lewat denah interaktif — lihat foto, harga, fasilitas, dan hubungi admin langsung via WhatsApp.',
      changeFreq: 'weekly',
      priority: 1.0,
    },
    search: {
      path: '/cari-kamar',
      title: 'Cari Kamar Kost — Gracianda House',
      description:
        'Cari kamar kost Gracianda House berdasarkan kategori hunian, tipe kamar, fasilitas, dan status ketersediaan — lihat berapa kamar yang masih kosong di tiap tipe.',
      changeFreq: 'daily',
      priority: 0.9,
    },
  },
};
