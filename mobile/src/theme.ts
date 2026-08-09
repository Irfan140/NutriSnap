export const colors = {
  primary: "#16A34A",
  primaryDark: "#15803D",
  primarySoft: "#DCFCE7",
  background: "#F4F7F5",
  card: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  textMuted: "#9CA3AF",
  border: "#E7EAE8",
  inputBg: "#F8FAF9",
  danger: "#DC2626",
  dangerDark: "#B91C1C",
  dangerSoft: "#FEF2F2",
  success: "#16A34A",
  warning: "#D97706",
  white: "#FFFFFF",
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const cardShadow = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.07,
  shadowRadius: 22,
  elevation: 3,
} as const;

export function healthScoreColor(score: number): string {
  if (score >= 75) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
}

export function scoreLabel(score: number): string {
  if (score >= 75) return "Great choice";
  if (score >= 50) return "Decent choice";
  return "Handle with care";
}
