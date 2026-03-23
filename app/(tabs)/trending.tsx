import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
  ScrollView,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { NicheSheet } from "@/components/niche-sheet";
import { PLATFORMS, TrendingIdea } from "@/lib/types";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const TRENDING_CACHE_KEY = "@contentcraft_trending";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

type PlatformFilter = "all" | "instagram" | "facebook" | "tiktok" | "youtube" | "linkedin";

function TrendScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <View style={styles.scoreBarWrap}>
      <View style={[styles.scoreBarBg, { backgroundColor: color + "20" }]}>
        <View style={[styles.scoreBarFill, { width: `${score}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.scoreBarText, { color }]}>{score}</Text>
    </View>
  );
}

export default function TrendingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { niche } = useNiche();
  const [nicheSheetVisible, setNicheSheetVisible] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [ideas, setIdeas] = useState<TrendingIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const trendingMutation = trpc.content.getTrendingIdeas.useMutation();

  const loadFromCache = useCallback(async () => {
    const cached = await AsyncStorage.getItem(TRENDING_CACHE_KEY + "_" + niche);
    if (cached) {
      const { ideas: cachedIdeas, generatedAt } = JSON.parse(cached);
      const age = Date.now() - new Date(generatedAt).getTime();
      if (age < CACHE_DURATION_MS) {
        setIdeas(cachedIdeas);
        setLastGenerated(generatedAt);
        return true;
      }
    }
    return false;
  }, [niche]);

  const fetchTrending = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh) {
        const cached = await loadFromCache();
        if (cached) return;
      }
      setIsLoading(true);
      try {
        const result = await trendingMutation.mutateAsync({
          niche,
          platform: platformFilter,
        });
        setIdeas(result.ideas as TrendingIdea[]);
        setLastGenerated(result.generatedAt);
        await AsyncStorage.setItem(
          TRENDING_CACHE_KEY + "_" + niche,
          JSON.stringify({ ideas: result.ideas, generatedAt: result.generatedAt })
        );
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        // silent fail — show empty state
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [niche, platformFilter, trendingMutation, loadFromCache]
  );

  useEffect(() => {
    fetchTrending();
  }, [niche]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchTrending(true);
  }, [fetchTrending]);

  const handleUseIdea = useCallback(
    (idea: TrendingIdea) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push("/(tabs)/ideas" as any);
    },
    [router]
  );

  const filteredIdeas =
    platformFilter === "all" ? ideas : ideas.filter((i) => i.platform === platformFilter);

  const getPlatformColor = (platform: string) => {
    const p = PLATFORMS.find((pl) => pl.id === platform);
    return p?.color ?? "#888";
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const renderItem = ({ item }: { item: TrendingIdea }) => {
    const pColor = getPlatformColor(item.platform);
    const platform = PLATFORMS.find((p) => p.id === item.platform);
    return (
      <View style={[styles.trendCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.trendCardTop}>
          <View style={[styles.platformBadge, { backgroundColor: pColor + "18" }]}>
            <View style={[styles.platformDot, { backgroundColor: pColor }]} />
            <Text style={[styles.platformBadgeText, { color: pColor }]}>{platform?.label}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{item.contentType}</Text>
          </View>
          <View style={styles.flameBadge}>
            <IconSymbol name="flame.fill" size={14} color="#F59E0B" />
            <Text style={[styles.flameBadgeText, { color: "#F59E0B" }]}>Trending</Text>
          </View>
        </View>

        <Text style={[styles.trendTitle, { color: colors.foreground }]}>{item.title}</Text>
        <Text style={[styles.trendDesc, { color: colors.muted }]}>{item.description}</Text>

        <TrendScoreBar score={item.trendScore} color={pColor} />

        <TouchableOpacity
          onPress={() => handleUseIdea(item)}
          activeOpacity={0.85}
          style={[styles.useIdeaBtn, { backgroundColor: colors.primary }]}
        >
          <IconSymbol name="lightbulb.fill" size={15} color="#FFFFFF" />
          <Text style={styles.useIdeaBtnText}>Use This Idea</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.navy }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Trending Today</Text>
            <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => fetchTrending(true)}
            activeOpacity={0.7}
            style={[styles.refreshBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}
          >
            <IconSymbol name="arrow.clockwise" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setNicheSheetVisible(true)}
          activeOpacity={0.7}
          style={[styles.nicheBadge, { backgroundColor: "rgba(240,192,64,0.18)", borderColor: "#F0C040" }]}
        >
          <IconSymbol name="tag.fill" size={13} color="#F0C040" />
          <Text style={[styles.nicheLabel, { color: "#F0C040" }]}>{niche}</Text>
          <IconSymbol name="pencil" size={13} color="#F0C040" />
        </TouchableOpacity>
      </View>

      {/* Platform Filter */}
      <View style={[styles.filterWrap, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[{ id: "all", label: "All" }, ...PLATFORMS].map((p) => {
            const isActive = platformFilter === p.id;
            const pColor = p.id === "all" ? colors.primary : (PLATFORMS.find((pl) => pl.id === p.id)?.color ?? colors.primary);
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setPlatformFilter(p.id as PlatformFilter)}
                activeOpacity={0.75}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? pColor : colors.surface,
                    borderColor: isActive ? pColor : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Finding trending ideas for {niche}...
          </Text>
        </View>
      ) : filteredIdeas.length > 0 ? (
        <FlatList
          data={filteredIdeas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            lastGenerated ? (
              <View style={[styles.lastUpdated, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="clock.fill" size={13} color={colors.muted} />
                <Text style={[styles.lastUpdatedText, { color: colors.muted }]}>
                  Updated at {formatDate(lastGenerated)} · Pull to refresh
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="flame.fill" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Trends Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Tap the refresh button to load today's trending ideas for your niche.
          </Text>
          <TouchableOpacity
            onPress={() => fetchTrending(true)}
            activeOpacity={0.85}
            style={[styles.loadBtn, { backgroundColor: colors.primary }]}
          >
            <IconSymbol name="flame.fill" size={18} color="#FFFFFF" />
            <Text style={styles.loadBtnText}>Load Trending Ideas</Text>
          </TouchableOpacity>
        </View>
      )}

      <NicheSheet visible={nicheSheetVisible} onClose={() => setNicheSheetVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  filterWrap: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  lastUpdated: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  lastUpdatedText: {
    fontSize: 12,
  },
  trendCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  trendCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  flameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: "auto",
  },
  flameBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  trendDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  scoreBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scoreBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  scoreBarText: {
    fontSize: 12,
    fontWeight: "700",
    width: 28,
    textAlign: "right",
  },
  useIdeaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
  },
  useIdeaBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  loadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  loadBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
