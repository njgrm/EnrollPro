import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Ensure school settings row exists
  const existing = await prisma.schoolSettings.findFirst();
  if (!existing) {
    await prisma.schoolSettings.create({ data: {} });
    console.log('Created default SchoolSettings row.');
  } else {
    console.log('SchoolSettings already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
