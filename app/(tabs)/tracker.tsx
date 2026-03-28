"use client";
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { useStorage } from "@/lib/storage-context";
import { PLATFORMS, Platform as SocialPlatform, CONTENT_TYPES, CalendarEntry } from "@/lib/types";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrackerEntry {
  id: string;
  platform: SocialPlatform;
  contentType: string;
  niche: string;
  title: string;
  likes: number;
  views: number;
  shares: number;
  comments: number;
  performanceRating: string;
  performanceScore: number;
  engagementRate: string;
  benchmarkComparison: string;
  strengths: string[];
  improvements: string[];
  nextPostTips: string[];
  calendarEntryId?: string;
  dayOfWeek?: string;
  createdAt: string;
}

const STORAGE_KEY = "contentcraft_tracker_entries";

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#00C2CB",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
};

const RATING_COLORS: Record<string, string> = {
  excellent: "#10B981",
  good: "#22C55E",
  average: "#F59E0B",
  "below-average": "#F97316",
  poor: "#EF4444",
};

const RATING_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  "below-average": "Below Avg",
  poor: "Poor",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: "Post", reel: "Reel", story: "Story", carousel: "Carousel",
  "long-form": "Long-form", short: "Short", image: "Image", video: "Video",
  "talking-head": "Talking Head",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return `${DAY_NAMES[d.getDay()]}, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

// ─── Pattern Summary ──────────────────────────────────────────────────────────

function PatternSummary({ entries, colors }: { entries: TrackerEntry[]; colors: ReturnType<typeof useColors> }) {
  const stats = useMemo(() => {
    if (entries.length < 2) return null;

    // Best platform by avg score
    const platformScores: Record<string, number[]> = {};
    entries.forEach((e) => {
      if (!platformScores[e.platform]) platformScores[e.platform] = [];
      platformScores[e.platform].push(e.performanceScore);
    });
    const bestPlatform = Object.entries(platformScores)
      .map(([p, scores]) => ({ p, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
      .sort((a, b) => b.avg - a.avg)[0];

    // Best content type by avg score
    const ctScores: Record<string, number[]> = {};
    entries.forEach((e) => {
      if (!ctScores[e.contentType]) ctScores[e.contentType] = [];
      ctScores[e.contentType].push(e.performanceScore);
    });
    const bestCT = Object.entries(ctScores)
      .map(([ct, scores]) => ({ ct, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
      .sort((a, b) => b.avg - a.avg)[0];

    // Best day of week
    const dayScores: Record<string, number[]> = {};
    entries.forEach((e) => {
      if (e.dayOfWeek) {
        if (!dayScores[e.dayOfWeek]) dayScores[e.dayOfWeek] = [];
        dayScores[e.dayOfWeek].push(e.performanceScore);
      }
    });
    const bestDay = Object.keys(dayScores).length > 0
      ? Object.entries(dayScores)
          .map(([d, scores]) => ({ d, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
          .sort((a, b) => b.avg - a.avg)[0]
      : null;

    // Avg score overall
    const avgScore = Math.round(entries.reduce((sum, e) => sum + e.performanceScore, 0) / entries.length);

    // High performer rate
    const highCount = entries.filter((e) => ["excellent", "good"].includes(e.performanceRating)).length;
    const highRate = Math.round((highCount / entries.length) * 100);

    return { bestPlatform, bestCT, bestDay, avgScore, highRate };
  }, [entries]);

  if (!stats) return null;

  const pColor = PLATFORM_COLORS[stats.bestPlatform.p as SocialPlatform] ?? colors.primary;

  return (
    <View style={[patternStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={patternStyles.cardHeader}>
        <IconSymbol name="sparkles" size={16} color={colors.accent} />
        <Text style={[patternStyles.cardTitle, { color: colors.foreground }]}>30-Day Pattern Analysis</Text>
        <Text style={[patternStyles.cardSub, { color: colors.muted }]}>{entries.length} posts logged</Text>
      </View>

      <View style={patternStyles.statsGrid}>
        <View style={[patternStyles.statBox, { backgroundColor: pColor + "12", borderColor: pColor + "30" }]}>
          <Text style={[patternStyles.statLabel, { color: colors.muted }]}>Best Platform</Text>
          <Text style={[patternStyles.statValue, { color: pColor }]}>
            {stats.bestPlatform.p.charAt(0).toUpperCase() + stats.bestPlatform.p.slice(1)}
          </Text>
          <Text style={[patternStyles.statScore, { color: colors.muted }]}>avg {Math.round(stats.bestPlatform.avg)}/100</Text>
        </View>

        <View style={[patternStyles.statBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <Text style={[patternStyles.statLabel, { color: colors.muted }]}>Best Format</Text>
          <Text style={[patternStyles.statValue, { color: colors.primary }]}>
            {CONTENT_TYPE_LABELS[stats.bestCT.ct] ?? stats.bestCT.ct}
          </Text>
          <Text style={[patternStyles.statScore, { color: colors.muted }]}>avg {Math.round(stats.bestCT.avg)}/100</Text>
        </View>

        {stats.bestDay && (
          <View style={[patternStyles.statBox, { backgroundColor: "#10B981" + "12", borderColor: "#10B981" + "30" }]}>
            <Text style={[patternStyles.statLabel, { color: colors.muted }]}>Best Day</Text>
            <Text style={[patternStyles.statValue, { color: "#10B981" }]}>{stats.bestDay.d}</Text>
            <Text style={[patternStyles.statScore, { color: colors.muted }]}>avg {Math.round(stats.bestDay.avg)}/100</Text>
          </View>
        )}

        <View style={[patternStyles.statBox, { backgroundColor: colors.accent + "12", borderColor: colors.accent + "30" }]}>
          <Text style={[patternStyles.statLabel, { color: colors.muted }]}>High Performers</Text>
          <Text style={[patternStyles.statValue, { color: colors.accent }]}>{stats.highRate}%</Text>
          <Text style={[patternStyles.statScore, { color: colors.muted }]}>of all posts</Text>
        </View>
      </View>
    </View>
  );
}

const patternStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginBottom: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: "800", flex: 1 },
  cardSub: { fontSize: 11 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statBox: { borderRadius: 12, borderWidth: 1, padding: 10, alignItems: "center", gap: 2, minWidth: "45%", flex: 1 },
  statLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  statValue: { fontSize: 15, fontWeight: "800" },
  statScore: { fontSize: 10 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrackerScreen() {
  const colors = useColors();
  const { niche } = useNiche();
  const { calendarEntries } = useStorage();

  const [view, setView] = useState<"list" | "add">("list");
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<TrackerEntry | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form state
  const [formPlatform, setFormPlatform] = useState<SocialPlatform>("instagram");
  const [formContentType, setFormContentType] = useState("post");
  const [formTitle, setFormTitle] = useState("");
  const [formViews, setFormViews] = useState("");
  const [formLikes, setFormLikes] = useState("");
  const [formShares, setFormShares] = useState("");
  const [formComments, setFormComments] = useState("");
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string | undefined>(undefined);

  const analyzeMutation = trpc.content.analyzePerformance.useMutation();

  // Load entries on mount
  React.useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setEntries(JSON.parse(stored));
    } catch {}
  };

  const saveEntries = async (updated: TrackerEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Calendar entries that haven't been tracked yet (completed ones are most useful)
  const availableCalendarEntries = useMemo(() => {
    const trackedIds = new Set(entries.map((e) => e.calendarEntryId).filter(Boolean));
    return calendarEntries
      .filter((ce) => !trackedIds.has(ce.id))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20); // show most recent 20
  }, [calendarEntries, entries]);

  const handleSelectCalendarEntry = useCallback((ce: CalendarEntry) => {
    setSelectedCalendarId(ce.id);
    setFormTitle(ce.ideaTitle);
    setFormPlatform(ce.platform);
    setFormContentType(ce.contentType);
    // Compute day of week from date
    const [year, month, day] = ce.date.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    setSelectedDayOfWeek(DAY_NAMES[d.getDay()]);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleClearCalendarEntry = useCallback(() => {
    setSelectedCalendarId(null);
    setSelectedDayOfWeek(undefined);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!formTitle.trim()) {
      Alert.alert("Missing Info", "Please enter a post title or description.");
      return;
    }
    const views = parseInt(formViews) || 0;
    const likes = parseInt(formLikes) || 0;
    const shares = parseInt(formShares) || 0;
    const comments = parseInt(formComments) || 0;

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);
    try {
      const res = await analyzeMutation.mutateAsync({
        platform: formPlatform,
        contentType: formContentType as any,
        niche,
        title: formTitle.trim(),
        likes,
        views,
        shares,
        comments,
      });

      const entry: TrackerEntry = {
        id: `tracker-${Date.now()}`,
        platform: formPlatform,
        contentType: formContentType,
        niche,
        title: formTitle.trim(),
        likes,
        views,
        shares,
        comments,
        performanceRating: (res as any).performanceRating,
        performanceScore: (res as any).performanceScore,
        engagementRate: (res as any).engagementRate,
        benchmarkComparison: (res as any).benchmarkComparison,
        strengths: (res as any).strengths ?? [],
        improvements: (res as any).improvements ?? [],
        nextPostTips: (res as any).nextPostTips ?? [],
        calendarEntryId: selectedCalendarId ?? undefined,
        dayOfWeek: selectedDayOfWeek,
        createdAt: new Date().toISOString(),
      };

      const updated = [entry, ...entries];
      setEntries(updated);
      await saveEntries(updated);
      setSelectedEntry(entry);
      setView("list");

      // Reset form
      setFormTitle("");
      setFormViews("");
      setFormLikes("");
      setFormShares("");
      setFormComments("");
      setSelectedCalendarId(null);
      setSelectedDayOfWeek(undefined);

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Analysis Failed", "Could not analyze performance. Please try again.");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [formPlatform, formContentType, formTitle, formViews, formLikes, formShares, formComments, niche, analyzeMutation, entries, selectedCalendarId, selectedDayOfWeek]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Delete Entry", "Remove this performance entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const updated = entries.filter((e) => e.id !== id);
          setEntries(updated);
          await saveEntries(updated);
          if (selectedEntry?.id === id) setSelectedEntry(null);
        },
      },
    ]);
  }, [entries, selectedEntry]);

  const platformColor = PLATFORM_COLORS[formPlatform];

  // ── Add Form ──
  if (view === "add") {
    return (
      <ScreenContainer>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.navy }]}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => setView("list")}
                activeOpacity={0.8}
                style={[styles.backBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              >
                <IconSymbol name="chevron.left" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Log Post Performance</Text>
                <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
                  Enter your post metrics for AI analysis
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.content}>
            {/* From Calendar */}
            {availableCalendarEntries.length > 0 && (
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sectionHeaderRow}>
                  <IconSymbol name="calendar" size={15} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>From Your Content Plan</Text>
                </View>
                <Text style={[styles.sectionHint, { color: colors.muted }]}>
                  Tap a planned post to auto-fill the form below.
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                  <View style={styles.calendarChipRow}>
                    {availableCalendarEntries.map((ce) => {
                      const isSelected = selectedCalendarId === ce.id;
                      const pColor = PLATFORM_COLORS[ce.platform];
                      return (
                        <TouchableOpacity
                          key={ce.id}
                          onPress={() => isSelected ? handleClearCalendarEntry() : handleSelectCalendarEntry(ce)}
                          activeOpacity={0.8}
                          style={[
                            styles.calendarChip,
                            {
                              backgroundColor: isSelected ? pColor + "20" : colors.background,
                              borderColor: isSelected ? pColor : colors.border,
                            },
                          ]}
                        >
                          <View style={[styles.calendarChipDot, { backgroundColor: pColor }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.calendarChipTitle, { color: colors.foreground }]} numberOfLines={1}>
                              {ce.ideaTitle}
                            </Text>
                            <Text style={[styles.calendarChipMeta, { color: colors.muted }]}>
                              {ce.platform} · {formatDate(ce.date)}
                            </Text>
                          </View>
                          {isSelected && (
                            <IconSymbol name="checkmark.circle.fill" size={16} color={pColor} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Platform */}
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Platform</Text>
              <View style={styles.chipWrap}>
                {PLATFORMS.map((p) => {
                  const isActive = formPlatform === p.id;
                  const pColor = PLATFORM_COLORS[p.id];
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setFormPlatform(p.id)}
                      activeOpacity={0.8}
                      style={[styles.chip, { backgroundColor: isActive ? pColor : colors.background, borderColor: isActive ? pColor : colors.border }]}
                    >
                      <Text style={[styles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Content Type */}
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Content Type</Text>
              <View style={styles.chipWrap}>
                {CONTENT_TYPES.slice(0, 8).map((ct) => {
                  const isActive = formContentType === ct.id;
                  return (
                    <TouchableOpacity
                      key={ct.id}
                      onPress={() => setFormContentType(ct.id)}
                      activeOpacity={0.8}
                      style={[styles.chip, { backgroundColor: isActive ? colors.primary : colors.background, borderColor: isActive ? colors.primary : colors.border }]}
                    >
                      <Text style={[styles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>{ct.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Post Title */}
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Post Title / Description *</Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. 5 morning habits that changed my life..."
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            {/* Metrics */}
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Post Metrics</Text>
              <View style={styles.metricsGrid}>
                {[
                  { label: "Views / Reach", value: formViews, setter: setFormViews, icon: "👁", color: "#6366F1" },
                  { label: "Likes", value: formLikes, setter: setFormLikes, icon: "❤️", color: "#E1306C" },
                  { label: "Shares", value: formShares, setter: setFormShares, icon: "🔁", color: "#10B981" },
                  { label: "Comments", value: formComments, setter: setFormComments, icon: "💬", color: "#F59E0B" },
                ].map((metric) => (
                  <View key={metric.label} style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={styles.metricIcon}>{metric.icon}</Text>
                    <Text style={[styles.metricLabel, { color: colors.muted }]}>{metric.label}</Text>
                    <TextInput
                      value={metric.value}
                      onChangeText={metric.setter}
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      returnKeyType="done"
                      style={[styles.metricInput, { color: colors.foreground, borderColor: metric.color + "40" }]}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Analyze Button */}
            <TouchableOpacity
              onPress={handleAnalyze}
              activeOpacity={0.85}
              disabled={isAnalyzing}
              style={[styles.analyzeBtn, { backgroundColor: isAnalyzing ? colors.muted : platformColor }]}
            >
              {isAnalyzing ? (
                <><ActivityIndicator size="small" color="#FFFFFF" /><Text style={styles.analyzeBtnText}>Analyzing...</Text></>
              ) : (
                <><IconSymbol name="chart.bar.fill" size={20} color="#FFFFFF" /><Text style={styles.analyzeBtnText}>Analyze Performance</Text></>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── List View ──
  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.navy }]}>
        <View style={styles.headerRow}>
          <View style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <IconSymbol name="chart.bar.fill" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Performance Tracker</Text>
            <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
              Log posts & track what's working over time
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setView("add")}
            activeOpacity={0.8}
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
          >
            <IconSymbol name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Log Post</Text>
          </TouchableOpacity>
        </View>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Posts Tracked Yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.muted }]}>
            Log your published posts to get AI-powered performance analysis and discover what content resonates most with your audience.
          </Text>
          <TouchableOpacity
            onPress={() => setView("add")}
            activeOpacity={0.85}
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
          >
            <IconSymbol name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.emptyBtnText}>Log Your First Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Summary Stats */}
              <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{entries.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Posts Tracked</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: "#10B981" }]}>
                    {entries.filter((e) => ["excellent", "good"].includes(e.performanceRating)).length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>High Performers</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.accent }]}>
                    {Math.round(entries.reduce((sum, e) => sum + e.performanceScore, 0) / entries.length)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Score</Text>
                </View>
              </View>

              {/* Pattern Analysis */}
              <PatternSummary entries={entries} colors={colors} />
            </>
          }
          renderItem={({ item }) => {
            const pColor = PLATFORM_COLORS[item.platform];
            const rColor = RATING_COLORS[item.performanceRating] ?? colors.muted;
            const isExpanded = selectedEntry?.id === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedEntry(isExpanded ? null : item)}
                activeOpacity={0.9}
                style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: isExpanded ? pColor + "60" : colors.border }]}
              >
                {/* Card Header */}
                <View style={styles.entryHeader}>
                  <View style={[styles.platformBadge, { backgroundColor: pColor + "15" }]}>
                    <Text style={[styles.platformBadgeText, { color: pColor }]}>
                      {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                    </Text>
                  </View>
                  <View style={[styles.ratingBadge, { backgroundColor: rColor + "15" }]}>
                    <View style={[styles.ratingDot, { backgroundColor: rColor }]} />
                    <Text style={[styles.ratingText, { color: rColor }]}>{RATING_LABELS[item.performanceRating] ?? item.performanceRating}</Text>
                  </View>
                  <Text style={[styles.scoreText, { color: colors.foreground }]}>{item.performanceScore}/100</Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                    style={styles.deleteBtn}
                  >
                    <IconSymbol name="trash" size={14} color={colors.muted} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.entryTitle, { color: colors.foreground }]} numberOfLines={isExpanded ? undefined : 2}>
                  {item.title}
                </Text>

                {/* Day of week badge if available */}
                {item.dayOfWeek && (
                  <View style={[styles.dayBadge, { backgroundColor: colors.primary + "12" }]}>
                    <IconSymbol name="calendar" size={11} color={colors.primary} />
                    <Text style={[styles.dayBadgeText, { color: colors.primary }]}>Posted on {item.dayOfWeek}</Text>
                  </View>
                )}

                {/* Metrics Row */}
                <View style={styles.metricsRow}>
                  {[
                    { label: "Views", value: item.views.toLocaleString(), color: "#6366F1" },
                    { label: "Likes", value: item.likes.toLocaleString(), color: "#E1306C" },
                    { label: "Shares", value: item.shares.toLocaleString(), color: "#10B981" },
                    { label: "ER", value: item.engagementRate, color: "#F59E0B" },
                  ].map((m) => (
                    <View key={m.label} style={[styles.metricPill, { backgroundColor: m.color + "12" }]}>
                      <Text style={[styles.metricPillValue, { color: m.color }]}>{m.value}</Text>
                      <Text style={[styles.metricPillLabel, { color: colors.muted }]}>{m.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Expanded Detail */}
                {isExpanded && (
                  <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
                    <Text style={[styles.expandedText, { color: colors.muted }]}>{item.benchmarkComparison}</Text>

                    <View style={styles.insightSection}>
                      <Text style={[styles.insightTitle, { color: "#10B981" }]}>What Worked</Text>
                      {item.strengths.map((s, i) => (
                        <View key={i} style={styles.insightRow}>
                          <View style={[styles.insightDot, { backgroundColor: "#10B981" }]} />
                          <Text style={[styles.insightText, { color: colors.foreground }]}>{s}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.insightSection}>
                      <Text style={[styles.insightTitle, { color: "#F59E0B" }]}>Improvements</Text>
                      {item.improvements.map((s, i) => (
                        <View key={i} style={styles.insightRow}>
                          <View style={[styles.insightDot, { backgroundColor: "#F59E0B" }]} />
                          <Text style={[styles.insightText, { color: colors.foreground }]}>{s}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.insightSection}>
                      <Text style={[styles.insightTitle, { color: colors.primary }]}>Next Post Tips</Text>
                      {item.nextPostTips.map((tip, i) => (
                        <View key={i} style={styles.insightRow}>
                          <View style={[styles.insightDot, { backgroundColor: colors.primary }]} />
                          <Text style={[styles.insightText, { color: colors.foreground }]}>{tip}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={[styles.entryDate, { color: colors.muted }]}>
                      Logged {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                <View style={styles.expandHint}>
                  <IconSymbol name={isExpanded ? "chevron.up" : "chevron.down"} size={14} color={colors.muted} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  headerSub: { fontSize: 12, marginTop: 2 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  content: { padding: 16, gap: 12 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  sectionHint: { fontSize: 12, lineHeight: 17, marginTop: -6 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: "600" },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 20 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center", gap: 4, minWidth: "45%", flex: 1 },
  metricIcon: { fontSize: 22 },
  metricLabel: { fontSize: 11, fontWeight: "600" },
  metricInput: { borderBottomWidth: 1.5, paddingVertical: 4, fontSize: 18, fontWeight: "800", textAlign: "center", minWidth: 80 },
  analyzeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16 },
  analyzeBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  emptyDesc: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  listContent: { padding: 16, gap: 12 },
  statsRow: { flexDirection: "row", borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 4, justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  statDivider: { width: 1, height: "100%" },
  entryCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 10 },
  entryHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  platformBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  platformBadgeText: { fontSize: 11, fontWeight: "700" },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingDot: { width: 6, height: 6, borderRadius: 3 },
  ratingText: { fontSize: 11, fontWeight: "700" },
  scoreText: { flex: 1, textAlign: "right", fontSize: 14, fontWeight: "800" },
  deleteBtn: { padding: 4 },
  entryTitle: { fontSize: 15, fontWeight: "700", lineHeight: 21 },
  dayBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  dayBadgeText: { fontSize: 11, fontWeight: "600" },
  metricsRow: { flexDirection: "row", gap: 8 },
  metricPill: { flex: 1, borderRadius: 8, padding: 8, alignItems: "center", gap: 2 },
  metricPillValue: { fontSize: 13, fontWeight: "800" },
  metricPillLabel: { fontSize: 10, fontWeight: "600" },
  expandedSection: { borderTopWidth: 1, paddingTop: 12, gap: 10 },
  expandedText: { fontSize: 13, lineHeight: 19 },
  insightSection: { gap: 6 },
  insightTitle: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  insightDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  insightText: { flex: 1, fontSize: 13, lineHeight: 19 },
  entryDate: { fontSize: 11, textAlign: "right" },
  expandHint: { alignItems: "center" },
  calendarChipRow: { flexDirection: "row", gap: 8, paddingHorizontal: 4, paddingBottom: 4 },
  calendarChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1.5, padding: 10, maxWidth: 240, minWidth: 180 },
  calendarChipDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  calendarChipTitle: { fontSize: 13, fontWeight: "700", lineHeight: 18 },
  calendarChipMeta: { fontSize: 11, lineHeight: 15 },
});
