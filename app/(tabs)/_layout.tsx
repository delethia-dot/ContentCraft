import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, Text } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
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
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
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
        name="analyze"
        options={{
          title: "Analyze",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="link" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trending"
        options={{
          title: "Trending",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="clock.arrow.circlepath" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prompt"
        options={{
          title: "Prompt",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={size ?? 24} name="wand.and.stars" color={color} />
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
    </Tabs>
  );
}
