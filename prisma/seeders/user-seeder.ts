import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    role: 'user',
    bio: 'Tech enthusiast and early adopter of new gadgets.'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1234567891',
    role: 'user',
    bio: 'Professional photographer with a passion for camera equipment.'
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    phone: '+1234567892',
    role: 'user',
    bio: 'Gaming enthusiast and PC builder.'
  },
  {
    name: 'Sarah Williams',
    email: 'sarah.williams@example.com',
    phone: '+1234567893',
    role: 'user',
    bio: 'Smart home automation expert.'
  },
  {
    name: 'David Brown',
    email: 'david.brown@example.com',
    phone: '+1234567894',
    role: 'admin',
    bio: 'System administrator and tech support specialist.'
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+1234567895',
    role: 'user',
    bio: 'Audio engineer and music producer.'
  },
  {
    name: 'Chris Wilson',
    email: 'chris.wilson@example.com',
    phone: '+1234567896',
    role: 'user',
    bio: 'Mobile app developer and smartphone reviewer.'
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    phone: '+1234567897',
    role: 'user',
    bio: 'Digital artist and content creator.'
  },
  {
    name: 'Tom Martinez',
    email: 'tom.martinez@example.com',
    phone: '+1234567898',
    role: 'user',
    bio: 'Fitness tech enthusiast and health tracker.'
  },
  {
    name: 'Rachel Taylor',
    email: 'rachel.taylor@example.com',
    phone: '+1234567899',
    role: 'moderator',
    bio: 'Community manager and customer support lead.'
  }
];

export async function seedUsers() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🌱 Starting user seeding...');

    // First, ensure roles exist
    console.log('📋 Creating roles...');
    const roles = ['user', 'admin', 'moderator'];
    const createdRoles = new Map<string, string>();

    for (const roleName of roles) {
      let role = await prisma.role.findFirst({
        where: { name: roleName }
      });

      if (!role) {
        role = await prisma.role.create({
          data: { name: roleName }
        });
        console.log(`✅ Created role: ${roleName}`);
      } else {
        console.log(`ℹ️  Role already exists: ${roleName}`);
      }

      createdRoles.set(roleName, role.id);
    }

    // Create users
    const createdUsers: any[] = [];
    for (const userData of sampleUsers) {
      console.log(`👤 Upserting user: ${userData.name}`);

      // Hash password (using a default password for all seed users)
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
        include: { profile: true, role: true }
      });

      if (existingUser) {
        console.log(`ℹ️  User already exists: ${userData.name} (${userData.email})`);
        createdUsers.push(existingUser);
        continue;
      }

      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone,
          emailVerifiedAt: new Date(), // Auto-verify for seed users
          role: {
            connect: { id: createdRoles.get(userData.role)! }
          },
          profile: {
            create: {
              bio: userData.bio
            }
          }
        },
        include: {
          profile: true,
          role: true
        }
      });

      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    console.log(`🎉 Successfully created ${createdUsers.length} users`);
    console.log(`📊 User breakdown:`);

    const roleCounts = createdUsers.reduce((acc, user) => {
      const roleName = user.role?.name || 'unknown';
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

    return {
      totalUsers: createdUsers.length,
      roleCounts,
      users: createdUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role?.name
      }))
    };

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedUsers()
    .then((result) => {
      console.log('\n📈 User Seeding Summary:');
      console.log(`   Total Users: ${result.totalUsers}`);
      console.log('   Role Distribution:');
      Object.entries(result.roleCounts).forEach(([role, count]) => {
        console.log(`     ${role}: ${count}`);
      });
      console.log('\n🎊 User seeding completed successfully!');
      console.log('\n🔑 Default password for all seed users: password123');
    })
    .catch((error) => {
      console.error('💥 User seeding failed:', error);
      process.exit(1);
    });
}
