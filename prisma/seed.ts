import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@graciandahouse.com';
  const password = process.env['SEED_ADMIN_PASSWORD'] ?? 'ChangeMe123!';

  const hashed = await bcrypt.hash(password, 12);

  // 1. Seed SUPER_ADMIN
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Super Admin',
      password: hashed,
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`Seeded SUPER_ADMIN: ${email}`);

  // 2. Seed Default Property
  const property = await prisma.property.upsert({
    where: { name: 'Gracianda House' },
    update: {},
    create: {
      name: 'Gracianda House',
      code: 'GH',
      type: 'KOST',
      address: 'Jl. Margonda Raya No. 100, Depok',
      description: 'Hunian kost eksklusif dan nyaman di pusat kota Depok.',
      isActive: true,
    },
  });

  console.log(`Seeded Property: ${property.name} (${property.code})`);

  // 3. Seed Floors
  let floor1 = await prisma.floor.findFirst({
    where: { name: 'Lantai 1', propertyId: property.id },
  });
  if (!floor1) {
    floor1 = await prisma.floor.create({
      data: { name: 'Lantai 1', order: 1, propertyId: property.id },
    });
  }

  let floor2 = await prisma.floor.findFirst({
    where: { name: 'Lantai 2', propertyId: property.id },
  });
  if (!floor2) {
    floor2 = await prisma.floor.create({
      data: { name: 'Lantai 2', order: 2, propertyId: property.id },
    });
  }

  console.log('Seeded/Fetched Floors: Lantai 1, Lantai 2');

  // 4. Seed Rooms
  const roomsToSeed = [
    {
      number: '101',
      propertyId: property.id,
      floorId: floor1.id,
      price: 1500000,
      lengthM: 3,
      widthM: 4,
      description: 'Kamar standar lantai 1 dengan AC.',
      isActive: true,
    },
    {
      number: '102',
      propertyId: property.id,
      floorId: floor1.id,
      price: 1500000,
      lengthM: 3,
      widthM: 4,
      description: 'Kamar standar lantai 1 dengan AC.',
      isActive: true,
    },
    {
      number: '201',
      propertyId: property.id,
      floorId: floor2.id,
      price: 1750000,
      lengthM: 3,
      widthM: 5,
      description: 'Kamar studio deluxe lantai 2 dengan kamar mandi dalam.',
      isActive: true,
    },
  ];

  for (const roomData of roomsToSeed) {
    const room = await prisma.room.upsert({
      where: {
        propertyId_number: {
          propertyId: roomData.propertyId,
          number: roomData.number,
        },
      },
      update: {},
      create: roomData,
    });

    // Seed default monthly price
    await prisma.roomPrice.upsert({
      where: {
        roomId_billingCycle_interval: {
          roomId: room.id,
          billingCycle: 'MONTHLY',
          interval: 1,
        },
      },
      update: {
        price: roomData.price,
      },
      create: {
        roomId: room.id,
        billingCycle: 'MONTHLY',
        interval: 1,
        price: roomData.price,
      },
    });

    // Add extra price options for Room 201 to test daily/weekly/etc.
    if (roomData.number === '201') {
      const extraPrices = [
        { billingCycle: 'DAILY' as const, interval: 1, price: 150000 },
        { billingCycle: 'WEEKLY' as const, interval: 1, price: 900000 },
        { billingCycle: 'MONTHLY' as const, interval: 3, price: 5000000 }, // 3 bulanan
      ];
      for (const ep of extraPrices) {
        await prisma.roomPrice.upsert({
          where: {
            roomId_billingCycle_interval: {
              roomId: room.id,
              billingCycle: ep.billingCycle,
              interval: ep.interval,
            },
          },
          update: {
            price: ep.price,
          },
          create: {
            roomId: room.id,
            billingCycle: ep.billingCycle,
            interval: ep.interval,
            price: ep.price,
          },
        });
      }
    }
  }

  console.log('Seeded Rooms and RoomPrices: 101, 102, 201');

  // 5. Seed Facilities (icon = nama icon lucide-react, kebab-case)
  const facilitiesToSeed: {
    name: string;
    icon: string;
    category: 'COMMON' | 'ROOM';
  }[] = [
    // --- Fasilitas Umum ---
    { name: 'WiFi Area Bersama', icon: 'wifi', category: 'COMMON' },
    { name: 'CCTV 24 Jam', icon: 'cctv', category: 'COMMON' },
    { name: 'Keamanan 24 Jam', icon: 'shield-check', category: 'COMMON' },
    { name: 'Akses Kartu Kunci', icon: 'key-round', category: 'COMMON' },
    { name: 'Akses Masuk 24 Jam', icon: 'clock', category: 'COMMON' },
    { name: 'Parkir Motor', icon: 'motorbike', category: 'COMMON' },
    { name: 'Parkir Mobil', icon: 'car', category: 'COMMON' },
    { name: 'Dapur Bersama', icon: 'cooking-pot', category: 'COMMON' },
    { name: 'Microwave Bersama', icon: 'microwave', category: 'COMMON' },
    { name: 'Kulkas Bersama', icon: 'refrigerator', category: 'COMMON' },
    { name: 'Dispenser Air Minum', icon: 'glass-water', category: 'COMMON' },
    { name: 'Ruang Tamu', icon: 'sofa', category: 'COMMON' },
    { name: 'Ruang Kerja Bersama', icon: 'laptop', category: 'COMMON' },
    { name: 'Mesin Cuci', icon: 'washing-machine', category: 'COMMON' },
    { name: 'Area Jemur', icon: 'sun', category: 'COMMON' },
    { name: 'Kamar Mandi Bersama', icon: 'bath', category: 'COMMON' },
    { name: 'Air Panas Bersama', icon: 'shower-head', category: 'COMMON' },
    { name: 'Musholla', icon: 'moon-star', category: 'COMMON' },
    { name: 'Rooftop', icon: 'building', category: 'COMMON' },
    { name: 'Taman', icon: 'trees', category: 'COMMON' },
    { name: 'Kantin', icon: 'store', category: 'COMMON' },
    { name: 'Gym', icon: 'dumbbell', category: 'COMMON' },
    { name: 'Kolam Renang', icon: 'waves', category: 'COMMON' },
    { name: 'Petugas Kebersihan', icon: 'brush-cleaning', category: 'COMMON' },
    { name: 'Tempat Sampah Terpilah', icon: 'trash-2', category: 'COMMON' },
    { name: 'Alat Pemadam Api (APAR)', icon: 'fire-extinguisher', category: 'COMMON' },
    { name: 'Kotak P3K', icon: 'briefcase-medical', category: 'COMMON' },
    { name: 'Genset Cadangan', icon: 'plug-zap', category: 'COMMON' },
    { name: 'Loker Paket & Surat', icon: 'mailbox', category: 'COMMON' },
    { name: 'Area Merokok', icon: 'cigarette', category: 'COMMON' },
    { name: 'Air PDAM 24 Jam', icon: 'droplets', category: 'COMMON' },

    // --- Fasilitas Kamar ---
    { name: 'AC', icon: 'snowflake', category: 'ROOM' },
    { name: 'Kipas Angin', icon: 'fan', category: 'ROOM' },
    { name: 'Exhaust Fan', icon: 'air-vent', category: 'ROOM' },
    { name: 'Jendela', icon: 'app-window', category: 'ROOM' },
    { name: 'Gorden', icon: 'blinds', category: 'ROOM' },
    { name: 'Kasur Spring Bed', icon: 'bed-double', category: 'ROOM' },
    { name: 'Kasur Single', icon: 'bed-single', category: 'ROOM' },
    { name: 'Bantal & Guling', icon: 'bed', category: 'ROOM' },
    { name: 'Sprei & Bed Cover', icon: 'layers', category: 'ROOM' },
    { name: 'Lemari Pakaian', icon: 'shirt', category: 'ROOM' },
    { name: 'Meja Belajar', icon: 'lamp-desk', category: 'ROOM' },
    { name: 'Kursi', icon: 'armchair', category: 'ROOM' },
    { name: 'Rak Dinding', icon: 'rows-3', category: 'ROOM' },
    { name: 'Cermin', icon: 'frame', category: 'ROOM' },
    { name: 'Lampu Belajar', icon: 'lamp', category: 'ROOM' },
    { name: 'TV', icon: 'tv', category: 'ROOM' },
    { name: 'Kulkas Pribadi', icon: 'refrigerator', category: 'ROOM' },
    { name: 'Kamar Mandi Dalam', icon: 'bath', category: 'ROOM' },
    { name: 'Kloset Duduk', icon: 'toilet', category: 'ROOM' },
    { name: 'Shower', icon: 'shower-head', category: 'ROOM' },
    { name: 'Water Heater', icon: 'heater', category: 'ROOM' },
    { name: 'Wastafel', icon: 'droplet', category: 'ROOM' },
    { name: 'WiFi Kamar', icon: 'router', category: 'ROOM' },
    { name: 'Stop Kontak Tambahan', icon: 'plug', category: 'ROOM' },
    { name: 'Balkon Pribadi', icon: 'fence', category: 'ROOM' },
    { name: 'Kunci Kamar Pribadi', icon: 'lock-keyhole', category: 'ROOM' },
  ];

  for (const facility of facilitiesToSeed) {
    await prisma.facility.upsert({
      where: { name: facility.name },
      update: { icon: facility.icon, category: facility.category },
      create: facility,
    });
  }

  console.log(`Seeded Facilities: ${facilitiesToSeed.length}`);

  // N. Seed default Payment Method — bank/e-wallet ditambahkan pemilik sendiri lewat UI
  await prisma.paymentMethod.upsert({
    where: { name: 'Tunai' },
    update: {},
    create: { name: 'Tunai', type: 'CASH' },
  });

  console.log('Seeded PaymentMethod: Tunai');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
