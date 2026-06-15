export const tokens = {
  color: {
    stitch: {
      surface: "#FFFFFF",
      "surface-dim": "#F4F7FB",
      "surface-bright": "#FFFFFF",
      "surface-container-lowest": "#FFFFFF",
      "surface-container-low": "#F8FBFF",
      "surface-container": "#F4F8FF",
      "surface-container-high": "#EEF4FF",
      "surface-container-highest": "#E7EBF1",
      "on-surface": "#081225",
      "on-surface-variant": "#667085",
      "inverse-surface": "#263143",
      "inverse-on-surface": "#ECF1FF",
      outline: "#667085",
      "outline-variant": "#E7EBF1",
      "surface-tint": "#667085",
      primary: "#000000",
      "on-primary": "#FFFFFF",
      "primary-container": "#131B2E",
      "on-primary-container": "#7C839B",
      "inverse-primary": "#BEC6E0",
      secondary: "#2563FF",
      "on-secondary": "#FFFFFF",
      "secondary-container": "#2563FF",
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
      "on-secondary-fixed-variant": "#1D4ED8",
      "tertiary-fixed": "#DCE3EC",
      "tertiary-fixed-dim": "#C0C7D0",
      "on-tertiary-fixed": "#151C23",
      "on-tertiary-fixed-variant": "#40484F",
      background: "#FFFFFF",
      "on-background": "#081225",
      "surface-variant": "#E7EBF1"
    },
    brand: {
      50: "#F4F8FF",
      100: "#EEF4FF",
      500: "#2563FF",
      600: "#2563FF",
      700: "#1D4ED8"
    },
    accent: {
      100: "#EEF4FF",
      500: "#2563FF",
      600: "#1D4ED8"
    },
    surface: {
      base: "#FFFFFF",
      elevated: "#FFFFFF",
      sunken: "#F4F8FF"
    },
    ink: {
      900: "#081225",
      700: "#344054",
      500: "#667085",
      300: "#98A2B3",
      100: "#E7EBF1"
    },
    line: "#E7EBF1",
    success: "#2563FF",
    danger: "#BA1A1A",
    warn: "#F59E0B",
    info: "#2563FF"
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
    family: { sans: "Noto Sans KR, Pretendard Variable, system-ui, sans-serif" },
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
