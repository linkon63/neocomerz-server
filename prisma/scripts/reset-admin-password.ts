/**
 * One-off script: ensures david.brown@example.com exists with role=admin
 * and password=password123 (bcrypt-hashed).
 *
 * Run: npx ts-node -r tsconfig-paths/register prisma/scripts/reset-admin-password.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
// Load .env.local first (takes precedence), then fall back to .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  try {
    // Ensure admin role exists
    let adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({ data: { name: 'admin' } });
      console.log('✅ Created admin role');
    } else {
      console.log('ℹ️  Admin role already exists');
    }

    const email = 'david.brown@example.com';
    const hashedPassword = await bcrypt.hash('password123', 10);

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          roleId: adminRole.id,
        },
      });
      console.log(`✅ Updated password + role for ${email}`);
    } else {
      await prisma.user.create({
        data: {
          name: 'David Brown',
          email,
          password: hashedPassword,
          phone: '+1234567894',
          emailVerifiedAt: new Date(),
          roleId: adminRole.id,
        },
      });
      console.log(`✅ Created admin user ${email}`);
    }

    console.log('\n🔑 Login: david.brown@example.com / password123');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
