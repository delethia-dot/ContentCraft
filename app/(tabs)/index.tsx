import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { useSavedIdeas } from "@/lib/saved-ideas-context";
import { NicheSheet } from "@/components/niche-sheet";
import { useOnboarding } from "@/lib/onboarding-context";
import * as Haptics from "expo-haptics";
import { useResponsive } from "@/hooks/use-responsive";
import { DesktopContainer } from "@/components/desktop-container";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDateString() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { niche } = useNiche();
  const { savedIdeas } = useSavedIdeas();
  const { hasCompletedOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const [nicheSheetVisible, setNicheSheetVisible] = useState(false);
  const { isTablet, isDesktop, contentMaxWidth, screenPadding, columns, cardWidth } = useResponsive();

  // Redirect to onboarding if first launch
  useEffect(() => {
    if (!onboardingLoading && !hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [onboardingLoading, hasCompletedOnboarding, router]);

  const featureCards = [
    {
      id: "ideas",
      title: "Idea Generator",
      subtitle: "AI-powered content ideas",
      icon: "lightbulb.fill" as const,
      color: colors.primary,
      route: "/(tabs)/ideas",
    },
    {
      id: "trending",
      title: "Content Playbook",
      subtitle: "Proven content formats",
      icon: "flame.fill" as const,
      color: "#E05A1C",
      route: "/(tabs)/trending",
    },
    {
      id: "frameworks",
      title: "Frameworks",
      subtitle: "Proven content structures",
      icon: "text.alignleft" as const,
      color: "#0A66C2",
      route: "/(tabs)/more",
    },
    {
      id: "history",
      title: "History",
      subtitle: "Saved ideas & analyses",
      icon: "clock.arrow.circlepath" as const,
      color: "#0D9488",
      route: "/(tabs)/history",
    },
  ];

  const handleCardPress = (route: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.navy }]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: "rgba(255,255,255,0.7)" }]}>
                {getGreeting()}
              </Text>
              <Text style={[styles.appTitle, { color: "#FFFFFF" }]}>ContentCraft</Text>
              <Text style={[styles.dateText, { color: "rgba(255,255,255,0.5)" }]}>
                {getDateString()}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
                <IconSymbol name="sparkles" size={22} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Niche Badge */}
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setNicheSheetVisible(true);
            }}
            activeOpacity={0.7}
            style={[
              styles.nicheBadge,
              { backgroundColor: "rgba(240,192,64,0.18)", borderColor: "#F0C040" },
            ]}
          >
            <IconSymbol name="tag.fill" size={13} color="#F0C040" />
            <Text style={[styles.nicheLabel, { color: "#F0C040" }]}>{niche}</Text>
            <IconSymbol name="pencil" size={13} color="#F0C040" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <DesktopContainer>
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/history" as any);
            }}
            activeOpacity={0.7}
          >
            <StatItem label="Saved Ideas" value={savedIdeas.length.toString()} color={colors.primary} />
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/ideas" as any);
            }}
            activeOpacity={0.7}
          >
            <StatItem label="Platforms" value="5" color="#B8860B" />
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/more" as any);
            }}
            activeOpacity={0.7}
          >
            <StatItem label="Frameworks" value="6" color={colors.navy} />
          </TouchableOpacity>
        </View>
        </DesktopContainer>

        {/* Feature Cards */}
        <DesktopContainer style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Access</Text>
          <View style={styles.cardsGrid}>
            {featureCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleCardPress(card.route)}
                activeOpacity={0.8}
                style={[
                  styles.featureCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isTablet && { width: cardWidth(12) },
                ]}
              >
                <View style={[styles.cardIconWrap, { backgroundColor: card.color + "18" }]}>
                  <IconSymbol name={card.icon} size={26} color={card.color} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{card.title}</Text>
                <Text style={[styles.cardSubtitle, { color: colors.muted }]}>{card.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </DesktopContainer>

        {/* Saved Ideas Preview */}
        {savedIdeas.length > 0 && (
          <DesktopContainer style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Ideas</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/history" as any)} activeOpacity={0.7}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {savedIdeas.slice(0, 3).map((idea) => (
              <TouchableOpacity
                key={idea.id}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/history" as any);
                }}
                activeOpacity={0.75}
                style={[
                  styles.savedIdeaCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.savedIdeaTop}>
                  <View style={[styles.platformDot, { backgroundColor: getPlatformColor(idea.platform) }]} />
                  <Text style={[styles.savedIdeaPlatform, { color: colors.muted }]}>
                    {idea.platform.charAt(0).toUpperCase() + idea.platform.slice(1)}
                  </Text>
                  <Text style={[styles.savedIdeaType, { color: colors.muted }]}>· {idea.contentType}</Text>
                </View>
                <Text style={[styles.savedIdeaTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {idea.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>Tap to view full idea</Text>
                  <IconSymbol name="chevron.right" size={11} color={colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </DesktopContainer>
        )}

        {/* Tips Banner */}
        <DesktopContainer>
        <View style={[styles.tipBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <IconSymbol name="bolt.fill" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.foreground }]}>
            <Text style={{ fontWeight: "700", color: colors.primary }}>Pro Tip: </Text>
            Tap the gold niche badge to change your niche anytime and get fresh, targeted content ideas.
          </Text>
        </View>
        </DesktopContainer>
      </ScrollView>

      <NicheSheet visible={nicheSheetVisible} onClose={() => setNicheSheetVisible(false)} />
    </ScreenContainer>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function getPlatformColor(platform: string): string {
  const map: Record<string, string> = {
    instagram: "#E1306C",
    facebook: "#1877F2",
    tiktok: "#00C2CB",
    youtube: "#FF0000",
    linkedin: "#0A66C2",
  };
  return map[platform] ?? "#888";
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 2,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 12,
    marginTop: 4,
  },
  headerRight: {
    marginLeft: 12,
    marginTop: 4,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  nicheBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  nicheLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  savedIdeaCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  savedIdeaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  savedIdeaPlatform: {
    fontSize: 12,
    fontWeight: "600",
  },
  savedIdeaType: {
    fontSize: 12,
  },
  savedIdeaTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  tipBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
