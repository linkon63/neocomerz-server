import { PrismaClient } from './src/generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/neocomerz',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixAdminRole() {
  try {
    console.log('🔧 Fixing admin role...');

    // Ensure admin role exists
    let adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({ data: { name: 'admin' } });
      console.log('✅ Created admin role');
    } else {
      console.log('ℹ️  Admin role exists:', adminRole.id);
    }

    const email = 'david.brown@example.com';
    const hashedPassword = await bcrypt.hash('password123', 10);

    const existing = await prisma.user.findUnique({ 
      where: { email },
      include: { role: true }
    });

    if (existing) {
      console.log('📋 Current user state:', {
        email: existing.email,
        roleId: existing.roleId,
        roleName: existing.role?.name
      });

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

    // Verify the fix
    const updated = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });
    console.log('✅ Verified user state:', {
      email: updated.email,
      roleId: updated.roleId,
      roleName: updated.role?.name
    });

    console.log('\n🔑 Login: david.brown@example.com / password123');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

fixAdminRole();
