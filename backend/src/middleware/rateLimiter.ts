import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Strict rate limiter for authentication endpoints.
 * Production: 10 requests per 15 minutes per IP.
 * Development: 200 requests per minute (accommodates HMR + Strict Mode).
 */
export const authLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 15 * 60 * 1000,
  max: isDev ? 200 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

/**
 * Moderate rate limiter for general API endpoints.
 * 100 requests per minute per IP (1000 in dev).
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

/**
 * Stricter limiter for write operations (save, profile update, etc.).
 * 30 requests per minute per IP (300 in dev).
 */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 300 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
