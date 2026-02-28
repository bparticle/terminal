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
    text: 'TERMINAL ADVENTURE',
  },
  background: {
    page: '#0a0a0a',
    title: '#0a0a0a',
    terminal: '#1a1a1a',
    panel: 'transparent',
    monitor: '#1a1a1a',
    mobileSidebar: '#0a0a0a',
  },
  layout: {
    pageMaxWidth: '1400px',
    retroGap: '15px',
    retroPadding: '0 15px 15px',
    titleMaxWidthDesktop: '420px',
    titleMaxWidthMobile: '260px',
    sidebarWidth: '250px',
    mobileSidebarWidth: '280px',
    mobileSidebarMaxWidth: '80vw',
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
};
