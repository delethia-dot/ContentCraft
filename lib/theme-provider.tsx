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

function getInitialScheme(systemScheme: ColorScheme): ColorScheme {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  }
  return systemScheme;
}

function applyWebScheme(scheme: ColorScheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // Set data-theme attribute for CSS selectors
  root.setAttribute("data-theme", scheme);
  root.classList.toggle("dark", scheme === "dark");
  // Inject all CSS color variables directly onto :root so they cascade everywhere
  const palette = SchemeColors[scheme];
  Object.entries(palette).forEach(([token, value]) => {
    root.style.setProperty(`--color-${token}`, value as string);
  });
  // Also set background color on body to avoid flash
  document.body.style.backgroundColor = palette.background as string;
  document.body.style.color = palette.foreground as string;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = (useSystemColorScheme() ?? "light") as ColorScheme;
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() =>
    getInitialScheme(systemScheme)
  );

  const applyScheme = useCallback((scheme: ColorScheme) => {
    // Update NativeWind
    nativewindColorScheme.set(scheme);
    // Update React Native Appearance (mobile)
    if (Platform.OS !== "web") {
      Appearance.setColorScheme?.(scheme);
    }
    // Update web DOM
    if (Platform.OS === "web") {
      applyWebScheme(scheme);
      try { localStorage.setItem(STORAGE_KEY, scheme); } catch {}
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    applyScheme(scheme);
  }, [applyScheme]);

  // Apply on mount and whenever scheme changes
  useEffect(() => {
    applyScheme(colorScheme);
  }, [applyScheme, colorScheme]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-accent": SchemeColors[colorScheme].accent ?? SchemeColors[colorScheme].primary,
        "color-navy": SchemeColors[colorScheme].navy ?? SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
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
