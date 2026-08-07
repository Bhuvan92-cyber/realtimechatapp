// Centralized theme for the chat app. Warm-neutral palette with a blue accent.
export const theme = {
  colors: {
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#DBEAFE',
    accent: '#0EA5E9',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F5F9',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    border: '#E2E8F0',
    borderStrong: '#CBD5E1',

    bubbleSelf: '#2563EB',
    bubbleSelfText: '#FFFFFF',
    bubbleOther: '#FFFFFF',
    bubbleOtherText: '#0F172A',

    online: '#22C55E',
    offline: '#94A3B8',
  },
  fonts: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
} as const;
