// Quick script to run migrations and seed against your database
// Usage: node database/run-migration.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env from root
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set in .env');
  process.exit(1);
}

async function run() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected!\n');

    // Run migration
    console.log('--- Running migration 001_initial_schema.sql ---');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_initial_schema.sql'),
      'utf-8'
    );
    await client.query(migrationSQL);
    console.log('Migration complete.\n');

    // Run seed
    console.log('--- Running seed.sql ---');
    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'seed.sql'),
      'utf-8'
    );
    await client.query(seedSQL);
    console.log('Seed complete.\n');

    // Verify
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tables created:');
    tables.rows.forEach((r) => console.log(`  - ${r.table_name}`));

    const campaigns = await client.query('SELECT id, name, target_states FROM campaigns');
    console.log('\nSeeded campaigns:');
    campaigns.rows.forEach((r) =>
      console.log(`  - ${r.name} (targets: ${r.target_states.join(', ')})`)
    );

    client.release();
    console.log('\nAll done!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
