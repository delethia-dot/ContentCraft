import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, Platform, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "contentcraft_color_scheme";

function getStoredScheme(): ColorScheme | null {
  if (typeof localStorage === "undefined") return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "dark" || saved === "light" ? saved : null;
}

/** Apply scheme to the DOM — sets data-theme on <html> which triggers CSS variables in global.css */
function applyWebScheme(scheme: ColorScheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", scheme);
  root.classList.toggle("dark", scheme === "dark");
  // Also set inline CSS vars as a fallback for NativeWind scoped vars
  const palette = SchemeColors[scheme];
  Object.entries(palette).forEach(([token, value]) => {
    root.style.setProperty(`--color-${token}`, value as string);
  });
  document.body.style.backgroundColor = palette.background as string;
  document.body.style.color = palette.foreground as string;
  try { localStorage.setItem(STORAGE_KEY, scheme); } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = (useSystemColorScheme() ?? "light") as ColorScheme;

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    if (Platform.OS === "web") {
      return getStoredScheme() ?? systemScheme;
    }
    return systemScheme;
  });

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    if (Platform.OS !== "web") {
      Appearance.setColorScheme?.(scheme);
    } else {
      applyWebScheme(scheme);
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    applyScheme(scheme);
  }, [applyScheme]);

  // Apply on mount
  useEffect(() => {
    applyScheme(colorScheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-apply whenever scheme changes
  useEffect(() => {
    applyScheme(colorScheme);
  }, [applyScheme, colorScheme]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary":    SchemeColors[colorScheme].primary,
        "color-accent":     (SchemeColors[colorScheme] as any).accent    ?? SchemeColors[colorScheme].primary,
        "color-navy":       (SchemeColors[colorScheme] as any).navy      ?? SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface":    SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted":      SchemeColors[colorScheme].muted,
        "color-border":     SchemeColors[colorScheme].border,
        "color-success":    SchemeColors[colorScheme].success,
        "color-warning":    SchemeColors[colorScheme].warning,
        "color-error":      SchemeColors[colorScheme].error,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({ colorScheme, setColorScheme }),
    [colorScheme, setColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
