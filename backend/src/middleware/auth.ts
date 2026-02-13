import { Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { AuthenticatedRequest } from '../types';

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // For now, admin check is done by querying the user record
  // This middleware should be used after requireAuth
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // We'll check admin status in the route handler via DB query
  // This is a placeholder that passes through
  next();
}
