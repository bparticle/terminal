// Run just the seed.sql against the database (safe to run multiple times
// if the seed uses INSERT ... ON CONFLICT or separate campaign names).
//
// Usage: node database/run-seed.js

const fs = require('fs');
const path = require('path');

const backendModules = path.join(__dirname, '..', 'backend', 'node_modules');
const { Pool } = require(path.join(backendModules, 'pg'));
require(path.join(backendModules, 'dotenv')).config({ path: path.join(__dirname, '..', '.env') });

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

    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'seed.sql'),
      'utf-8'
    );

    console.log('Running seed.sql...');
    await client.query(seedSQL);
    console.log('Seed complete.\n');

    const campaigns = await client.query(
      'SELECT id, name, is_active, max_winners, target_states, expires_at FROM campaigns ORDER BY created_at DESC'
    );
    console.log(`Campaigns in database (${campaigns.rows.length}):`);
    campaigns.rows.forEach((r) =>
      console.log(`  - [${r.is_active ? 'ACTIVE' : 'INACTIVE'}] ${r.name} (max: ${r.max_winners}, targets: ${r.target_states.join(', ')}, expires: ${r.expires_at || 'never'})`)
    );

    client.release();
    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
