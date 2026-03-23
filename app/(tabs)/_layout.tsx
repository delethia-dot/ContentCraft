import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useResponsive } from "@/hooks/use-responsive";
import { SidebarNav } from "@/components/sidebar-nav";

/**
 * Tab layout with responsive navigation:
 * - Mobile: 5 primary tabs on bottom bar (Home, Ideas, Trending, Tools, More)
 *   Secondary tabs (Analyze, Prompt, Caption, Calendar, Tracker, History) are
 *   accessible via the Tools hub — they remain registered as tabs but hidden.
 * - Tablet (≥768px): compact icon-only sidebar (72px)
 * - Desktop (≥1024px): full sidebar with labels (220px)
 */
export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isTablet, isDesktop } = useResponsive();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  // On tablet/desktop, hide the bottom tab bar and use the sidebar instead
  const tabBarStyle = isTablet
    ? { display: "none" as const }
    : {
        paddingTop: 8,
        paddingBottom: bottomPadding,
        height: tabBarHeight,
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        borderTopWidth: 0.5,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      };

  const tabs = (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      {/* ── PRIMARY TABS (visible in bottom bar on mobile) ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: "Ideas",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="lightbulb.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trending"
        options={{
          title: "Trending",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="flame.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="sparkles" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="ellipsis" color={color} />
          ),
        }}
      />

      {/* ── SECONDARY TABS (hidden from bottom bar, accessible via Tools hub or sidebar) ── */}
      <Tabs.Screen
        name="analyze"
        options={{
          title: "Analyze",
          tabBarItemStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="link" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarItemStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="clock.arrow.circlepath" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prompt"
        options={{
          title: "Prompt",
          tabBarItemStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="wand.and.stars" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="caption"
        options={{
          title: "Caption",
          tabBarItemStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="text.bubble.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarItemStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: "Tracker",
          tabBarItemStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="chart.line.uptrend.xyaxis" color={color} />
          ),
        }}
      />
    </Tabs>
  );

  // On tablet/desktop: render sidebar + tabs side by side
  if (isTablet) {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.background }}>
        <SidebarNav />
        <View style={{ flex: 1 }}>
          {tabs}
        </View>
      </View>
    );
  }

  // On mobile: 5-tab bottom bar
  return tabs;
}
