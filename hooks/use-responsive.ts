import { useWindowDimensions } from "react-native";

export type BreakpointSize = "mobile" | "tablet" | "desktop";

export interface ResponsiveLayout {
  /** Current breakpoint */
  size: BreakpointSize;
  /** Is tablet or larger (>= 768px) */
  isTablet: boolean;
  /** Is desktop (>= 1024px) */
  isDesktop: boolean;
  /** Window width */
  width: number;
  /** Window height */
  height: number;
  /** Max content width for centered layouts */
  contentMaxWidth: number;
  /** Horizontal padding for screen edges */
  screenPadding: number;
  /** Number of columns for grid layouts */
  columns: number;
  /** Card width for grid layouts */
  cardWidth: (gap?: number) => number;
}

/**
 * Returns responsive layout values based on current window dimensions.
 * Use this to adapt layouts for mobile, tablet, and desktop.
 *
 * Breakpoints:
 * - mobile:  < 768px
 * - tablet:  768px – 1023px
 * - desktop: >= 1024px
 */
export function useResponsive(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;
  const isDesktop = width >= 1024;

  const size: BreakpointSize = isDesktop ? "desktop" : isTablet ? "tablet" : "mobile";

  const contentMaxWidth = isDesktop ? 900 : isTablet ? 680 : width;
  const screenPadding = isDesktop ? 40 : isTablet ? 28 : 16;
  const columns = isDesktop ? 3 : isTablet ? 2 : 1;

  const cardWidth = (gap = 12) => {
    const available = Math.min(width, contentMaxWidth) - screenPadding * 2;
    return (available - gap * (columns - 1)) / columns;
  };

  return {
    size,
    isTablet,
    isDesktop,
    width,
    height,
    contentMaxWidth,
    screenPadding,
    columns,
    cardWidth,
  };
}
