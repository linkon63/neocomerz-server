import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // Delete items that depend on categories
    await prisma.productChannel.deleteMany({});
    await prisma.discountProduct.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.wishlist.deleteMany({});
    
    // Delete variants and associated data
    await prisma.inventoryLog.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.variantMedia.deleteMany({});
    await prisma.productVariantAttribute.deleteMany({});
    await prisma.productVariant.deleteMany({});
    
    // Delete product media and images
    await prisma.productMedia.deleteMany({});
    await prisma.productImage.deleteMany({});
    
    // Finally delete products
    await prisma.product.deleteMany({});
    
    // Then delete categories
    const result = await prisma.category.deleteMany({});
    console.log(`Successfully deleted ${result.count} categories.`);
  } catch (error) {
    console.error("Error deleting categories:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
