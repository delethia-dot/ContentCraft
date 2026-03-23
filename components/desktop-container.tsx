import React from "react";
import { View, type ViewProps } from "react-native";
import { useResponsive } from "@/hooks/use-responsive";

interface DesktopContainerProps extends ViewProps {
  children: React.ReactNode;
  /** Max width for content. Defaults to contentMaxWidth from useResponsive */
  maxWidth?: number;
}

/**
 * Centers content horizontally on tablet and desktop screens.
 * On mobile, renders children without any wrapping constraints.
 *
 * Use this to wrap the main scrollable content area of a screen.
 */
export function DesktopContainer({ children, maxWidth, style, ...props }: DesktopContainerProps) {
  const { isTablet, contentMaxWidth, screenPadding } = useResponsive();

  if (!isTablet) {
    return <View style={style} {...props}>{children}</View>;
  }

  return (
    <View
      style={[
        {
          maxWidth: maxWidth ?? contentMaxWidth,
          width: "100%",
          alignSelf: "center",
          paddingHorizontal: screenPadding,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
