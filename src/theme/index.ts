export const palette = {
  neonGreen: '#C5FF4A',
  neonGreenDim: '#A8E039',
  neonGlow: 'rgba(197, 255, 74, 0.4)',

  brandPrimary: '#C5FF4A',
  brandSecondary: '#A8E039',

  background: '#121212',
  backgroundElevated: '#1A1A1A',
  surface: '#1E1E1E',
  surfaceGlass: 'rgba(30, 30, 30, 0.8)',
  cardBackground: '#1C1C1E',

  textPrimary: '#EAEAEA',
  textSecondary: '#A0A0A0',
  textTertiary: '#6B6B6B',

  accentBlue: '#0A84FF',
  accentPurple: '#BF5AF2',
  accentOrange: '#FF9F0A',

  success: '#32D74B',
  warning: '#FFB347',
  danger: '#FF453A',
  error: '#FF453A',

  border: '#2C2C2E',
  borderGlow: 'rgba(197, 255, 74, 0.2)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayDark: 'rgba(0, 0, 0, 0.85)',

  gradientNeon: ['#C5FF4A', '#A8E039'],
  gradientDark: ['#1A1A1A', '#121212'],
  gradientCard: ['#1E1E1E', '#1A1A1A'],
  gradientOverlay: ['rgba(0, 0, 0, 0)', 'rgba(18, 18, 18, 0.95)'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
} as const;

export const typography = {
  display: {
    fontSize: 48,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    lineHeight: 56,
  },
  heading1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 40,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 32,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  captionBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  neonGlow: {
    shadowColor: '#C5FF4A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  neonGlowSoft: {
    shadowColor: '#C5FF4A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

export const theme = {
  palette,
  spacing,
  radii,
  typography,
  shadows,
};

export type Theme = typeof theme;
