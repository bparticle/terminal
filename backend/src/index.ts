import express from 'express';
import cors from 'cors';
import { config } from './config/constants';
import { errorHandler } from './middleware/errorHandler';
import { query } from './config/database';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import gameRoutes from './routes/game.routes';
import campaignsRoutes from './routes/campaigns.routes';
import walletRoutes from './routes/wallet.routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.nodeEnv === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001']
    : process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// API Key validation middleware (optional, for proxy layer)
app.use('/api/v1', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (config.apiKey && apiKey !== config.apiKey) {
    // In development, allow requests without API key
    if (config.nodeEnv !== 'development') {
      return res.status(403).json({ error: 'Invalid API key' });
    }
  }
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/game', gameRoutes);
app.use('/api/v1/campaigns', campaignsRoutes);
app.use('/api/v1/wallet', walletRoutes);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// Error handler (must be last)
app.use(errorHandler);

/**
 * Seed admin wallets from ADMIN_WALLETS env var on startup.
 * Sets is_admin = true for any matching wallet addresses that already exist in the DB.
 */
async function seedAdminWallets(): Promise<void> {
  if (config.adminWallets.length === 0) return;

  try {
    for (const wallet of config.adminWallets) {
      await query(
        'UPDATE users SET is_admin = true WHERE wallet_address = $1 AND is_admin = false',
        [wallet]
      );
    }
    console.log(`Admin wallet seeding checked for ${config.adminWallets.length} wallet(s)`);
  } catch (error) {
    console.error('Failed to seed admin wallets:', error);
  }
}

// Start server
app.listen(config.port, async () => {
  console.log(`Terminal Game API running on port ${config.port} (${config.nodeEnv})`);
  await seedAdminWallets();
});

export default app;
