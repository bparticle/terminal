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
  'archive-image': {
    displayName: 'Archive Image',
    title: {
      mode: 'image',
      imageSrc: '/items/_generic.png',
      imageAlt: 'Archive campaign title',
      text: 'ARCHIVE PROTOCOL',
    },
    background: {
      page: '#111214',
      title: '#111214',
      terminal: '#191c22',
      monitor: '#1e222b',
      mobileSidebar: '#111214',
    },
    layout: {
      titleMaxWidthDesktop: '460px',
      titleMaxWidthMobile: '300px',
    },
  },
  'pulse-gif': {
    displayName: 'Pulse GIF',
    title: {
      mode: 'gif',
      imageSrc: '/items/_generic.gif',
      imageAlt: 'Pulse campaign title',
      text: 'PULSE CAMPAIGN',
    },
    background: {
      page: '#0a0b0f',
      title: '#0a0b0f',
      terminal: '#12141a',
      monitor: '#171a21',
      mobileSidebar: '#0a0b0f',
    },
    layout: {
      sidebarWidth: '262px',
      monitorAspectRatio: '1.1',
    },
  },
  'compact-ops': {
    displayName: 'Compact Ops',
    title: {
      mode: 'animatedCanvas',
      animatedVariant: 2,
      text: 'COMPACT OPS',
    },
    layout: {
      sidebarWidth: '220px',
      monitorPadding: '8px',
      monitorMarginBottom: '6px',
      retroGap: '10px',
    },
    typography: {
      titleTextSize: '36px',
      titleTextLetterSpacing: '0.12em',
    },
  },
};
