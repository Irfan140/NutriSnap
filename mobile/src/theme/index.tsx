import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useColorScheme, type ColorSchemeName } from "react-native";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";

const THEME_KEY = "nutrisnap_theme_mode";
type ThemeMode = "system" | "light" | "dark";

// ================================================================
// Color tokens
// ================================================================

export const lightColors = {
  primary: "#16A34A" as string,
  primaryDark: "#15803D" as string,
  primarySoft: "#DCFCE7" as string,
  primaryMuted: "#F0FDF4" as string,
  background: "#FAFAFA" as string,
  surface: "#FFFFFF" as string,
  surfaceAlt: "#F8FAFC" as string,
  textPrimary: "#0F172A" as string,
  textSecondary: "#475569" as string,
  textMuted: "#94A3B8" as string,
  textInverse: "#FFFFFF" as string,
  border: "#E2E8F0" as string,
  borderLight: "#F1F5F9" as string,
  inputBg: "#F8FAFC" as string,
  danger: "#DC2626" as string,
  dangerDark: "#B91C1C" as string,
  dangerSoft: "#FEF2F2" as string,
  success: "#16A34A" as string,
  warning: "#D97706" as string,
};

export type AppColors = typeof lightColors;

export const darkColors: AppColors = {
  primary: "#22C55E",
  primaryDark: "#16A34A",
  primarySoft: "#052E16",
  primaryMuted: "#022C22",
  background: "#0B1120",
  surface: "#1E293B",
  surfaceAlt: "#1A2332",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textInverse: "#0F172A",
  border: "#334155",
  borderLight: "#1E293B",
  inputBg: "#1E293B",
  danger: "#EF4444",
  dangerDark: "#DC2626",
  dangerSoft: "#1C1216",
  success: "#22C55E",
  warning: "#F59E0B",
};

// ================================================================
// Typography scale
// ================================================================

export const typography = {
  heading1: { fontSize: 30, fontWeight: "800" as const, lineHeight: 36, letterSpacing: -0.5 },
  heading2: { fontSize: 24, fontWeight: "800" as const, lineHeight: 30, letterSpacing: -0.3 },
  heading3: { fontSize: 19, fontWeight: "700" as const, lineHeight: 24, letterSpacing: -0.2 },
  subtitle: { fontSize: 15, fontWeight: "500" as const, lineHeight: 21, letterSpacing: 0 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22, letterSpacing: 0 },
  bodySemibold: { fontSize: 15, fontWeight: "600" as const, lineHeight: 22, letterSpacing: 0 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18, letterSpacing: 0 },
  caption: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16, letterSpacing: 0.2 },
  captionBold: { fontSize: 12, fontWeight: "700" as const, lineHeight: 16, letterSpacing: 0.2 },
  button: { fontSize: 16, fontWeight: "700" as const, lineHeight: 20, letterSpacing: 0.3 },
  brand: { fontSize: 20, fontWeight: "800" as const, lineHeight: 24, letterSpacing: 0.5 },
  score: { fontSize: 30, fontWeight: "800" as const, lineHeight: 36, letterSpacing: -0.5 },
} as const;

export type TypographyPreset = keyof typeof typography;

// ================================================================
// Radius and Spacing
// ================================================================

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, full: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

// ================================================================
// Shadows
// ================================================================

export const cardShadowLight = {
  shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
} as const;

export const cardShadowDark = {
  shadowColor: "#000000", shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3, shadowRadius: 16, elevation: 4,
} as const;

export const buttonShadowLight = {
  shadowColor: "#15803D", shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.28, shadowRadius: 16, elevation: 4,
} as const;

export const buttonShadowDark = {
  shadowColor: "#16A34A", shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35, shadowRadius: 14, elevation: 5,
} as const;

// ================================================================
// Theme object
// ================================================================

export interface Theme {
  colors: AppColors;
  isDark: boolean;
  cardShadow: Record<string, unknown>;
  buttonShadow: Record<string, unknown>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

function createBaseTheme(isDark: boolean): Omit<Theme, "themeMode" | "setThemeMode"> {
  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
    cardShadow: (isDark ? cardShadowDark : cardShadowLight) as Record<string, unknown>,
    buttonShadow: (isDark ? buttonShadowDark : buttonShadowLight) as Record<string, unknown>,
  };
}

// ================================================================
// Context and Provider
// ================================================================

const ThemeContext = createContext<Theme>({
  ...createBaseTheme(false),
  themeMode: "system" as ThemeMode,
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  // Load saved preference
  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeModeState(saved);
      }
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    SecureStore.setItemAsync(THEME_KEY, mode);
  }, []);

  const isDark =
    themeMode === "system" ? systemScheme === "dark" : themeMode === "dark";

  const base = useMemo(() => createBaseTheme(isDark), [isDark]);

  const theme = useMemo<Theme>(
    () => ({ ...base, themeMode, setThemeMode }),
    [base, themeMode, setThemeMode],
  );

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme.colors.background]);

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

// ================================================================
// Utility: health score helpers
// ================================================================

export function healthScoreColor(score: number, colors: AppColors): string {
  if (score >= 75) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
}

export function scoreLabel(score: number): string {
  if (score >= 75) return "Great choice";
  if (score >= 50) return "Decent choice";
  return "Handle with care";
}