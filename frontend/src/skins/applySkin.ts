import { SkinConfig } from './types';

/**
 * Apply a resolved SkinConfig to the document root.
 *
 * Sets all skin CSS variables as inline styles on <html> and stamps
 * `data-skin="<id>"` so that terminal-skins.css class-level overrides
 * (used for structural exceptions that can't be expressed as variables)
 * can target specific skins via `:root[data-skin="..."]`.
 *
 * Returns a cleanup function that removes all applied variables and the
 * data-skin attribute. Designed to be used directly as a useEffect return value.
 */
export function applySkin(config: SkinConfig): () => void {
  if (typeof document === 'undefined') return () => {};

  const root = document.documentElement;
  const baseVariables: Record<string, string> = {
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
    '--skin-terminal-border-width': config.layout.terminalBorderWidth,
    '--skin-terminal-border-style': config.layout.terminalBorderStyle,
    '--skin-terminal-border-radius': config.layout.terminalBorderRadius,
    '--skin-sidebar-width': config.layout.sidebarWidth,
    '--skin-mobile-sidebar-width': config.layout.mobileSidebarWidth,
    '--skin-mobile-sidebar-max-width': config.layout.mobileSidebarMaxWidth,
    '--skin-monitor-border-width': config.layout.monitorBorderWidth,
    '--skin-monitor-border-style': config.layout.monitorBorderStyle,
    '--skin-monitor-border-radius': config.layout.monitorBorderRadius,
    '--skin-monitor-padding': config.layout.monitorPadding,
    '--skin-monitor-margin-bottom': config.layout.monitorMarginBottom,
    '--skin-monitor-aspect-ratio': config.layout.monitorAspectRatio,
    '--skin-font-family': config.typography.fontFamily,
    '--skin-title-text-size': config.typography.titleTextSize,
    '--skin-title-text-letter-spacing': config.typography.titleTextLetterSpacing,
    '--skin-title-text-color': config.typography.titleTextColor,
  };
  const paletteVariables: Record<string, string> = {
    '--primary-color': config.palette.primaryColor,
    '--primary-rgb': config.palette.primaryRgb,
    '--primary-dim': config.palette.primaryDim,
    '--primary-dark': config.palette.primaryDark,
    '--primary-light': config.palette.primaryLight,
    '--primary-glow': config.palette.primaryGlow,
  };
  const variables: Record<string, string> = { ...baseVariables, ...paletteVariables };

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
