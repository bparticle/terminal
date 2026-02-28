/**
 * The canonical default skin — the baseline every other skin patches on top of.
 *
 * These values are the source of truth for TypeScript.
 * terminal-variables.css holds matching CSS fallbacks for FOUC prevention only.
 *
 * Never import DEFAULT_SKIN directly in components. Go through resolveSkin()
 * so that campaign and admin overrides are applied correctly.
 */

import { SkinConfig } from './types';

export const DEFAULT_SKIN_ID = 'terminal-default';

export const DEFAULT_SKIN: SkinConfig = {
  id: DEFAULT_SKIN_ID,
  displayName: 'Terminal Default',
  title: {
    mode: 'animatedCanvas',
    animatedVariant: 5,
    imageSrc: null,
    imageAlt: 'Terminal title',
    // 'text' is used as the fallback label if an image/gif ever fails to load,
    // even though animatedCanvas mode doesn't render it directly.
    text: 'TERMINAL ADVENTURE',
  },
  background: {
    page: '#0a0a0a',
    title: '#0a0a0a',
    terminal: '#1a1a1a',
    panel: 'transparent', // sidebar panels have no background fill by default
    monitor: '#1a1a1a',
    mobileSidebar: '#0a0a0a',
  },
  layout: {
    pageMaxWidth: '1400px',
    retroGap: '15px',
    retroPadding: '0 15px 15px',
    titleMaxWidthDesktop: '420px',
    titleMaxWidthMobile: '260px',
    terminalBorderWidth: '3px',
    terminalBorderStyle: 'solid',
    terminalBorderRadius: '10px',
    sidebarWidth: '250px',
    mobileSidebarWidth: '280px',
    mobileSidebarMaxWidth: '80vw',
    monitorBorderWidth: '2px',
    monitorBorderStyle: 'solid',
    monitorBorderRadius: '8px',
    monitorPadding: '10px',
    monitorMarginBottom: '8px',
    monitorAspectRatio: '1',
  },
  typography: {
    fontFamily: "'VT323', monospace",
    titleTextSize: '42px',
    titleTextLetterSpacing: '0.2em',
    titleTextColor: 'var(--primary-color)',
  },
  // Classic Green palette
  palette: {
    primaryColor: '#2dfe39',
    primaryRgb: '45, 254, 57',
    primaryDim: '#1fb527',
    primaryDark: '#158c1d',
    primaryLight: '#5fff66',
    primaryGlow: 'rgba(45, 254, 57, 0.5)',
  },
};
