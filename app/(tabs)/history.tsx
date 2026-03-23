import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
  Share,
  Modal,
  ScrollView,
  Clipboard,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSavedIdeas } from "@/lib/saved-ideas-context";
import { ContentIdea, UrlAnalysis, PLATFORMS } from "@/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const SAVED_ANALYSES_KEY = "@contentcraft_analyses";

type Tab = "ideas" | "analyses";

// ─── Full Idea Modal ──────────────────────────────────────────────────────────

function IdeaDetailModal({
  idea,
  visible,
  onClose,
  colors,
}: {
  idea: ContentIdea | null;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  if (!idea) return null;
  const platformColor = PLATFORMS.find((p) => p.id === idea.platform)?.color ?? colors.primary;
  const platformLabel = PLATFORMS.find((p) => p.id === idea.platform)?.label ?? idea.platform;

  const fullText = `📌 ${idea.title}\n\n🎣 Hook:\n${idea.hook}\n\n📝 Body:\n${idea.body}\n\n📣 CTA:\n${idea.cta}\n\n🏷️ Platform: ${platformLabel} | Type: ${idea.contentType} | Niche: ${idea.niche}`;

  const handleCopy = () => {
    Clipboard.setString(fullText);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Copied!", "Full idea copied to clipboard.");
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: fullText, title: idea.title });
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          {/* Handle */}
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={modalStyles.header}>
            <View style={{ flex: 1, gap: 6 }}>
              <View style={modalStyles.badgeRow}>
                <View style={[modalStyles.platformBadge, { backgroundColor: platformColor + "18", borderColor: platformColor + "40" }]}>
                  <Text style={[modalStyles.platformBadgeText, { color: platformColor }]}>{platformLabel}</Text>
                </View>
                <View style={[modalStyles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
                  <Text style={[modalStyles.typeBadgeText, { color: colors.primary }]}>{idea.contentType}</Text>
                </View>
              </View>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>{idea.title}</Text>
              <Text style={[modalStyles.niche, { color: colors.muted }]}>Niche: {idea.niche}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
            {/* Hook */}
            <View style={[modalStyles.section, { backgroundColor: colors.primary + "0A", borderLeftColor: colors.primary }]}>
              <View style={modalStyles.sectionHeader}>
                <IconSymbol name="bolt.fill" size={14} color={colors.primary} />
                <Text style={[modalStyles.sectionLabel, { color: colors.primary }]}>HOOK</Text>
              </View>
              <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{idea.hook}</Text>
            </View>

            {/* Body */}
            <View style={[modalStyles.section, { backgroundColor: colors.surface, borderLeftColor: colors.accent }]}>
              <View style={modalStyles.sectionHeader}>
                <IconSymbol name="doc.text.fill" size={14} color={colors.accent} />
                <Text style={[modalStyles.sectionLabel, { color: colors.accent }]}>BODY</Text>
              </View>
              <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{idea.body}</Text>
            </View>

            {/* CTA */}
            <View style={[modalStyles.section, { backgroundColor: "#10B98108", borderLeftColor: "#10B981" }]}>
              <View style={modalStyles.sectionHeader}>
                <IconSymbol name="hand.thumbsup.fill" size={14} color="#10B981" />
                <Text style={[modalStyles.sectionLabel, { color: "#10B981" }]}>CALL TO ACTION</Text>
              </View>
              <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{idea.cta}</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={modalStyles.actions}>
            <TouchableOpacity
              onPress={handleCopy}
              activeOpacity={0.8}
              style={[modalStyles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <IconSymbol name="doc.on.doc" size={18} color={colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: colors.foreground }]}>Copy All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.8}
              style={[modalStyles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
              <Text style={[modalStyles.actionBtnText, { color: "#FFFFFF" }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Export Modal ─────────────────────────────────────────────────────────────

function ExportModal({
  ideas,
  visible,
  onClose,
  colors,
}: {
  ideas: ContentIdea[];
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  const filteredIdeas = selectedPlatform === "all"
    ? ideas
    : ideas.filter((i) => i.platform === selectedPlatform);

  const exportText = filteredIdeas.length === 0
    ? "No ideas found for this platform."
    : filteredIdeas.map((idea, idx) =>
        `━━━ IDEA ${idx + 1}: ${idea.platform.toUpperCase()} | ${idea.contentType.toUpperCase()} ━━━\n📌 ${idea.title}\n\n🎣 Hook:\n${idea.hook}\n\n📝 Body:\n${idea.body}\n\n📣 CTA:\n${idea.cta}\n`
      ).join("\n");

  const handleCopy = () => {
    Clipboard.setString(exportText);
    setCopied(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const platformLabel = selectedPlatform === "all" ? "All Platforms" : PLATFORMS.find((p) => p.id === selectedPlatform)?.label ?? selectedPlatform;
      await Share.share({
        message: exportText,
        title: `ContentCraft Ideas — ${platformLabel}`,
      });
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />

          <View style={modalStyles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>Export Ideas</Text>
              <Text style={[modalStyles.niche, { color: colors.muted }]}>
                Compile ideas by platform into a single text block
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Platform Filter */}
          <View style={exportStyles.filterLabel}>
            <Text style={[exportStyles.filterLabelText, { color: colors.foreground }]}>Filter by Platform</Text>
          </View>
          <View style={exportStyles.platformRow}>
            {[{ id: "all", label: "All", color: colors.primary }, ...PLATFORMS].map((p) => {
              const isActive = selectedPlatform === p.id;
              const pColor = p.id === "all" ? colors.primary : (PLATFORMS.find((pl) => pl.id === p.id)?.color ?? colors.primary);
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedPlatform(p.id)}
                  activeOpacity={0.75}
                  style={[
                    exportStyles.platformChip,
                    {
                      backgroundColor: isActive ? pColor : colors.surface,
                      borderColor: isActive ? pColor : colors.border,
                    },
                  ]}
                >
                  <Text style={[exportStyles.platformChipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Count */}
          <Text style={[exportStyles.countText, { color: colors.muted }]}>
            {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? "s" : ""} selected
          </Text>

          {/* Preview */}
          <ScrollView
            style={[exportStyles.previewBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[exportStyles.previewText, { color: colors.foreground }]}>{exportText}</Text>
          </ScrollView>

          {/* Actions */}
          <View style={modalStyles.actions}>
            <TouchableOpacity
              onPress={handleCopy}
              activeOpacity={0.8}
              style={[modalStyles.actionBtn, { backgroundColor: copied ? "#10B981" : colors.surface, borderColor: copied ? "#10B981" : colors.border }]}
            >
              <IconSymbol name={copied ? "checkmark.circle.fill" : "doc.on.doc"} size={18} color={copied ? "#FFFFFF" : colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: copied ? "#FFFFFF" : colors.foreground }]}>
                {copied ? "Copied!" : "Copy All"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.8}
              style={[modalStyles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
              <Text style={[modalStyles.actionBtnText, { color: "#FFFFFF" }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main History Screen ──────────────────────────────────────────────────────

export default function HistoryScreen() {
  const colors = useColors();
  const { savedIdeas, removeIdea } = useSavedIdeas();
  const [activeTab, setActiveTab] = useState<Tab>("ideas");
  const [analyses, setAnalyses] = useState<UrlAnalysis[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const loadAnalyses = useCallback(async () => {
    const data = await AsyncStorage.getItem(SAVED_ANALYSES_KEY);
    if (data) setAnalyses(JSON.parse(data));
  }, []);

  useEffect(() => { loadAnalyses(); }, [loadAnalyses]);

  const deleteAnalysis = useCallback(async (id: string) => {
    const updated = analyses.filter((a) => a.id !== id);
    setAnalyses(updated);
    await AsyncStorage.setItem(SAVED_ANALYSES_KEY, JSON.stringify(updated));
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [analyses]);

  const clearAllIdeas = useCallback(() => {
    Alert.alert("Clear All Saved Ideas", "This will permanently delete all saved ideas. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All", style: "destructive",
        onPress: async () => {
          for (const idea of savedIdeas) await removeIdea(idea.id);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [savedIdeas, removeIdea]);

  const clearAllAnalyses = useCallback(() => {
    Alert.alert("Clear All Analyses", "This will permanently delete all saved URL analyses. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All", style: "destructive",
        onPress: async () => {
          setAnalyses([]);
          await AsyncStorage.setItem(SAVED_ANALYSES_KEY, JSON.stringify([]));
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, []);

  const shareIdea = useCallback(async (idea: ContentIdea) => {
    const platformLabel = PLATFORMS.find((p) => p.id === idea.platform)?.label ?? idea.platform;
    const text = `📌 ${idea.title}\n\n🎣 Hook:\n${idea.hook}\n\n📝 Body:\n${idea.body}\n\n📣 CTA:\n${idea.cta}\n\n🏷️ ${platformLabel} | ${idea.contentType} | ${idea.niche}`;
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: text, title: idea.title });
    } catch {}
  }, []);

  const getPlatformColor = (platformId: string) =>
    PLATFORMS.find((p) => p.id === platformId)?.color ?? colors.primary;

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#10B981";
    if (score >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return dateStr; }
  };

  const renderIdeaItem = ({ item: idea }: { item: ContentIdea }) => {
    const platformColor = getPlatformColor(idea.platform);
    const platform = PLATFORMS.find((p) => p.id === idea.platform);
    return (
      <TouchableOpacity
        onPress={() => { setSelectedIdea(idea); setShowIdeaModal(true); }}
        activeOpacity={0.92}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.platformBadge, { backgroundColor: platformColor + "18", borderColor: platformColor + "40" }]}>
            <Text style={[styles.platformBadgeText, { color: platformColor }]}>{platform?.label ?? idea.platform}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{idea.contentType}</Text>
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

        {/* Hook preview */}
        <View style={[styles.hookBox, { backgroundColor: colors.primary + "08", borderLeftColor: colors.primary }]}>
          <Text style={[styles.hookLabel, { color: colors.primary }]}>Hook</Text>
          <Text style={[styles.hookText, { color: colors.foreground }]} numberOfLines={2}>{idea.hook}</Text>
        </View>

        {/* Tap hint */}
        <Text style={[styles.tapHint, { color: colors.muted }]}>Tap to view full idea</Text>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => { setSelectedIdea(idea); setShowIdeaModal(true); }}
            activeOpacity={0.7}
            style={[styles.actionBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}
          >
            <IconSymbol name="eye.fill" size={14} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => shareIdea(idea)}
            activeOpacity={0.7}
            style={[styles.actionBtn, { backgroundColor: colors.accent + "12", borderColor: colors.accent + "30" }]}
          >
            <IconSymbol name="square.and.arrow.up" size={14} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.accent }]}>Share</Text>
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
      </TouchableOpacity>
    );
  };

  const renderAnalysisItem = ({ item: analysis }: { item: UrlAnalysis }) => {
    const scoreColor = getScoreColor(analysis.resonanceScore);
    const platformColor = analysis.platform ? getPlatformColor(analysis.platform) : colors.primary;
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          {analysis.platform && (
            <View style={[styles.platformBadge, { backgroundColor: platformColor + "18", borderColor: platformColor + "40" }]}>
              <Text style={[styles.platformBadgeText, { color: platformColor }]}>
                {analysis.platform.charAt(0).toUpperCase() + analysis.platform.slice(1)}
              </Text>
            </View>
          )}
          <View style={[styles.scorePill, { backgroundColor: scoreColor + "18" }]}>
            <Text style={[styles.scorePillText, { color: scoreColor }]}>Score: {analysis.resonanceScore}/100</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(analysis.createdAt)}</Text>
        </View>
        <Text style={[styles.urlText, { color: colors.muted }]} numberOfLines={1} ellipsizeMode="middle">{analysis.url}</Text>
        {analysis.title && (
          <Text style={[styles.ideaTitle, { color: colors.foreground }]} numberOfLines={2}>{analysis.title}</Text>
        )}
        <Text style={[styles.summaryText, { color: colors.foreground }]} numberOfLines={3}>{analysis.summary}</Text>
        {analysis.whatWorked.length > 0 && (
          <View style={[styles.workedBox, { backgroundColor: "#10B98110", borderLeftColor: "#10B981" }]}>
            <Text style={[styles.workedLabel, { color: "#10B981" }]}>What Worked</Text>
            <Text style={[styles.workedText, { color: colors.foreground }]} numberOfLines={2}>{analysis.whatWorked[0]}</Text>
          </View>
        )}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => deleteAnalysis(analysis.id)}
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
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>History</Text>
            <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
              Your saved ideas and content analyses
            </Text>
          </View>
          {activeTab === "ideas" && !ideasEmpty && (
            <TouchableOpacity
              onPress={() => setShowExportModal(true)}
              activeOpacity={0.8}
              style={[styles.exportBtn, { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" }]}
            >
              <IconSymbol name="square.and.arrow.up" size={15} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Export</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("ideas")}
          activeOpacity={0.75}
          style={[styles.tabBtn, activeTab === "ideas" && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
        >
          <IconSymbol name="lightbulb.fill" size={16} color={activeTab === "ideas" ? colors.primary : colors.muted} />
          <Text style={[styles.tabBtnText, { color: activeTab === "ideas" ? colors.primary : colors.muted }]}>
            Saved Ideas ({savedIdeas.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("analyses")}
          activeOpacity={0.75}
          style={[styles.tabBtn, activeTab === "analyses" && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
        >
          <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={activeTab === "analyses" ? colors.primary : colors.muted} />
          <Text style={[styles.tabBtnText, { color: activeTab === "analyses" ? colors.primary : colors.muted }]}>
            Analyses ({analyses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Clear All */}
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

      {/* Modals */}
      <IdeaDetailModal
        idea={selectedIdea}
        visible={showIdeaModal}
        onClose={() => setShowIdeaModal(false)}
        colors={colors}
      />
      <ExportModal
        ideas={savedIdeas}
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        colors={colors}
      />
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { fontSize: 14, marginTop: 2 },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  exportBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, marginTop: 4 },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomWidth: 2 },
  tabBtnText: { fontSize: 13, fontWeight: "700" },
  clearRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#EF444412" },
  clearBtnText: { fontSize: 13, fontWeight: "600", color: "#EF4444" },
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, marginBottom: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  platformBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  platformBadgeText: { fontSize: 11, fontWeight: "700" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  dateText: { fontSize: 11, marginLeft: "auto" },
  nicheBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  nicheBadgeText: { fontSize: 11, fontWeight: "500" },
  ideaTitle: { fontSize: 15, fontWeight: "700", lineHeight: 21, letterSpacing: -0.2 },
  hookBox: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, borderRadius: 4, gap: 2 },
  hookLabel: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  hookText: { fontSize: 13, lineHeight: 19 },
  tapHint: { fontSize: 11, fontStyle: "italic" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: "600" },
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  scorePillText: { fontSize: 11, fontWeight: "700" },
  urlText: { fontSize: 12, fontStyle: "italic" },
  summaryText: { fontSize: 13, lineHeight: 19 },
  workedBox: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, borderRadius: 4, gap: 2 },
  workedLabel: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  workedText: { fontSize: 13, lineHeight: 19 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 16 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "800", textAlign: "center", letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 21 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "transparent" },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20, paddingBottom: 32,
    maxHeight: "88%", elevation: 32,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  platformBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  platformBadgeText: { fontSize: 11, fontWeight: "700" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  title: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3, lineHeight: 24 },
  niche: { fontSize: 13, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  section: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 10, borderRadius: 6, gap: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  sectionText: { fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  actionBtnText: { fontSize: 15, fontWeight: "700" },
});

const exportStyles = StyleSheet.create({
  filterLabel: { marginBottom: 8 },
  filterLabelText: { fontSize: 14, fontWeight: "700" },
  platformRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  platformChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  platformChipText: { fontSize: 13, fontWeight: "600" },
  countText: { fontSize: 13, marginBottom: 8 },
  previewBox: { maxHeight: 220, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4 },
  previewText: { fontSize: 12, lineHeight: 18, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
});
