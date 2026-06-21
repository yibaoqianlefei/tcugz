/**
 * Design Token System
 * Inspired by Anthropic/Claude design language:
 * warm cream canvas · coral accent · serif display · color-block elevation
 */

// ── Color Palette ────────────────────────────────────────────
export const colors = {
  // Brand accent
  primary: "#FF6B5A" as const,
  "primary-active": "#e55a4a" as const,
  "primary-disabled": "#F6E1DC" as const,
  "on-primary": "#ffffff" as const,

  // Canvas & surfaces
  canvas: "#faf9f5" as const,
  "canvas-soft": "#F6F1E8" as const,
  "surface-card": "#efe9de" as const,
  "surface-cream": "#e8e0d2" as const,
  "surface-dark": "#181715" as const,
  "surface-dark-elevated": "#252320" as const,
  white: "#ffffff" as const,

  // Text
  ink: "#141413" as const,
  body: "#3d3d3a" as const,
  muted: "#6c6a64" as const,
  "muted-soft": "#8e8b82" as const,
  "on-dark": "#faf9f5" as const,
  "on-dark-soft": "#a09d96" as const,

  // Borders
  hairline: "#e6dfd8" as const,
  "hairline-soft": "#ebe6df" as const,

  // Semantic
  success: "#5db872" as const,
  warning: "#d4a017" as const,
  error: "#c64545" as const,
  "accent-teal": "#5db8a6" as const,
} as const;

// ── Typography ───────────────────────────────────────────────
export const typography = {
  font: {
    display: '"Noto Serif SC", "Source Han Serif SC", "Cormorant Garamond", Georgia, serif',
    body: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    code: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
  },

  scale: {
    "display-lg": {
      fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
      fontSize: 42,
      fontWeight: 400,
      lineHeight: 1.1,
      letterSpacing: -0.5,
    },
    "display-md": {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: 32,
      fontWeight: 400,
      lineHeight: 1.15,
      letterSpacing: -0.3,
    },
    "display-sm": {
      fontFamily: '"Noto Serif SC", serif',
      fontSize: 24,
      fontWeight: 400,
      lineHeight: 1.2,
      letterSpacing: -0.2,
    },
    title: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 18,
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    "title-sm": {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 15,
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    body: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.55,
      letterSpacing: 0,
    },
    "body-sm": {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 13,
      fontWeight: 400,
      lineHeight: 1.55,
      letterSpacing: 0,
    },
    caption: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 11,
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    button: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 1,
      letterSpacing: 0,
    },
    nav: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
  },
} as const;

// ── Spacing (4px base) ───────────────────────────────────────
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 64,
} as const;

// ── Border Radius ────────────────────────────────────────────
export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
} as const;

// ── Elevation (color-block, shadow-rare) ─────────────────────
export const elevation = {
  flat: {
    boxShadow: "none",
    border: "none",
  },
  hairline: {
    boxShadow: "none",
    border: `1px solid ${colors.hairline}`,
  },
  card: {
    boxShadow: "none",
    backgroundColor: colors["surface-card"],
  },
  dark: {
    boxShadow: "none",
    backgroundColor: colors["surface-dark"],
  },
  subtle: {
    boxShadow: "0 1px 3px rgba(20,20,19,0.08)",
  },
} as const;

// ── Animation Tokens ─────────────────────────────────────────
export const motion = {
  spring: {
    type: "spring" as const,
    stiffness: 200,
    damping: 20,
  },
  fadeIn: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
  },
  stagger: (i: number) => ({
    delay: i * 0.05,
  }),
  hoverLift: {
    y: -1,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  },
  tapScale: {
    scale: 0.98,
  },
} as const;
