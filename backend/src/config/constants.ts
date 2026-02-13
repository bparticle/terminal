import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/terminal_game_db',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  apiKey: process.env.API_KEY || 'change-this-api-key',
  heliusApiKey: process.env.HELIUS_API_KEY || '',
  collectionMintAddress: process.env.COLLECTION_MINT_ADDRESS || '',
};
