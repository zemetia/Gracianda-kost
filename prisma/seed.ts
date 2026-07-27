import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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
      sizeSqm: 12.5,
      description: 'Kamar standar lantai 1 dengan AC.',
      isActive: true,
    },
    {
      number: '102',
      propertyId: property.id,
      floorId: floor1.id,
      price: 1500000,
      sizeSqm: 12.5,
      description: 'Kamar standar lantai 1 dengan AC.',
      isActive: true,
    },
    {
      number: '201',
      propertyId: property.id,
      floorId: floor2.id,
      price: 1750000,
      sizeSqm: 15,
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
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
