import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { useSavedIdeas } from "@/lib/saved-ideas-context";
import { useState } from "react";
import { NicheSheet } from "@/components/niche-sheet";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

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
  const [nicheSheetVisible, setNicheSheetVisible] = useState(false);

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
      id: "analyze",
      title: "URL Analyzer",
      subtitle: "Analyze content resonance",
      icon: "link" as const,
      color: "#B8860B",
      route: "/(tabs)/analyze",
    },
    {
      id: "trending",
      title: "Trending Today",
      subtitle: "Daily niche trends",
      icon: "chart.bar.fill" as const,
      color: "#0F2044",
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
  ];

  const handleCardPress = (route: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
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
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setNicheSheetVisible(true);
            }}
            style={({ pressed }) => [
              styles.nicheBadge,
              { backgroundColor: "rgba(240,192,64,0.18)", borderColor: "#F0C040", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <IconSymbol name="tag.fill" size={13} color="#F0C040" />
            <Text style={[styles.nicheLabel, { color: "#F0C040" }]}>{niche}</Text>
            <IconSymbol name="pencil" size={13} color="#F0C040" />
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <StatItem label="Saved Ideas" value={savedIdeas.length.toString()} color={colors.primary} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatItem label="Platforms" value="5" color="#B8860B" />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatItem label="Frameworks" value="6" color={colors.navy} />
        </View>

        {/* Feature Cards */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Access</Text>
          <View style={styles.cardsGrid}>
            {featureCards.map((card) => (
              <Pressable
                key={card.id}
                onPress={() => handleCardPress(card.route)}
                style={({ pressed }) => [
                  styles.featureCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <View style={[styles.cardIconWrap, { backgroundColor: card.color + "18" }]}>
                  <IconSymbol name={card.icon} size={26} color={card.color} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{card.title}</Text>
                <Text style={[styles.cardSubtitle, { color: colors.muted }]}>{card.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Saved Ideas Preview */}
        {savedIdeas.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Ideas</Text>
              <Pressable onPress={() => router.push("/(tabs)/ideas" as any)}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </Pressable>
            </View>
            {savedIdeas.slice(0, 3).map((idea) => (
              <View
                key={idea.id}
                style={[styles.savedIdeaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
              </View>
            ))}
          </View>
        )}

        {/* Tips Banner */}
        <View style={[styles.tipBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <IconSymbol name="bolt.fill" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.foreground }]}>
            <Text style={{ fontWeight: "700", color: colors.primary }}>Pro Tip: </Text>
            Change your niche anytime to get fresh, targeted content ideas for your audience.
          </Text>
        </View>
      </ScrollView>

      <NicheSheet visible={nicheSheetVisible} onClose={() => setNicheSheetVisible(false)} />
    </ScreenContainer>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    instagram: "#E1306C",
    facebook: "#1877F2",
    tiktok: "#010101",
    youtube: "#FF0000",
    linkedin: "#0A66C2",
  };
  return colors[platform] ?? "#888";
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
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  nicheLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: "70%",
    alignSelf: "center",
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
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.3,
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
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  savedIdeaCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  savedIdeaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
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
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
