const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.query(
  `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
).then(r => {
  console.log('Columns on users table:');
  r.rows.forEach(c => console.log('  -', c.column_name, '(' + c.data_type + ')'));
  const has = r.rows.some(c => c.column_name === 'last_active_at');
  console.log('\nlast_active_at column exists:', has);
  pool.end();
}).catch(e => {
  console.error(e.message);
  pool.end();
});
