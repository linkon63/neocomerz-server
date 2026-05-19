require('dotenv').config();
const pg = require('pg');

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Querying database with direct SQL via pg...');
    
    // Check roles
    console.log('\n--- ROLES ---');
    const rolesRes = await pool.query('SELECT * FROM roles');
    console.log(`Found ${rolesRes.rowCount} roles:`);
    rolesRes.rows.forEach(row => {
      console.log(`ID: ${row.id} | Name: "${row.name}"`);
    });

    // Check users
    console.log('\n--- USERS ---');
    const usersRes = await pool.query(`
      SELECT u.id, u.name, u.email, u.role_id, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id
    `);
    console.log(`Found ${usersRes.rowCount} users:`);
    usersRes.rows.forEach(row => {
      console.log(`ID: ${row.id} | Name: "${row.name}" | Email: "${row.email}" | Role ID: ${row.role_id} | Role Name: "${row.role_name}"`);
    });

  } catch (error) {
    console.error('Database connection or query error:', error);
  } finally {
    await pool.end();
  }
}

main();
