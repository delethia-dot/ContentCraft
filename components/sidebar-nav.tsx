import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { useResponsive } from "@/hooks/use-responsive";
import type { SymbolViewProps } from "expo-symbols";

type SFSymbol = SymbolViewProps["name"];

interface NavItem {
  name: string;
  route: string;
  icon: SFSymbol;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "index", route: "/(tabs)/", icon: "house.fill", label: "Home" },
  { name: "ideas", route: "/(tabs)/ideas", icon: "lightbulb.fill", label: "Ideas" },
  { name: "analyze", route: "/(tabs)/analyze", icon: "link", label: "Analyze" },
  { name: "trending", route: "/(tabs)/trending", icon: "chart.bar.fill", label: "Trending" },
  { name: "history", route: "/(tabs)/history", icon: "clock.arrow.circlepath", label: "History" },
  { name: "prompt", route: "/(tabs)/prompt", icon: "wand.and.stars", label: "Prompt Gen" },
  { name: "caption", route: "/(tabs)/caption", icon: "text.bubble.fill", label: "Caption" },
  { name: "calendar", route: "/(tabs)/calendar", icon: "calendar", label: "Calendar" },
  { name: "tracker", route: "/(tabs)/tracker", icon: "chart.line.uptrend.xyaxis", label: "Tracker" },
  { name: "more", route: "/(tabs)/more", icon: "ellipsis", label: "More" },
];

export function SidebarNav() {
  const colors = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { niche } = useNiche();
  const { isDesktop } = useResponsive();

  const sidebarWidth = isDesktop ? 220 : 72;
  const showLabels = isDesktop;

  const isActive = (item: NavItem) => {
    if (item.name === "index") return pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/";
    return pathname.includes(item.name);
  };

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: sidebarWidth,
          backgroundColor: colors.navy,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
          borderRightColor: "rgba(255,255,255,0.08)",
        },
      ]}
    >
      {/* Logo / Brand */}
      <View style={[styles.brand, showLabels && styles.brandExpanded]}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
          <IconSymbol name="sparkles" size={18} color="#FFFFFF" />
        </View>
        {showLabels && (
          <View style={styles.brandText}>
            <Text style={styles.brandName}>ContentCraft</Text>
            <Text style={styles.brandTagline}>AI Content Studio</Text>
          </View>
        )}
      </View>

      {/* Niche Badge */}
      {showLabels && (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/" as any)}
          activeOpacity={0.7}
          style={[styles.nicheBadge, { backgroundColor: "rgba(240,192,64,0.15)", borderColor: "rgba(240,192,64,0.4)" }]}
        >
          <IconSymbol name="tag.fill" size={11} color="#F0C040" />
          <Text style={styles.nicheText} numberOfLines={1}>{niche}</Text>
        </TouchableOpacity>
      )}

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.08)" }]} />

      {/* Nav Items */}
      <ScrollView
        style={styles.navList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 2 }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
              style={[
                styles.navItem,
                showLabels && styles.navItemExpanded,
                active && { backgroundColor: "rgba(255,255,255,0.12)" },
                !showLabels && { justifyContent: "center" },
              ]}
            >
              {active && (
                <View style={[styles.activeBar, { backgroundColor: colors.primary }]} />
              )}
              <IconSymbol
                name={item.icon}
                size={20}
                color={active ? "#FFFFFF" : "rgba(255,255,255,0.55)"}
              />
              {showLabels && (
                <Text
                  style={[
                    styles.navLabel,
                    { color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)" },
                    active && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      {showLabels && (
        <View style={styles.sidebarFooter}>
          <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.08)", marginBottom: 12 }]} />
          <Text style={styles.footerText}>ContentCraft v1.7</Text>
          <Text style={styles.footerSub}>AI-Powered Content Studio</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    flexShrink: 0,
    borderRightWidth: 1,
    flexDirection: "column",
  },
  brand: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 8,
  },
  brandExpanded: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandText: {
    flex: 1,
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  brandTagline: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 1,
  },
  nicheBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  nicheText: {
    color: "#F0C040",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  navList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    position: "relative",
    overflow: "hidden",
  },
  navItemExpanded: {
    gap: 12,
    paddingHorizontal: 14,
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  navLabelActive: {
    fontWeight: "700",
  },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  footerText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "600",
  },
  footerSub: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 10,
    marginTop: 2,
  },
});
