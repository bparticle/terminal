import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from './config/constants';
import { errorHandler } from './middleware/errorHandler';
import { query } from './config/database';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import gameRoutes from './routes/game.routes';
import campaignsRoutes from './routes/campaigns.routes';
import walletRoutes from './routes/wallet.routes';
import { registerChatHandlers } from './sockets/chat.socket';
import { verifyToken } from './services/auth.service';
import { authLimiter, apiLimiter, writeLimiter } from './middleware/rateLimiter';

const app = express();
const httpServer = createServer(app);

// ── Socket.IO ──────────────────────────────────────────────
const corsOrigin = config.nodeEnv === 'development'
  ? ['http://localhost:3000', 'http://localhost:3001']
  : config.frontendUrl; // validated at startup in constants.ts

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
  pingTimeout: 20_000,
  pingInterval: 25_000,
  maxHttpBufferSize: 1e4, // 10KB max message size
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
  },
});

// Track connections per IP for abuse prevention
const connectionsPerIp = new Map<string, number>();

// Socket.IO JWT authentication middleware
io.use((socket, next) => {
  // Connection limit per IP: max 10
  const ip = socket.handshake.address;
  const current = connectionsPerIp.get(ip) || 0;
  if (current >= 10) {
    return next(new Error('Too many connections'));
  }

  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication failed'));
  }
  try {
    const decoded = verifyToken(token);
    socket.data.userId = decoded.userId;
    socket.data.walletAddress = decoded.walletAddress;
    next();
  } catch {
    return next(new Error('Authentication failed'));
  }
});

// Register Socket.IO event handlers
io.on('connection', (socket) => {
  // Track connection count per IP
  const ip = socket.handshake.address;
  connectionsPerIp.set(ip, (connectionsPerIp.get(ip) || 0) + 1);

  socket.on('disconnect', () => {
    const count = connectionsPerIp.get(ip) || 1;
    if (count <= 1) {
      connectionsPerIp.delete(ip);
    } else {
      connectionsPerIp.set(ip, count - 1);
    }
  });

  registerChatHandlers(io, socket);
});

// Middleware
app.use(cors({
  origin: corsOrigin,
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

// Routes (with rate limiting)
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', apiLimiter, usersRoutes);
app.use('/api/v1/game', writeLimiter, gameRoutes);
app.use('/api/v1/campaigns', apiLimiter, campaignsRoutes);
app.use('/api/v1/wallet', apiLimiter, walletRoutes);

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
httpServer.listen(config.port, async () => {
  console.log(`Terminal Game API running on port ${config.port} (${config.nodeEnv})`);
  console.log(`Socket.IO ready for connections`);
  await seedAdminWallets();
});

export default app;
