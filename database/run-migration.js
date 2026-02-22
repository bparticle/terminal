// Quick script to run migrations and seed against your database
// Usage: node database/run-migration.js

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

  const specificFile = process.argv[2];

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected!\n');

    const migrationsDir = path.join(__dirname, 'migrations');

    if (specificFile) {
      // Run a specific migration file
      const filePath = path.isAbsolute(specificFile)
        ? specificFile
        : path.join(migrationsDir, specificFile);
      const fileName = path.basename(filePath);
      console.log(`--- Running ${fileName} ---`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      console.log('Done.\n');
    } else {
      // Run all migrations in order
      const files = fs.readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        console.log(`--- Running ${file} ---`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await client.query(sql);
        console.log('Done.');
      }
      console.log();

      // Run seed
      const seedPath = path.join(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        console.log('--- Running seed.sql ---');
        const seedSQL = fs.readFileSync(seedPath, 'utf-8');
        await client.query(seedSQL);
        console.log('Done.\n');
      }
    }

    // Verify
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tables in database:');
    tables.rows.forEach((r) => console.log(`  - ${r.table_name}`));

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
