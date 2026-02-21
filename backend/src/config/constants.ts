import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (three levels up from backend/src/config/)
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });
// Also try backend/.env as fallback
dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// ── Validate required secrets in non-development environments ──
const jwtSecret = process.env.JWT_SECRET || (isDevelopment ? 'dev-only-secret' : '');
const apiKey = process.env.API_KEY || (isDevelopment ? 'dev-only-api-key' : '');

if (isDevelopment && !process.env.JWT_SECRET) {
  console.warn('WARNING: Using default dev JWT secret. Do NOT use in production.');
}

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
  collectionAuthorityKeypair: process.env.COLLECTION_AUTHORITY_KEYPAIR || '',
  mintCreatorAddress: process.env.MINT_CREATOR_ADDRESS || '',
  merkleTree: process.env.MERKLE_TREE || '',
  pfpCollectionMint: process.env.PFP_COLLECTION_MINT || '',
  itemsCollectionMint: process.env.ITEMS_COLLECTION_MINT || '',
};
