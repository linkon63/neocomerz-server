require('dotenv').config();
const { PrismaClient } = require('./generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Fetching users and their roles from database...');
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
    });

    console.log(`Total users found: ${users.length}`);
    users.forEach((user) => {
      console.log(`- [${user.id}] ${user.name} (${user.email}) -> Role: ${user.role ? user.role.name : 'No Role'} (Role ID: ${user.roleId})`);
    });

    console.log('\nFetching all roles from database...');
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
    roles.forEach((role) => {
      console.log(`- Role [${role.id}] Name: "${role.name}" (Count: ${role._count.users})`);
    });
  } catch (error) {
    console.error('Error during query:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
