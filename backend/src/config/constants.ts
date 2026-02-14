import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (three levels up from backend/src/config/)
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });
// Also try backend/.env as fallback
dotenv.config();

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

// ── Validate required secrets in production ────────────────
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value && isProduction) {
    console.error(`FATAL: Required environment variable ${name} is not set.`);
    process.exit(1);
  }
  return value || '';
}

const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'dev-only-secret');
const apiKey = process.env.API_KEY || (isProduction ? '' : 'dev-only-api-key');

if (isProduction) {
  if (!jwtSecret || jwtSecret.length < 32) {
    console.error('FATAL: JWT_SECRET must be set and at least 32 characters in production.');
    process.exit(1);
  }
  if (!apiKey) {
    console.error('FATAL: API_KEY must be set in production.');
    process.exit(1);
  }
  if (!process.env.FRONTEND_URL) {
    console.error('FATAL: FRONTEND_URL must be set in production (no wildcard CORS).');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL must be set in production.');
    process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/terminal_game_db',
  jwtSecret,
  apiKey,
  frontendUrl: process.env.FRONTEND_URL || '',
  heliusApiKey: process.env.HELIUS_API_KEY || '',
  collectionMintAddress: process.env.COLLECTION_MINT_ADDRESS || '',
  adminWallets: (process.env.ADMIN_WALLETS || '').split(',').map(w => w.trim()).filter(Boolean),
};
