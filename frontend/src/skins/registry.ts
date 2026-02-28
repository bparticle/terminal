import { DeepPartial, SkinConfig } from './types';

export const SKIN_REGISTRY: Record<string, DeepPartial<SkinConfig>> = {
  'terminal-default': {},
  // Single extra skin for now (white/light look).
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
