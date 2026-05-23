export const tokens = {
  color: {
    stitch: {
      surface: "#F9F9FF",
      "surface-dim": "#CFDAF2",
      "surface-bright": "#F9F9FF",
      "surface-container-lowest": "#FFFFFF",
      "surface-container-low": "#F0F3FF",
      "surface-container": "#E7EEFF",
      "surface-container-high": "#DEE8FF",
      "surface-container-highest": "#D8E3FB",
      "on-surface": "#111C2D",
      "on-surface-variant": "#45464D",
      "inverse-surface": "#263143",
      "inverse-on-surface": "#ECF1FF",
      outline: "#76777D",
      "outline-variant": "#C6C6CD",
      "surface-tint": "#565E74",
      primary: "#000000",
      "on-primary": "#FFFFFF",
      "primary-container": "#131B2E",
      "on-primary-container": "#7C839B",
      "inverse-primary": "#BEC6E0",
      secondary: "#0058BE",
      "on-secondary": "#FFFFFF",
      "secondary-container": "#2170E4",
      "on-secondary-container": "#FEFCFF",
      tertiary: "#000000",
      "on-tertiary": "#FFFFFF",
      "tertiary-container": "#151C23",
      "on-tertiary-container": "#7D858D",
      error: "#BA1A1A",
      "on-error": "#FFFFFF",
      "error-container": "#FFDAD6",
      "on-error-container": "#93000A",
      "primary-fixed": "#DAE2FD",
      "primary-fixed-dim": "#BEC6E0",
      "on-primary-fixed": "#131B2E",
      "on-primary-fixed-variant": "#3F465C",
      "secondary-fixed": "#D8E2FF",
      "secondary-fixed-dim": "#ADC6FF",
      "on-secondary-fixed": "#001A42",
      "on-secondary-fixed-variant": "#004395",
      "tertiary-fixed": "#DCE3EC",
      "tertiary-fixed-dim": "#C0C7D0",
      "on-tertiary-fixed": "#151C23",
      "on-tertiary-fixed-variant": "#40484F",
      background: "#F9F9FF",
      "on-background": "#111C2D",
      "surface-variant": "#D8E3FB"
    },
    brand: {
      50: "#F0F3FF",
      100: "#DAE2FD",
      500: "#2170E4",
      600: "#0058BE",
      700: "#131B2E"
    },
    accent: {
      100: "#D8E2FF",
      500: "#ADC6FF",
      600: "#004395"
    },
    surface: {
      base: "#F9F9FF",
      elevated: "#FFFFFF",
      sunken: "#E7EEFF"
    },
    ink: {
      900: "#111C2D",
      700: "#45464D",
      500: "#76777D",
      300: "#C6C6CD",
      100: "#D8E3FB"
    },
    line: "#C6C6CD",
    success: "#0058BE",
    danger: "#BA1A1A",
    warn: "#F59E0B",
    info: "#0058BE"
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 9999 },
  stitchRadius: {
    sm: "0.25rem",
    DEFAULT: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    full: "9999px"
  },
  stitchSpacing: {
    base: 8,
    xs: 4,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 40,
    containerMax: 1280,
    gutter: 24,
    marginMobile: 16
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48
  },
  font: {
    family: { sans: "Pretendard Variable, system-ui, sans-serif" },
    size: { xs: 12, sm: 14, base: 15, lg: 17, xl: 20, "2xl": 24, "3xl": 32, "4xl": 40 },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    lineHeight: { tight: 1.25, normal: 1.55, relaxed: 1.7 }
  },
  shadow: {
    card: "0 1px 2px rgba(17,28,45,0.04), 0 4px 12px rgba(17,28,45,0.05)",
    pop: "0 8px 24px rgba(17,28,45,0.10)"
  },
  motion: {
    ease: { standard: "cubic-bezier(0.2,0,0,1)" },
    duration: { fast: 120, normal: 200, slow: 320 }
  }
} as const;

export type DesignTokens = typeof tokens;
