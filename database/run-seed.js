// Run one or more seed SQL files safely.
// Usage:
//   node database/run-seed.js
//   node database/run-seed.js --seed-file=seed.sql
//   node database/run-seed.js --env=production --confirm-production-seed --yes

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { URL } = require('url');

const backendModules = path.join(__dirname, '..', 'backend', 'node_modules');
const { Pool } = require(path.join(backendModules, 'pg'));
require(path.join(backendModules, 'dotenv')).config({ path: path.join(__dirname, '..', 'backend', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set in backend/.env');
  process.exit(1);
}

function parseArgs(argv) {
  const allowedEnvs = new Set(['development', 'staging', 'production']);
  const options = {
    env: process.env.NODE_ENV || 'development',
    yes: false,
    confirmProductionSeed: false,
    seedFiles: [],
  };

  for (const arg of argv) {
    if (arg === '--yes') {
      options.yes = true;
      continue;
    }
    if (arg === '--confirm-production-seed') {
      options.confirmProductionSeed = true;
      continue;
    }
    if (arg.startsWith('--env=')) {
      const envValue = arg.split('=')[1]?.trim();
      if (!envValue || !allowedEnvs.has(envValue)) {
        throw new Error('--env must be one of: development, staging, production');
      }
      options.env = envValue;
      continue;
    }
    if (arg.startsWith('--seed-file=')) {
      const seedFileValue = arg.split('=')[1]?.trim();
      if (seedFileValue) options.seedFiles.push(seedFileValue);
      continue;
    }
  }

  if (options.seedFiles.length === 0) {
    options.seedFiles = ['seed.sql'];
  }

  return options;
}

function parseDatabaseTarget(connectionString) {
  try {
    const parsed = new URL(connectionString);
    const database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : '(unknown)';
    return `${parsed.hostname}:${parsed.port || '5432'}/${database}`;
  } catch (_err) {
    return '(unable to parse DATABASE_URL target)';
  }
}

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function ensureSafeToSeed(options, dbTarget) {
  if (options.env === 'production' && !options.confirmProductionSeed) {
    throw new Error(
      'Refusing to seed in production without --confirm-production-seed. ' +
      'This guard protects production by default.'
    );
  }

  if (options.yes) return;

  if (options.env === 'production') {
    const answer = await askConfirmation(
      `WARNING: You are seeding PRODUCTION database (${dbTarget}). Type "seed production" to continue: `
    );
    if (answer !== 'seed production') {
      throw new Error('Aborted by user. Production seed confirmation did not match.');
    }
    return;
  }

  const answer = await askConfirmation(
    `About to run seed file(s) against ${dbTarget}. Continue? (yes/no): `
  );
  if (answer.toLowerCase() !== 'yes') {
    throw new Error('Aborted by user.');
  }
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  process.env.NODE_ENV = options.env;
  const dbTarget = parseDatabaseTarget(DATABASE_URL);
  const isProduction = options.env === 'production';

  await ensureSafeToSeed(options, dbTarget);

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: isProduction
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false },
  });

  try {
    console.log(`Environment: ${options.env}`);
    console.log(`Database target: ${dbTarget}`);
    console.log('\nConnecting to database...');
    const client = await pool.connect();
    console.log('Connected!\n');

    for (const seedFile of options.seedFiles) {
      const seedPath = path.isAbsolute(seedFile)
        ? seedFile
        : path.join(__dirname, seedFile);

      if (!fs.existsSync(seedPath)) {
        throw new Error(`Seed file not found: ${seedPath}`);
      }

      const seedSQL = fs.readFileSync(seedPath, 'utf-8');
      console.log(`Running ${path.basename(seedPath)}...`);
      await client.query(seedSQL);
    }
    console.log('Seed complete.\n');

    const settingsResult = await client.query(
      'SELECT key FROM site_settings ORDER BY key ASC'
    );
    console.log(`site_settings keys (${settingsResult.rows.length}):`);
    settingsResult.rows.forEach((r) => console.log(`  - ${r.key}`));

    const campaignsResult = await client.query(
      `SELECT name, node_set_id, skin_id, is_active, max_winners
       FROM campaigns ORDER BY created_at DESC`
    );
    console.log(`Campaigns in database (${campaignsResult.rows.length}):`);
    campaignsResult.rows.forEach((r) => {
      console.log(
        `  - [${r.is_active ? 'ACTIVE' : 'INACTIVE'}] ${r.name} (node_set: ${r.node_set_id || 'terminal-core'}, skin: ${r.skin_id || 'default'}, max: ${r.max_winners})`
      );
    });

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
