/**
 * Skin type definitions.
 *
 * A SkinConfig is a complete description of how the terminal looks and feels.
 * In practice you never write a full SkinConfig from scratch — you author a
 * DeepPartial<SkinConfig> patch in registry.ts and the resolver merges it with
 * DEFAULT_SKIN at runtime.
 *
 * CSS variable mapping lives in applySkin.ts.
 * FOUC fallback values live in terminal-variables.css.
 * Canonical TypeScript defaults live in defaults.ts.
 */

/**
 * How the top title area is rendered.
 *   'animatedCanvas' — animated scanline canvas drawn by ScanlineTitle (default)
 *   'image'          — static <img>, falls back to 'text' on load failure
 *   'gif'            — same as 'image' but signals an animated GIF to the renderer
 *   'text'           — plain styled text using the skin font
 */
export type SkinTitleMode = 'animatedCanvas' | 'image' | 'gif' | 'text';

export interface SkinTitleConfig {
  mode: SkinTitleMode;
  /**
   * Which animated canvas variant to use when mode === 'animatedCanvas'.
   * Variants are defined in ScanlineTitle.tsx. Currently 1–5 exist.
   */
  animatedVariant: 1 | 2 | 3 | 4 | 5;
  /** URL for mode === 'image' | 'gif'. Null when not using an asset. */
  imageSrc: string | null;
  /** Alt text for the title image. */
  imageAlt: string;
  /**
   * Display text used when mode === 'text'.
   * Also serves as the fallback label if an image asset fails to load.
   */
  text: string;
}

export interface SkinBackgroundConfig {
  /** Full-page background (behind everything). */
  page: string;
  /** Background behind the title canvas/image in the header bar. */
  title: string;
  /** Background of the main terminal box. */
  terminal: string;
  /** Background of sidebar panel boxes (stats, players, wallet). Use 'transparent' for no fill. */
  panel: string;
  /** Background of the monitor widget container. */
  monitor: string;
  /** Background of the slide-in sidebar on mobile. */
  mobileSidebar: string;
}

export interface SkinLayoutConfig {
  /** max-width of the outermost page wrapper. Default: '1400px'. */
  pageMaxWidth: string;
  /** gap between the terminal section and the sidebar. Default: '15px'. */
  retroGap: string;
  /** padding on the retro container (the row holding terminal + sidebar). Default: '0 15px 15px'. */
  retroPadding: string;
  /** Max width of the title area on desktop. Default: '420px'. */
  titleMaxWidthDesktop: string;
  /** Max width of the title area on mobile. Default: '260px'. */
  titleMaxWidthMobile: string;
  /** Border width of the main terminal box. Default: '3px'. */
  terminalBorderWidth: string;
  /** Border style of the main terminal box. Default: 'solid'. */
  terminalBorderStyle: string;
  /** Border radius of the main terminal box. Default: '10px'. */
  terminalBorderRadius: string;
  /** Width of the desktop sidebar. Default: '250px'. */
  sidebarWidth: string;
  /** Width of the mobile slide-in sidebar. Default: '280px'. */
  mobileSidebarWidth: string;
  /** Max width of the mobile sidebar as a viewport fraction. Default: '80vw'. */
  mobileSidebarMaxWidth: string;
  /** Border width of the monitor widget. Default: '2px'. */
  monitorBorderWidth: string;
  /** Border style of the monitor widget. Default: 'solid'. */
  monitorBorderStyle: string;
  /** Border radius of the monitor widget. Default: '8px'. */
  monitorBorderRadius: string;
  /** Inner padding of the monitor widget. Default: '10px'. */
  monitorPadding: string;
  /** Bottom margin between the monitor and the panels below it. Default: '8px'. */
  monitorMarginBottom: string;
  /** CSS aspect-ratio of the monitor screen canvas. Default: '1' (square). */
  monitorAspectRatio: string;
}

export interface SkinTypographyConfig {
  /**
   * Font stack for the terminal UI. The first font must be available — either
   * a system font, a pre-loaded Google Font, or a font already imported in CSS.
   * Default: "'VT323', monospace".
   */
  fontFamily: string;
  /** Font size of the title text when mode === 'text'. Default: '42px'. */
  titleTextSize: string;
  /** Letter spacing of the title text. Default: '0.2em'. */
  titleTextLetterSpacing: string;
  /** Color of the title text. Default: 'var(--primary-color)'. */
  titleTextColor: string;
}

export interface SkinPaletteConfig {
  /** The primary UI color used for text, borders, and glows. */
  primaryColor: string;
  /**
   * The R, G, B components of primaryColor as a bare comma-separated string
   * (no rgb() wrapper) so it can be used inside rgba(). Example: '45, 254, 57'.
   */
  primaryRgb: string;
  /** Muted/dimmed variant — used for placeholder text, disabled states, secondary labels. */
  primaryDim: string;
  /** Dark variant — used for deep backgrounds and shadows derived from the primary hue. */
  primaryDark: string;
  /** Light/bright variant — used for highlighted text and active headings. */
  primaryLight: string;
  /**
   * Glow color as a full rgba() string. Used for box-shadow and text-shadow glow effects.
   * Example: 'rgba(45, 254, 57, 0.5)'.
   */
  primaryGlow: string;
}

export interface SkinConfig {
  /** Unique identifier. Must match the key in SKIN_REGISTRY. */
  id: string;
  /** Human-readable name shown in admin UI and terminal commands. */
  displayName: string;
  title: SkinTitleConfig;
  background: SkinBackgroundConfig;
  layout: SkinLayoutConfig;
  typography: SkinTypographyConfig;
  palette: SkinPaletteConfig;
}

/**
 * Utility type for skin patches in the registry.
 * Every field is optional so authors only specify what differs from DEFAULT_SKIN.
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
