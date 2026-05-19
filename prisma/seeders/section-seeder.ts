import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const SECTIONS = [
  { title: 'Hero Banner', page: 'home', position: 1 },
  { title: 'Featured Products', page: 'home', position: 2 },
  { title: 'New Arrivals', page: 'home', position: 3 },
  { title: 'Best Sellers', page: 'home', position: 4 },
  { title: 'Flash Sale', page: 'home', position: 5 },
  { title: 'Seasonal Offer', page: 'home', position: 6 },
  { title: 'Category Spotlight', page: 'home', position: 7 },
  { title: 'Brand Showcase', page: 'home', position: 8 },
  { title: 'Products Listing Banner', page: 'products', position: 1 },
  { title: 'Sidebar Promo', page: 'products', position: 2 },
  { title: 'Cart Upsell', page: 'cart', position: 1 },
  { title: 'Checkout Promo', page: 'checkout', position: 1 },
];

export async function seedSections() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🏷️  Seeding campaign sections...');
    let created = 0;
    let skipped = 0;

    for (const s of SECTIONS) {
      const exists = await prisma.section.findFirst({
        where: { title: s.title, page: s.page },
      });

      if (exists) {
        skipped++;
      } else {
        await prisma.section.create({ data: s });
        console.log(`  ✅ Created: ${s.title} (${s.page})`);
        created++;
      }
    }

    console.log(`✅ Sections: ${created} created, ${skipped} already existed`);
    return { created, skipped };
  } catch (err) {
    console.error('❌ Section seeding failed:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (require.main === module) {
  seedSections()
    .then(() => console.log('🎉 Section seeding complete!'))
    .catch((e) => { console.error(e); process.exit(1); });
}
