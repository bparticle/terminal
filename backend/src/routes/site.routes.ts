import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { query } from '../config/database';
import { config } from '../config/constants';

const router = Router();

/**
 * GET /api/v1/site/status
 * Public endpoint — returns maintenance mode status.
 * In development, always returns maintenance: false so local dev is never blocked.
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    if (config.nodeEnv !== 'production') {
      return res.json({ maintenance: false, message: '' });
    }

    const result = await query(
      "SELECT value FROM site_settings WHERE key = 'maintenance_mode'"
    );

    if (result.rows.length === 0) {
      return res.json({ maintenance: false, message: '' });
    }

    const { enabled, message } = result.rows[0].value;
    return res.json({
      maintenance: enabled || false,
      message: message || 'COMING SOON',
    });
  } catch (error) {
    console.error('Failed to fetch site status:', error);
    return res.json({ maintenance: false, message: '' });
  }
});

/**
 * PUT /api/v1/site/settings
 * Admin only — toggle maintenance mode and set message.
 */
router.put(
  '/settings',
  requireAuth as any,
  requireAdmin as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { enabled, message } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled must be a boolean' });
      }

      const msg = typeof message === 'string' ? message.slice(0, 200) : 'COMING SOON';

      const result = await query(
        `INSERT INTO site_settings (key, value)
         VALUES ('maintenance_mode', $1::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = $1::jsonb`,
        [JSON.stringify({ enabled, message: msg })]
      );

      return res.json({
        success: true,
        maintenance: enabled,
        message: msg,
      });
    } catch (error) {
      console.error('Failed to update site settings:', error);
      return res.status(500).json({ error: 'Failed to update site settings' });
    }
  }
);

export default router;
