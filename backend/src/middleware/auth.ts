import { Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { AuthenticatedRequest } from '../types';
import { query } from '../config/database';

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication required' });
  }
}

/**
 * Middleware that checks is_admin from the database.
 * Must be used AFTER requireAuth.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const result = await query('SELECT is_admin FROM users WHERE id = $1', [req.user.userId]);
    if (!result.rows[0]?.is_admin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
}
