import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
  Clipboard,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSavedIdeas } from "@/lib/saved-ideas-context";
import { UrlAnalysis, PLATFORMS } from "@/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const SAVED_ANALYSES_KEY = "@contentcraft_analyses";

type Tab = "ideas" | "analyses";

export default function HistoryScreen() {
  const colors = useColors();
  const { savedIdeas, removeIdea } = useSavedIdeas();
  const [activeTab, setActiveTab] = useState<Tab>("ideas");
  const [analyses, setAnalyses] = useState<UrlAnalysis[]>([]);

  const loadAnalyses = useCallback(async () => {
    const data = await AsyncStorage.getItem(SAVED_ANALYSES_KEY);
    if (data) setAnalyses(JSON.parse(data));
  }, []);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  const deleteAnalysis = useCallback(async (id: string) => {
    const updated = analyses.filter((a) => a.id !== id);
    setAnalyses(updated);
    await AsyncStorage.setItem(SAVED_ANALYSES_KEY, JSON.stringify(updated));
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [analyses]);

  const clearAllIdeas = useCallback(() => {
    Alert.alert(
      "Clear All Saved Ideas",
      "This will permanently delete all saved ideas. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            for (const idea of savedIdeas) await removeIdea(idea.id);
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [savedIdeas, removeIdea]);

  const clearAllAnalyses = useCallback(() => {
    Alert.alert(
      "Clear All Analyses",
      "This will permanently delete all saved URL analyses. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setAnalyses([]);
            await AsyncStorage.setItem(SAVED_ANALYSES_KEY, JSON.stringify([]));
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, []);

  const copyIdea = useCallback((text: string) => {
    Clipboard.setString(text);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const getPlatformColor = (platformId: string) => {
    return PLATFORMS.find((p) => p.id === platformId)?.color ?? colors.primary;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#10B981";
    if (score >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const renderIdeaItem = ({ item: idea }: { item: typeof savedIdeas[0] }) => {
    const platformColor = getPlatformColor(idea.platform);
    const platform = PLATFORMS.find((p) => p.id === idea.platform);
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.platformBadge, { backgroundColor: platformColor + "18", borderColor: platformColor + "40" }]}>
            <Text style={[styles.platformBadgeText, { color: platformColor }]}>
              {platform?.label ?? idea.platform}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
              {idea.contentType}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(idea.createdAt)}</Text>
        </View>

        {/* Niche */}
        <View style={[styles.nicheBadge, { backgroundColor: colors.border }]}>
          <IconSymbol name="tag.fill" size={11} color={colors.muted} />
          <Text style={[styles.nicheBadgeText, { color: colors.muted }]}>{idea.niche}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.ideaTitle, { color: colors.foreground }]}>{idea.title}</Text>

        {/* Hook */}
        <View style={[styles.hookBox, { backgroundColor: colors.primary + "08", borderLeftColor: colors.primary }]}>
          <Text style={[styles.hookLabel, { color: colors.primary }]}>Hook</Text>
          <Text style={[styles.hookText, { color: colors.foreground }]}>{idea.hook}</Text>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => copyIdea(`${idea.title}\n\n${idea.hook}\n\n${idea.body}\n\n${idea.cta}`)}
            activeOpacity={0.7}
            style={[styles.actionBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}
          >
            <IconSymbol name="doc.on.doc" size={14} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Delete Idea", "Remove this idea from your saved list?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => removeIdea(idea.id) },
              ]);
            }}
            activeOpacity={0.7}
            style={[styles.actionBtn, { backgroundColor: "#EF444412", borderColor: "#EF444430" }]}
          >
            <IconSymbol name="trash.fill" size={14} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAnalysisItem = ({ item: analysis }: { item: UrlAnalysis }) => {
    const scoreColor = getScoreColor(analysis.resonanceScore);
    const platformColor = analysis.platform ? getPlatformColor(analysis.platform) : colors.primary;
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          {analysis.platform && (
            <View style={[styles.platformBadge, { backgroundColor: platformColor + "18", borderColor: platformColor + "40" }]}>
              <Text style={[styles.platformBadgeText, { color: platformColor }]}>
                {analysis.platform.charAt(0).toUpperCase() + analysis.platform.slice(1)}
              </Text>
            </View>
          )}
          <View style={[styles.scorePill, { backgroundColor: scoreColor + "18" }]}>
            <Text style={[styles.scorePillText, { color: scoreColor }]}>
              Score: {analysis.resonanceScore}/100
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(analysis.createdAt)}</Text>
        </View>

        {/* URL */}
        <Text style={[styles.urlText, { color: colors.muted }]} numberOfLines={1} ellipsizeMode="middle">
          {analysis.url}
        </Text>

        {/* Title */}
        {analysis.title && (
          <Text style={[styles.ideaTitle, { color: colors.foreground }]} numberOfLines={2}>
            {analysis.title}
          </Text>
        )}

        {/* Summary */}
        <Text style={[styles.summaryText, { color: colors.foreground }]} numberOfLines={3}>
          {analysis.summary}
        </Text>

        {/* What Worked preview */}
        {analysis.whatWorked.length > 0 && (
          <View style={[styles.workedBox, { backgroundColor: "#10B98110", borderLeftColor: "#10B981" }]}>
            <Text style={[styles.workedLabel, { color: "#10B981" }]}>What Worked</Text>
            <Text style={[styles.workedText, { color: colors.foreground }]} numberOfLines={2}>
              {analysis.whatWorked[0]}
            </Text>
          </View>
        )}

        {/* Delete */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Delete Analysis", "Remove this analysis from history?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteAnalysis(analysis.id) },
              ]);
            }}
            activeOpacity={0.7}
            style={[styles.actionBtn, { backgroundColor: "#EF444412", borderColor: "#EF444430" }]}
          >
            <IconSymbol name="trash.fill" size={14} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ideasEmpty = savedIdeas.length === 0;
  const analysesEmpty = analyses.length === 0;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.navy }]}>
        <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>History</Text>
        <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
          Your saved ideas and content analyses
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("ideas")}
          activeOpacity={0.75}
          style={[
            styles.tabBtn,
            activeTab === "ideas" && [styles.tabBtnActive, { borderBottomColor: colors.primary }],
          ]}
        >
          <IconSymbol
            name="lightbulb.fill"
            size={16}
            color={activeTab === "ideas" ? colors.primary : colors.muted}
          />
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === "ideas" ? colors.primary : colors.muted },
            ]}
          >
            Saved Ideas ({savedIdeas.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("analyses")}
          activeOpacity={0.75}
          style={[
            styles.tabBtn,
            activeTab === "analyses" && [styles.tabBtnActive, { borderBottomColor: colors.primary }],
          ]}
        >
          <IconSymbol
            name="chart.line.uptrend.xyaxis"
            size={16}
            color={activeTab === "analyses" ? colors.primary : colors.muted}
          />
          <Text
            style={[
              styles.tabBtnText,
              { color: activeTab === "analyses" ? colors.primary : colors.muted },
            ]}
          >
            Analyses ({analyses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Clear All Button */}
      {((activeTab === "ideas" && !ideasEmpty) || (activeTab === "analyses" && !analysesEmpty)) && (
        <View style={[styles.clearRow, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={activeTab === "ideas" ? clearAllIdeas : clearAllAnalyses}
            activeOpacity={0.7}
            style={styles.clearBtn}
          >
            <IconSymbol name="trash.fill" size={13} color="#EF4444" />
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {activeTab === "ideas" ? (
        ideasEmpty ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="bookmark" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Saved Ideas Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Go to the Ideas tab, generate content ideas, and tap the bookmark icon to save them here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedIdeas}
            keyExtractor={(item) => item.id}
            renderItem={renderIdeaItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : analysesEmpty ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Analyses Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Go to the Analyze tab, paste a social media URL, and your analyses will automatically appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={analyses}
          keyExtractor={(item) => item.id}
          renderItem={renderAnalysisItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginTop: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  clearRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EF444412",
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  platformBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  platformBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  dateText: {
    fontSize: 11,
    marginLeft: "auto",
  },
  nicheBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nicheBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  ideaTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  hookBox: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 2,
  },
  hookLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hookText: {
    fontSize: 13,
    lineHeight: 19,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scorePillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  urlText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 19,
  },
  workedBox: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 2,
  },
  workedLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  workedText: {
    fontSize: 13,
    lineHeight: 19,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
});
