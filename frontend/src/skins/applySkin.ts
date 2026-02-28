import { SkinConfig } from './types';

export function applySkin(config: SkinConfig): () => void {
  if (typeof document === 'undefined') return () => {};

  const root = document.documentElement;
  const variables: Record<string, string> = {
    '--skin-page-bg': config.background.page,
    '--skin-title-bg': config.background.title,
    '--skin-terminal-bg': config.background.terminal,
    '--skin-panel-bg': config.background.panel,
    '--skin-monitor-bg': config.background.monitor,
    '--skin-mobile-sidebar-bg': config.background.mobileSidebar,
    '--skin-page-max-width': config.layout.pageMaxWidth,
    '--skin-retro-gap': config.layout.retroGap,
    '--skin-retro-padding': config.layout.retroPadding,
    '--skin-title-max-width-desktop': config.layout.titleMaxWidthDesktop,
    '--skin-title-max-width-mobile': config.layout.titleMaxWidthMobile,
    '--skin-sidebar-width': config.layout.sidebarWidth,
    '--skin-mobile-sidebar-width': config.layout.mobileSidebarWidth,
    '--skin-mobile-sidebar-max-width': config.layout.mobileSidebarMaxWidth,
    '--skin-monitor-border-radius': config.layout.monitorBorderRadius,
    '--skin-monitor-padding': config.layout.monitorPadding,
    '--skin-monitor-margin-bottom': config.layout.monitorMarginBottom,
    '--skin-monitor-aspect-ratio': config.layout.monitorAspectRatio,
    '--skin-font-family': config.typography.fontFamily,
    '--skin-title-text-size': config.typography.titleTextSize,
    '--skin-title-text-letter-spacing': config.typography.titleTextLetterSpacing,
    '--skin-title-text-color': config.typography.titleTextColor,
  };

  root.setAttribute('data-skin', config.id);
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value);
  }

  return () => {
    for (const name of Object.keys(variables)) {
      root.style.removeProperty(name);
    }
    if (root.getAttribute('data-skin') === config.id) {
      root.removeAttribute('data-skin');
    }
  };
}
