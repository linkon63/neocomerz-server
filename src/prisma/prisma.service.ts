import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    await this.seedSections();
  }

  private async seedSections() {
    try {
      const count = await this.section.count();
      if (count === 0) {
        console.log('🌱 [PrismaService] No campaign sections found. Seeding default sections...');
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
        for (const s of SECTIONS) {
          await this.section.create({ data: s });
        }
        console.log(`✅ [PrismaService] Successfully seeded ${SECTIONS.length} campaign sections.`);
      }
    } catch (error) {
      console.error('❌ [PrismaService] Failed to seed campaign sections:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
