/** Thunder app design tokens — yellow / dark theme */
export const colors = {
  bg: '#0A0A0A',
  bgElevated: '#141414',
  bgCard: '#1A1A1A',
  bgInput: '#111111',
  border: '#2A2A2A',
  borderFocus: '#FACC15',

  primary: '#FACC15',
  primaryDark: '#EAB308',
  primaryMuted: 'rgba(250, 204, 21, 0.15)',

  text: '#FAFAFA',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',

  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#38BDF8',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const typography = {
  hero: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700' as const },
  subtitle: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
};

export const APP_NAME = 'Thunder';
