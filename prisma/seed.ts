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

  // 4. Seed Facilities (icon = nama icon lucide-react, kebab-case)
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

  // 5. Seed Room Types + the rooms that belong to them
  //
  // The public catalogue is organised by type, so the seed has to produce a
  // portfolio that actually exercises it: several types, more than one unit per
  // type, one unit that overrides its type's facilities, and a couple of rooms
  // left deliberately untyped — the "Tanpa Tipe" bucket is a real state the
  // landing page has to be able to report, not an edge case.
  const facilityIdByName = new Map(
    (await prisma.facility.findMany({ select: { id: true, name: true } })).map((f) => [f.name, f.id]),
  );

  const facilityIds = (names: string[]) =>
    names.flatMap((name) => {
      const id = facilityIdByName.get(name);
      if (!id) throw new Error(`Fasilitas belum di-seed: ${name}`);
      return [id];
    });

  let floor3 = await prisma.floor.findFirst({
    where: { name: 'Lantai 3', propertyId: property.id },
  });
  if (!floor3) {
    floor3 = await prisma.floor.create({
      data: { name: 'Lantai 3', order: 3, propertyId: property.id },
    });
  }

  const roomTypesToSeed = [
    {
      name: 'Standar',
      description:
        'Kamar hemat dengan kipas angin dan kamar mandi luar. Cocok untuk mahasiswa yang lebih banyak di luar kamar.',
      lengthM: 3,
      widthM: 3,
      price: 1300000,
      facilities: ['Kipas Angin', 'Jendela', 'Kasur Single', 'Lemari Pakaian', 'Meja Belajar', 'Kunci Kamar Pribadi'],
      prices: [
        { billingCycle: 'MONTHLY' as const, interval: 1, price: 1300000 },
        { billingCycle: 'MONTHLY' as const, interval: 3, price: 3750000 },
      ],
    },
    {
      name: 'Deluxe',
      description:
        'Kamar ber-AC dengan kamar mandi dalam dan meja kerja — pilihan paling banyak diambil karyawan.',
      lengthM: 3,
      widthM: 4,
      price: 1750000,
      facilities: [
        'AC',
        'Kasur Spring Bed',
        'Lemari Pakaian',
        'Meja Belajar',
        'Kursi',
        'Kamar Mandi Dalam',
        'Shower',
        'WiFi Kamar',
      ],
      prices: [
        { billingCycle: 'MONTHLY' as const, interval: 1, price: 1750000 },
        { billingCycle: 'MONTHLY' as const, interval: 3, price: 5000000 },
        { billingCycle: 'YEARLY' as const, interval: 1, price: 19000000 },
      ],
    },
    {
      name: 'Studio Premium',
      description:
        'Unit terluas dengan balkon pribadi, water heater, dan kulkas. Dirancang untuk penghuni yang bekerja dari kamar.',
      lengthM: 4,
      widthM: 5,
      price: 2400000,
      facilities: [
        'AC',
        'Kasur Spring Bed',
        'Lemari Pakaian',
        'Meja Belajar',
        'Kursi',
        'TV',
        'Kulkas Pribadi',
        'Kamar Mandi Dalam',
        'Water Heater',
        'Balkon Pribadi',
        'WiFi Kamar',
      ],
      prices: [
        { billingCycle: 'MONTHLY' as const, interval: 1, price: 2400000 },
        { billingCycle: 'MONTHLY' as const, interval: 6, price: 13500000 },
        { billingCycle: 'YEARLY' as const, interval: 1, price: 26000000 },
      ],
    },
  ];

  const roomTypeIdByName = new Map<string, string>();

  for (const typeData of roomTypesToSeed) {
    const { facilities, prices, ...fields } = typeData;

    const roomType = await prisma.roomType.upsert({
      where: { propertyId_name: { propertyId: property.id, name: fields.name } },
      update: fields,
      create: { ...fields, propertyId: property.id },
    });

    // Replace-then-write, same shape as roomTypeService.update() — re-running
    // the seed must converge, not accumulate duplicate rows.
    await prisma.roomTypeFacility.deleteMany({ where: { roomTypeId: roomType.id } });
    await prisma.roomTypeFacility.createMany({
      data: facilityIds(facilities).map((facilityId) => ({ roomTypeId: roomType.id, facilityId })),
    });

    await prisma.roomTypePrice.deleteMany({ where: { roomTypeId: roomType.id } });
    await prisma.roomTypePrice.createMany({
      data: prices.map((price) => ({ ...price, roomTypeId: roomType.id })),
    });

    roomTypeIdByName.set(roomType.name, roomType.id);
  }

  console.log(`Seeded RoomTypes: ${roomTypesToSeed.map((t) => t.name).join(', ')}`);

  // `typeName: null` = deliberately left out of every type, so the public
  // "Tanpa Tipe" bucket has something to report. `tiers` are the room's OWN
  // packages — Room.price / RoomPrice stay authoritative for billing, the type
  // above only supplies defaults.
  const roomsToSeed = [
    {
      number: '101',
      floorId: floor1.id,
      typeName: 'Standar',
      price: 1300000,
      lengthM: 3,
      widthM: 3,
      description: null,
      tiers: [],
    },
    {
      number: '102',
      floorId: floor1.id,
      typeName: 'Standar',
      price: 1300000,
      lengthM: 3,
      widthM: 3,
      description: null,
      tiers: [],
    },
    {
      number: '103',
      floorId: floor1.id,
      typeName: 'Deluxe',
      price: 1750000,
      lengthM: 3,
      widthM: 4,
      description: null,
      tiers: [],
    },
    {
      number: '104',
      floorId: floor1.id,
      typeName: 'Deluxe',
      price: 1800000,
      lengthM: 3,
      widthM: 4,
      description: 'Deluxe pojok dengan TV tambahan dan jendela menghadap taman.',
      tiers: [],
    },
    {
      number: '105',
      floorId: floor1.id,
      typeName: null,
      price: 1400000,
      lengthM: 3,
      widthM: 3,
      description: 'Kamar sisa konversi gudang — belum dikelompokkan ke tipe mana pun.',
      tiers: [],
    },
    {
      number: '201',
      floorId: floor2.id,
      typeName: 'Deluxe',
      price: 1750000,
      lengthM: 3,
      widthM: 4,
      description: 'Kamar studio deluxe lantai 2 dengan kamar mandi dalam.',
      // The only unit with short-stay packages — proves the public page reads
      // per-room tiers, not the type's.
      tiers: [
        { billingCycle: 'DAILY' as const, interval: 1, price: 150000 },
        { billingCycle: 'WEEKLY' as const, interval: 1, price: 900000 },
        { billingCycle: 'MONTHLY' as const, interval: 3, price: 5000000 },
      ],
    },
    {
      number: '202',
      floorId: floor2.id,
      typeName: 'Deluxe',
      price: 1750000,
      lengthM: 3,
      widthM: 4,
      description: null,
      tiers: [],
    },
    {
      number: '203',
      floorId: floor2.id,
      typeName: 'Studio Premium',
      price: 2400000,
      lengthM: 4,
      widthM: 5,
      description: null,
      tiers: [],
    },
    {
      number: '301',
      floorId: floor3.id,
      typeName: 'Studio Premium',
      price: 2500000,
      lengthM: 4,
      widthM: 5,
      description: 'Unit sudut lantai 3, balkon menghadap timur.',
      tiers: [{ billingCycle: 'YEARLY' as const, interval: 1, price: 27000000 }],
    },
    {
      number: '302',
      floorId: floor3.id,
      typeName: null,
      price: 2200000,
      lengthM: 4,
      widthM: 4,
      description: 'Bekas unit pengelola, disewakan tanpa tipe baku.',
      tiers: [],
    },
  ];

  for (const roomData of roomsToSeed) {
    const { typeName, tiers, ...fields } = roomData;
    const roomTypeId = typeName ? (roomTypeIdByName.get(typeName) ?? null) : null;
    const data = { ...fields, roomTypeId, isActive: true };

    // The seed owns these demo units outright: re-running it converges them to
    // the state above rather than leaving half-edited leftovers behind.
    const room = await prisma.room.upsert({
      where: { propertyId_number: { propertyId: property.id, number: fields.number } },
      update: data,
      create: { ...data, propertyId: property.id },
    });

    const allTiers = [
      { billingCycle: 'MONTHLY' as const, interval: 1, price: fields.price },
      ...tiers,
    ];

    for (const tier of allTiers) {
      await prisma.roomPrice.upsert({
        where: {
          roomId_billingCycle_interval: {
            roomId: room.id,
            billingCycle: tier.billingCycle,
            interval: tier.interval,
          },
        },
        update: { price: tier.price, isActive: true },
        create: { roomId: room.id, ...tier },
      });
    }
  }

  // One unit that overrides its type: 104 carries its own facility list (the
  // Deluxe set plus a TV). Everything else inherits, which is what makes the
  // room-overrides-type rule visible on the public pages.
  const room104 = await prisma.room.findUnique({
    where: { propertyId_number: { propertyId: property.id, number: '104' } },
  });
  if (room104) {
    await prisma.roomFacility.deleteMany({ where: { roomId: room104.id } });
    await prisma.roomFacility.createMany({
      data: facilityIds([
        'AC',
        'Kasur Spring Bed',
        'Lemari Pakaian',
        'Meja Belajar',
        'Kursi',
        'Kamar Mandi Dalam',
        'Shower',
        'WiFi Kamar',
        'TV',
      ]).map((facilityId) => ({ roomId: room104.id, facilityId })),
    });
  }

  console.log(`Seeded Rooms: ${roomsToSeed.length} (2 sengaja tanpa tipe)`);

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
