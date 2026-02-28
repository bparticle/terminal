// Run database migrations (and optional seed files) safely.
// Usage:
//   node database/run-migration.js
//   node database/run-migration.js --seed
//   node database/run-migration.js --env=production --seed --confirm-production-seed --yes
//   node database/run-migration.js --file=013_add_site_settings.sql

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
    seed: false,
    yes: false,
    confirmProductionSeed: false,
    file: null,
    seedFiles: [],
  };

  for (const arg of argv) {
    if (arg === '--seed') {
      options.seed = true;
      continue;
    }
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
    if (arg.startsWith('--file=')) {
      const fileValue = arg.split('=')[1]?.trim();
      if (fileValue) options.file = fileValue;
      continue;
    }
    if (arg.startsWith('--seed-file=')) {
      const seedFileValue = arg.split('=')[1]?.trim();
      if (seedFileValue) {
        options.seed = true;
        options.seedFiles.push(seedFileValue);
      }
      continue;
    }

    // Backwards compatibility: positional migration file.
    if (!arg.startsWith('--') && !options.file) {
      options.file = arg;
    }
  }

  if (options.seed && options.seedFiles.length === 0) {
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
  if (!options.seed) return;

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

function resolveSqlFile(baseDir, fileValue) {
  return path.isAbsolute(fileValue) ? fileValue : path.join(baseDir, fileValue);
}

async function runSqlFile(client, filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  console.log(`--- Running ${label}: ${fileName} ---`);
  const sql = fs.readFileSync(filePath, 'utf-8');
  await client.query(sql);
  console.log('Done.');
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  process.env.NODE_ENV = options.env;

  const dbTarget = parseDatabaseTarget(DATABASE_URL);
  const isProduction = options.env === 'production';
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: isProduction
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false },
  });

  try {
    console.log(`Environment: ${options.env}`);
    console.log(`Database target: ${dbTarget}`);
    await ensureSafeToSeed(options, dbTarget);

    console.log('\nConnecting to database...');
    const client = await pool.connect();
    console.log('Connected!\n');

    const migrationsDir = path.join(__dirname, 'migrations');

    if (options.file) {
      const filePath = resolveSqlFile(migrationsDir, options.file);
      await runSqlFile(client, filePath, 'migration');
      console.log();
    } else {
      const files = fs.readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        await runSqlFile(client, path.join(migrationsDir, file), 'migration');
      }
      console.log();
    }

    if (options.seed) {
      for (const seedFile of options.seedFiles) {
        const seedPath = resolveSqlFile(__dirname, seedFile);
        await runSqlFile(client, seedPath, 'seed');
      }
      console.log();
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
