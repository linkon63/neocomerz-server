import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const ORDER_PREFIX = 'SEED-';
const DAYS_BACK = 60;

// Caps/hats catalogue matching the storefront niche.
const SEED_PRODUCTS = [
  { name: 'Classic Trucker Cap', price: 899, cost: 420, stock: 120 },
  { name: 'Vintage Dad Cap', price: 1299, cost: 560, stock: 8 }, // intentionally low stock
  { name: 'Snapback Pro Cap', price: 1599, cost: 700, stock: 64 },
  { name: 'Bucket Hat Premium', price: 1199, cost: 540, stock: 5 }, // intentionally low stock
  { name: '5-Panel Camp Cap', price: 1399, cost: 610, stock: 90 },
  { name: 'Beanie Wool Blend', price: 999, cost: 450, stock: 150 },
];

const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Choose a realistic (status, paymentStatus) pair so the dashboard shows a
 * believable mix — most orders delivered & paid, a tail of pending/cancelled.
 */
function pickLifecycle(): { status: OrderStatus; paymentStatus: 'unpaid' | 'paid' | 'refunded' } {
  const roll = rand(1, 100);
  if (roll <= 55) return { status: 'delivered', paymentStatus: 'paid' };
  if (roll <= 70) return { status: 'shipped', paymentStatus: 'paid' };
  if (roll <= 80) return { status: 'processing', paymentStatus: 'paid' };
  if (roll <= 90) return { status: 'pending', paymentStatus: 'unpaid' };
  if (roll <= 96) return { status: 'cancelled', paymentStatus: 'unpaid' };
  return { status: 'returned', paymentStatus: 'refunded' };
}

export async function seedOrders() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Reset previously seeded orders (idempotent re-runs) ------------------
    const existing = await prisma.order.findMany({
      where: { orderNumber: { startsWith: ORDER_PREFIX } },
      select: { id: true },
    });
    const existingIds = existing.map((o) => o.id);
    if (existingIds.length) {
      await prisma.payment.deleteMany({ where: { orderId: { in: existingIds } } });
      await prisma.orderStatusLog.deleteMany({ where: { orderId: { in: existingIds } } });
      await prisma.orderItem.deleteMany({ where: { orderId: { in: existingIds } } });
      await prisma.order.deleteMany({ where: { id: { in: existingIds } } });
    }

    // 2. Ensure supporting catalogue (brand, category, unit, products) --------
    const brand =
      (await prisma.brand.findFirst()) ??
      (await prisma.brand.create({ data: { name: 'NeoComerz', slug: 'neocomerz' } }));

    const category = await prisma.category.findFirst({ where: { parentId: { not: null } } });
    const anyCategory = category ?? (await prisma.category.findFirst());
    if (!anyCategory) throw new Error('No categories found — run category seeder first.');

    const unit =
      (await prisma.unit.findFirst()) ??
      (await prisma.unit.create({ data: { name: 'Piece', code: 'pcs' } }));

    // Create the seed products/variants only if they don't already exist.
    const variants: { id: string; price: number }[] = [];
    for (const p of SEED_PRODUCTS) {
      const slug = slugify(p.name);
      let product = await prisma.product.findUnique({
        where: { slug },
        include: { variants: true },
      });
      if (!product) {
        product = await prisma.product.create({
          data: {
            name: p.name,
            slug,
            description: `${p.name} — seeded sample product.`,
            status: 'active',
            brandId: brand.id,
            categoryId: anyCategory.id,
            unitId: unit.id,
            variants: {
              create: {
                sku: `${slug.toUpperCase().replace(/-/g, '').slice(0, 8)}-${rand(100, 999)}`,
                price: p.price,
                cost: p.cost,
                stockQuantity: p.stock,
                stockAlertThreshold: 10,
                isDefault: true,
              },
            },
          },
          include: { variants: true },
        });
      }
      const variant = product.variants[0];
      if (variant) variants.push({ id: variant.id, price: Number(variant.price) });
    }
    // Fold in any other pre-existing variants so top-products is varied.
    const otherVariants = await prisma.productVariant.findMany({
      where: { id: { notIn: variants.map((v) => v.id) } },
      select: { id: true, price: true },
      take: 10,
    });
    for (const v of otherVariants) variants.push({ id: v.id, price: Number(v.price) });
    if (variants.length === 0) throw new Error('No product variants available to build orders.');

    // 3. Ensure every non-admin user has an address --------------------------
    const users = await prisma.user.findMany({
      where: { role: { name: { not: 'admin' } } },
      include: { addresses: true },
    });
    if (users.length === 0) throw new Error('No customers found — run user seeder first.');

    const cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Khulna', 'Rajshahi'];
    const userAddress = new Map<string, string>();
    for (const u of users) {
      let address = u.addresses[0];
      if (!address) {
        const city = pick(cities);
        address = await prisma.address.create({
          data: {
            userId: u.id,
            fullName: u.name,
            phone: u.phone ?? `01${rand(300000000, 999999999)}`,
            addressLine1: `House ${rand(1, 99)}, Road ${rand(1, 30)}`,
            city,
            state: city,
            postalCode: `${rand(1000, 9999)}`,
            country: 'Bangladesh',
            isDefault: true,
          },
        });
      }
      userAddress.set(u.id, address.id);
    }

    // 4. Generate orders spread across the last DAYS_BACK days ----------------
    let created = 0;
    let paidCount = 0;
    const now = Date.now();

    for (let day = DAYS_BACK; day >= 0; day--) {
      const ordersToday = rand(0, 4);
      for (let n = 0; n < ordersToday; n++) {
        const user = pick(users);
        const addressId = userAddress.get(user.id)!;
        const placedAt = new Date(now - day * 86400000);
        placedAt.setHours(rand(8, 21), rand(0, 59), rand(0, 59), 0);

        const lineCount = rand(1, 3);
        const chosen = Array.from({ length: lineCount }, () => pick(variants));
        let subtotal = 0;
        const items = chosen.map((v) => {
          const quantity = rand(1, 4);
          const totalPrice = v.price * quantity;
          subtotal += totalPrice;
          return { variantId: v.id, quantity, unitPrice: v.price, totalPrice };
        });

        const shippingCost = 60;
        const discount = rand(1, 100) <= 25 ? Math.round(subtotal * 0.1) : 0;
        const total = subtotal - discount + shippingCost;
        const { status, paymentStatus } = pickLifecycle();

        const variantRows = await prisma.productVariant.findMany({
          where: { id: { in: items.map((i) => i.variantId) } },
          select: { id: true, productId: true },
        });
        const productOf = new Map(variantRows.map((r) => [r.id, r.productId]));

        await prisma.order.create({
          data: {
            orderNumber: `${ORDER_PREFIX}${placedAt.getTime()}-${rand(100, 999)}`,
            userId: user.id,
            addressId,
            status,
            paymentStatus,
            total,
            discount,
            shippingCost,
            placedAt,
            items: {
              create: items.map((i) => ({
                productId: productOf.get(i.variantId)!,
                variantId: i.variantId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                totalPrice: i.totalPrice,
              })),
            },
            statusLogs: {
              create: { status, note: 'Seeded order', createdAt: placedAt },
            },
            ...(paymentStatus !== 'unpaid'
              ? {
                  payments: {
                    create: {
                      amount: total,
                      method: pick(['card', 'bkash', 'cod', 'nagad']),
                      transactionId: `TXN-${rand(100000, 999999)}`,
                      status: 'success',
                      paidAt: placedAt,
                    },
                  },
                }
              : {}),
          },
        });

        created++;
        if (paymentStatus === 'paid') paidCount++;
      }
    }

    return { created, paidCount, products: SEED_PRODUCTS.length, customers: users.length };
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedOrders()
    .then((result) => {
      console.log('\n📦 Order Seeding Summary:');
      console.log(`   Orders created: ${result.created} (${result.paidCount} paid)`);
      console.log(`   Seed products: ${result.products}`);
      console.log(`   Customers used: ${result.customers}`);
      console.log('\n🎊 Order seeding completed successfully!');
    })
    .catch((error) => {
      console.error('💥 Order seeding failed:', error);
      process.exit(1);
    });
}
