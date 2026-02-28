/**
 * Skin Registry — the single place to define all available skins.
 *
 * Each entry is a DeepPartial<SkinConfig> patch that is deep-merged on top of
 * DEFAULT_SKIN at runtime. You only need to specify fields that differ from the
 * default — everything else inherits automatically.
 *
 * ─── HOW TO ADD A SKIN ────────────────────────────────────────────────────────
 *
 * 1. Add an entry to SKIN_REGISTRY below with a unique kebab-case key.
 * 2. Specify only the fields you want to change. All others fall back to DEFAULT_SKIN.
 * 3. Assign that key to a campaign's skin_id in the database (or use "admin skin set
 *    <id>" in the terminal to test it live as an admin).
 * 4. If your skin changes colors significantly (e.g. a light background), check
 *    terminal-skins.css — some components have class-level overrides that may need
 *    updating for your skin.
 *
 * ─── MINIMAL EXAMPLE ──────────────────────────────────────────────────────────
 *
 *   'my-skin': {
 *     displayName: 'MY SKIN',
 *     title: { mode: 'text', text: 'MY GAME' },
 *     palette: {
 *       primaryColor: '#ff6600',
 *       primaryRgb: '255, 102, 0',
 *       primaryDim: '#cc5200',
 *       primaryDark: '#993d00',
 *       primaryLight: '#ff944d',
 *       primaryGlow: 'rgba(255, 102, 0, 0.5)',
 *     },
 *   },
 *
 * ─── NOTES ────────────────────────────────────────────────────────────────────
 *
 * - 'terminal-default' must remain in the registry (even as an empty patch) so
 *   it appears in admin skin lists.
 * - Skin IDs are stored as plain strings in the campaigns.skin_id DB column.
 *   Renaming a skin ID here will break any campaigns already using the old ID.
 * - See types.ts for full field documentation.
 */

import { DeepPartial, SkinConfig } from './types';

export const SKIN_REGISTRY: Record<string, DeepPartial<SkinConfig>> = {
  'terminal-default': {},

  /**
   * NEWSROOM — light/print aesthetic. Readable against a white background.
   * Overrides scanline intensity and component colors in terminal-skins.css.
   */
  newsroom: {
    displayName: 'NEWSROOM',
    title: {
      mode: 'text',
      text: 'NEWSROOM',
    },
    background: {
      page: '#f7f7f7',
      title: '#f7f7f7',
      terminal: '#ffffff',
      panel: '#ffffff',
      monitor: '#ffffff',
      mobileSidebar: '#f7f7f7',
    },
    layout: {
      sidebarWidth: '260px',
      monitorAspectRatio: '1',
      terminalBorderWidth: '2px',
      terminalBorderRadius: '10px',
      monitorBorderWidth: '1px',
      monitorBorderRadius: '8px',
    },
    typography: {
      // IBM Plex Mono is not auto-loaded — ensure it is imported in CSS or via a <link> tag.
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      titleTextColor: '#111111',
      titleTextSize: '34px',
      titleTextLetterSpacing: '0.08em',
    },
    palette: {
      primaryColor: '#202020',
      primaryRgb: '32, 32, 32',
      primaryDim: '#4a4a4a',
      primaryDark: '#151515',
      primaryLight: '#5f5f5f',
      primaryGlow: 'rgba(32, 32, 32, 0.25)',
    },
  },
};
