export type SkinTitleMode = 'animatedCanvas' | 'image' | 'gif' | 'text';

export interface SkinTitleConfig {
  mode: SkinTitleMode;
  animatedVariant: 1 | 2 | 3 | 4 | 5;
  imageSrc: string | null;
  imageAlt: string;
  text: string;
}

export interface SkinBackgroundConfig {
  page: string;
  title: string;
  terminal: string;
  panel: string;
  monitor: string;
  mobileSidebar: string;
}

export interface SkinLayoutConfig {
  pageMaxWidth: string;
  retroGap: string;
  retroPadding: string;
  titleMaxWidthDesktop: string;
  titleMaxWidthMobile: string;
  terminalBorderWidth: string;
  terminalBorderStyle: string;
  terminalBorderRadius: string;
  sidebarWidth: string;
  mobileSidebarWidth: string;
  mobileSidebarMaxWidth: string;
  monitorBorderWidth: string;
  monitorBorderStyle: string;
  monitorBorderRadius: string;
  monitorPadding: string;
  monitorMarginBottom: string;
  monitorAspectRatio: string;
}

export interface SkinTypographyConfig {
  fontFamily: string;
  titleTextSize: string;
  titleTextLetterSpacing: string;
  titleTextColor: string;
}

export interface SkinPaletteConfig {
  primaryColor: string;
  primaryRgb: string;
  primaryDim: string;
  primaryDark: string;
  primaryLight: string;
  primaryGlow: string;
}

export interface SkinConfig {
  id: string;
  displayName: string;
  title: SkinTitleConfig;
  background: SkinBackgroundConfig;
  layout: SkinLayoutConfig;
  typography: SkinTypographyConfig;
  palette?: SkinPaletteConfig;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
