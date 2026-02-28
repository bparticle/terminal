import { DeepPartial, SkinConfig } from './types';

export const SKIN_REGISTRY: Record<string, DeepPartial<SkinConfig>> = {
  'terminal-default': {},
  // Example alternate skin for local testing; not mapped to campaigns by default.
  'signal-text': {
    displayName: 'Signal Text',
    title: {
      mode: 'text',
      text: 'SIGNAL PROTOCOL',
    },
    background: {
      page: '#070b12',
      title: '#070b12',
      terminal: '#101826',
      monitor: '#121d2e',
      mobileSidebar: '#070b12',
    },
    layout: {
      sidebarWidth: '270px',
    },
  },
};
