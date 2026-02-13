import express from 'express';
import cors from 'cors';
import { config } from './config/constants';
import { errorHandler } from './middleware/errorHandler';
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

// Start server
app.listen(config.port, () => {
  console.log(`Terminal Game API running on port ${config.port} (${config.nodeEnv})`);
});

export default app;
