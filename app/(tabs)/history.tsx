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
  useWindowDimensions,
  TextInput,
  Dimensions,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSavedIdeas } from "@/lib/saved-ideas-context";
import { useStorage } from "@/lib/storage-context";
import { ContentIdea, UrlAnalysis, SavedPrompt, SavedCaption, SavedVisual, PLATFORMS } from "@/lib/types";
import { APP_WEB_URL } from "@/constants/app-url";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const SAVED_ANALYSES_KEY = "@contentcraft_niche_analyses";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

type NicheAnalysis = {
  id: string;
  niche: string;
  platform: string;
  savedAt: string;
  result: {
    nicheOverview: string;
    competitorLandscape: {
      dominantAccountTypes: string[];
      commonContentStyles: string[];
      postingPatterns: string;
      toneAndVoice: string;
    };
    contentGaps: Array<{ gap: string; opportunity: string; contentFormat: string }>;
    audiencePainPoints: Array<{ painPoint: string; contentAngle: string }>;
    contentPillars: Array<{ pillar: string; description: string; exampleTopics: string[] }>;
    quickWins: string[];
  };
};

type Tab = "ideas" | "analyses" | "prompts" | "captions" | "visuals";

// ─── Idea Detail Modal ────────────────────────────────────────────────────────

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
  const { height: windowHeight } = useWindowDimensions();
  if (!idea) return null;
  const platformColor = PLATFORMS.find((p) => p.id === idea.platform)?.color ?? colors.primary;
  const platformLabel = PLATFORMS.find((p) => p.id === idea.platform)?.label ?? idea.platform;

  const fullText = `📌 ${idea.title}\n\n🎣 Hook:\n${idea.hook}\n\n📝 Body:\n${idea.body}\n\n📣 CTA:\n${idea.cta}\n\n🏷️ Platform: ${platformLabel} | Type: ${idea.contentType} | Niche: ${idea.niche}\n\n✨ Created with ContentCraft\n${APP_WEB_URL}`;

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
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
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
              <Text style={[modalStyles.subtitle, { color: colors.muted }]}>Niche: {idea.niche}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: windowHeight * 0.9 - 220 }} contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
            <View style={[modalStyles.section, { backgroundColor: colors.primary + "0A", borderLeftColor: colors.primary }]}>
              <View style={modalStyles.sectionHeader}>
                <IconSymbol name="bolt.fill" size={14} color={colors.primary} />
                <Text style={[modalStyles.sectionLabel, { color: colors.primary }]}>HOOK</Text>
              </View>
              <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{idea.hook}</Text>
            </View>
            <View style={[modalStyles.section, { backgroundColor: colors.surface, borderLeftColor: colors.accent ?? "#B8860B" }]}>
              <View style={modalStyles.sectionHeader}>
                <IconSymbol name="doc.text.fill" size={14} color={colors.accent ?? "#B8860B"} />
                <Text style={[modalStyles.sectionLabel, { color: colors.accent ?? "#B8860B" }]}>BODY</Text>
              </View>
              <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{idea.body}</Text>
            </View>
            <View style={[modalStyles.section, { backgroundColor: "#10B98108", borderLeftColor: "#10B981" }]}>
              <View style={modalStyles.sectionHeader}>
                <IconSymbol name="hand.thumbsup.fill" size={14} color="#10B981" />
                <Text style={[modalStyles.sectionLabel, { color: "#10B981" }]}>CALL TO ACTION</Text>
              </View>
              <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{idea.cta}</Text>
            </View>
          </ScrollView>

          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.on.doc" size={18} color={colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: colors.foreground }]}>Copy All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
              <Text style={[modalStyles.actionBtnText, { color: "#FFFFFF" }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Analysis Detail Modal ────────────────────────────────────────────────────

function AnalysisDetailModal({
  analysis,
  visible,
  onClose,
  colors,
}: {
  analysis: NicheAnalysis | null;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const { height: windowHeight } = useWindowDimensions();
  if (!analysis) return null;
  const platformColor = analysis.platform && analysis.platform !== "all"
    ? (PLATFORMS.find((p) => p.id === analysis.platform)?.color ?? colors.primary)
    : colors.primary;

  const r = analysis.result;
  const fullText = [
    `🔍 Niche Intelligence: ${analysis.niche}`,
    analysis.platform !== "all" ? `Platform: ${analysis.platform}` : "",
    `\n📋 Overview:\n${r.nicheOverview}`,
    r.quickWins?.length ? `\n⚡ Quick Wins:\n${r.quickWins.map((w, i) => `${i + 1}. ${w}`).join("\n")}` : "",
    `\n🏆 Competitor Landscape:\nAccount Types: ${r.competitorLandscape.dominantAccountTypes.join(", ")}\nContent Styles: ${r.competitorLandscape.commonContentStyles.join(", ")}`,
    `\n📌 Content Pillars:\n${r.contentPillars.map((p, i) => `${i + 1}. ${p.pillar}: ${p.description}`).join("\n")}`,
    `\n✨ Analyzed with ContentCraft\n${APP_WEB_URL}`,
  ].filter(Boolean).join("\n");

  const handleCopy = () => {
    Clipboard.setString(fullText);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Copied!", "Analysis copied to clipboard.");
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: fullText, title: "Niche Intelligence" });
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
            <View style={{ flex: 1, gap: 6 }}>
              <View style={modalStyles.badgeRow}>
                {analysis.platform && analysis.platform !== "all" && (
                  <View style={[modalStyles.platformBadge, { backgroundColor: platformColor + "18", borderColor: platformColor + "40" }]}>
                    <Text style={[modalStyles.platformBadgeText, { color: platformColor }]}>
                      {analysis.platform.charAt(0).toUpperCase() + analysis.platform.slice(1)}
                    </Text>
                  </View>
                )}
                <View style={[modalStyles.scorePill, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[modalStyles.scorePillText, { color: colors.primary }]}>Niche Intelligence</Text>
                </View>
              </View>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>{analysis.niche}</Text>
              <Text style={[modalStyles.subtitle, { color: colors.muted }]}>{formatDate(analysis.savedAt)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: windowHeight * 0.9 - 220 }} contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
            <View style={[modalStyles.section, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
              <View style={modalStyles.sectionHeader}>
                <IconSymbol name="doc.text.fill" size={14} color={colors.primary} />
                <Text style={[modalStyles.sectionLabel, { color: colors.primary }]}>NICHE OVERVIEW</Text>
              </View>
              <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{r.nicheOverview}</Text>
            </View>

            {r.quickWins?.length > 0 && (
              <View style={[modalStyles.section, { backgroundColor: "#10B98108", borderLeftColor: "#10B981" }]}>
                <View style={modalStyles.sectionHeader}>
                  <IconSymbol name="bolt.fill" size={14} color="#10B981" />
                  <Text style={[modalStyles.sectionLabel, { color: "#10B981" }]}>QUICK WINS</Text>
                </View>
                {r.quickWins.map((win, i) => (
                  <Text key={i} style={[modalStyles.sectionText, { color: colors.foreground }]}>• {win}</Text>
                ))}
              </View>
            )}

            <View style={[modalStyles.section, { backgroundColor: "#8B5CF608", borderLeftColor: "#8B5CF6" }]}>
              <View style={modalStyles.sectionHeader}>
                <IconSymbol name="person.2.fill" size={14} color="#8B5CF6" />
                <Text style={[modalStyles.sectionLabel, { color: "#8B5CF6" }]}>COMPETITOR LANDSCAPE</Text>
              </View>
              <Text style={[modalStyles.sectionText, { color: colors.muted }]}>Account Types: {r.competitorLandscape.dominantAccountTypes.join(", ")}</Text>
              <Text style={[modalStyles.sectionText, { color: colors.muted }]}>Content Styles: {r.competitorLandscape.commonContentStyles.join(", ")}</Text>
              <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{r.competitorLandscape.postingPatterns}</Text>
            </View>

            {r.contentGaps?.length > 0 && (
              <View style={[modalStyles.section, { backgroundColor: "#F59E0B08", borderLeftColor: "#F59E0B" }]}>
                <View style={modalStyles.sectionHeader}>
                  <IconSymbol name="lightbulb.fill" size={14} color="#F59E0B" />
                  <Text style={[modalStyles.sectionLabel, { color: "#F59E0B" }]}>CONTENT GAPS</Text>
                </View>
                {r.contentGaps.map((gap, i) => (
                  <Text key={i} style={[modalStyles.sectionText, { color: colors.foreground }]}>• {gap.gap}</Text>
                ))}
              </View>
            )}

            {r.contentPillars?.length > 0 && (
              <View style={[modalStyles.section, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
                <View style={modalStyles.sectionHeader}>
                  <IconSymbol name="square.grid.2x2.fill" size={14} color={colors.primary} />
                  <Text style={[modalStyles.sectionLabel, { color: colors.primary }]}>CONTENT PILLARS</Text>
                </View>
                {r.contentPillars.map((pillar, i) => (
                  <Text key={i} style={[modalStyles.sectionText, { color: colors.foreground }]}>{i + 1}. {pillar.pillar}: {pillar.description}</Text>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.on.doc" size={18} color={colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: colors.foreground }]}>Copy All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
              <Text style={[modalStyles.actionBtnText, { color: "#FFFFFF" }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Prompt Detail Modal ──────────────────────────────────────────────────────

function PromptDetailModal({
  prompt,
  visible,
  onClose,
  colors,
}: {
  prompt: SavedPrompt | null;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const { height: windowHeight } = useWindowDimensions();
  if (!prompt) return null;
  const toolColor = "#8B5CF6";

  const fullText = `🎨 AI Prompt — ${prompt.tool}\n\nSubject: ${prompt.subject}\nPlatform: ${prompt.platform} | Type: ${prompt.mediaType}\n\nMain Prompt:\n${prompt.mainPrompt}\n\nNegative Prompt:\n${prompt.negativePrompt}${prompt.tips.length > 0 ? `\n\nTips:\n${prompt.tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}` : ""}${prompt.variations.length > 0 ? `\n\nVariations:\n${prompt.variations.map((v, i) => `${i + 1}. ${v}`).join("\n")}` : ""}\n\n✨ Generated with ContentCraft\n${APP_WEB_URL}`;

  const handleCopy = () => {
    Clipboard.setString(prompt.mainPrompt);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Copied!", "Main prompt copied to clipboard.");
  };

  const handleCopyAll = () => {
    Clipboard.setString(fullText);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Copied!", "Full prompt details copied to clipboard.");
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: fullText, title: `AI Prompt — ${prompt.tool}` });
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
            <View style={{ flex: 1, gap: 6 }}>
              <View style={modalStyles.badgeRow}>
                <View style={[modalStyles.platformBadge, { backgroundColor: toolColor + "18", borderColor: toolColor + "40" }]}>
                  <Text style={[modalStyles.platformBadgeText, { color: toolColor }]}>{prompt.tool}</Text>
                </View>
                <View style={[modalStyles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
                  <Text style={[modalStyles.typeBadgeText, { color: colors.primary }]}>{prompt.mediaType}</Text>
                </View>
              </View>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>{prompt.subject || "AI Prompt"}</Text>
              <Text style={[modalStyles.subtitle, { color: colors.muted }]}>
                {prompt.platform.charAt(0).toUpperCase() + prompt.platform.slice(1)} · {prompt.estimatedQuality}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: windowHeight * 0.9 - 220 }} contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
            <View style={[modalStyles.section, { backgroundColor: toolColor + "08", borderLeftColor: toolColor }]}>
              <View style={modalStyles.sectionHeader}>
                <IconSymbol name="wand.and.stars" size={14} color={toolColor} />
                <Text style={[modalStyles.sectionLabel, { color: toolColor }]}>MAIN PROMPT</Text>
              </View>
              <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{prompt.mainPrompt}</Text>
            </View>

            {prompt.negativePrompt ? (
              <View style={[modalStyles.section, { backgroundColor: "#EF444408", borderLeftColor: "#EF4444" }]}>
                <View style={modalStyles.sectionHeader}>
                  <IconSymbol name="minus.circle.fill" size={14} color="#EF4444" />
                  <Text style={[modalStyles.sectionLabel, { color: "#EF4444" }]}>NEGATIVE PROMPT</Text>
                </View>
                <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{prompt.negativePrompt}</Text>
              </View>
            ) : null}

            {prompt.tips.length > 0 && (
              <View style={[modalStyles.section, { backgroundColor: "#F59E0B08", borderLeftColor: "#F59E0B" }]}>
                <View style={modalStyles.sectionHeader}>
                  <IconSymbol name="lightbulb.fill" size={14} color="#F59E0B" />
                  <Text style={[modalStyles.sectionLabel, { color: "#F59E0B" }]}>TIPS</Text>
                </View>
                {prompt.tips.map((tip, i) => (
                  <Text key={i} style={[modalStyles.sectionText, { color: colors.foreground }]}>• {tip}</Text>
                ))}
              </View>
            )}

            {prompt.variations.length > 0 && (
              <View style={[modalStyles.section, { backgroundColor: "#10B98108", borderLeftColor: "#10B981" }]}>
                <View style={modalStyles.sectionHeader}>
                  <IconSymbol name="arrow.triangle.2.circlepath" size={14} color="#10B981" />
                  <Text style={[modalStyles.sectionLabel, { color: "#10B981" }]}>VARIATIONS</Text>
                </View>
                {prompt.variations.map((v, i) => (
                  <Text key={i} style={[modalStyles.sectionText, { color: colors.foreground }]}>{i + 1}. {v}</Text>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.on.doc" size={18} color={colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: colors.foreground }]}>Copy Prompt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: toolColor, borderColor: toolColor }]}>
              <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
              <Text style={[modalStyles.actionBtnText, { color: "#FFFFFF" }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Caption Detail Modal ─────────────────────────────────────────────────────

function CaptionDetailModal({
  caption,
  visible,
  onClose,
  colors,
}: {
  caption: SavedCaption | null;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const { height: windowHeight } = useWindowDimensions();
  if (!caption) return null;
  const PLATFORM_COLORS: Record<string, string> = {
    instagram: "#E1306C", facebook: "#1877F2", tiktok: "#00C2CB", youtube: "#FF0000", linkedin: "#0A66C2",
  };
  const pColor = PLATFORM_COLORS[caption.platform] ?? colors.primary;
  const hashtagStr = caption.hashtags.length > 0
    ? "\n\n" + caption.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")
    : "";
  const fullText = caption.caption + hashtagStr + `\n\n✨ Created with ContentCraft\n${APP_WEB_URL}`;

  const handleCopy = () => {
    Clipboard.setString(fullText);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Copied!", "Caption and hashtags copied to clipboard.");
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: fullText, title: "Caption" });
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
            <View style={{ flex: 1, gap: 6 }}>
              <View style={modalStyles.badgeRow}>
                <View style={[modalStyles.platformBadge, { backgroundColor: pColor + "18", borderColor: pColor + "40" }]}>
                  <Text style={[modalStyles.platformBadgeText, { color: pColor }]}>
                    {caption.platform.charAt(0).toUpperCase() + caption.platform.slice(1)}
                  </Text>
                </View>
                <View style={[modalStyles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
                  <Text style={[modalStyles.typeBadgeText, { color: colors.primary }]}>{caption.tone}</Text>
                </View>
              </View>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>{caption.topic}</Text>
              <Text style={[modalStyles.subtitle, { color: colors.muted }]}>{caption.characterCount} characters</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: windowHeight * 0.9 - 220 }} contentContainerStyle={{ gap: 14, paddingBottom: 24 }}>
            <View style={[modalStyles.section, { backgroundColor: pColor + "08", borderLeftColor: pColor }]}>
              <View style={modalStyles.sectionHeader}>
                <IconSymbol name="text.bubble.fill" size={14} color={pColor} />
                <Text style={[modalStyles.sectionLabel, { color: pColor }]}>CAPTION</Text>
              </View>
              <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>{caption.caption}</Text>
            </View>

            {caption.hashtags.length > 0 && (
              <View style={[modalStyles.section, { backgroundColor: colors.primary + "08", borderLeftColor: colors.primary }]}>
                <View style={modalStyles.sectionHeader}>
                  <IconSymbol name="number" size={14} color={colors.primary} />
                  <Text style={[modalStyles.sectionLabel, { color: colors.primary }]}>HASHTAGS ({caption.hashtags.length})</Text>
                </View>
                <Text style={[modalStyles.sectionText, { color: colors.foreground }]}>
                  {caption.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.on.doc" size={18} color={colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: colors.foreground }]}>Copy All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: pColor, borderColor: pColor }]}>
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
      ).join("\n") + `\n✨ Created with ContentCraft\n${APP_WEB_URL}`;

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
      await Share.share({ message: exportText, title: `ContentCraft Ideas — ${platformLabel}` });
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
              <Text style={[modalStyles.subtitle, { color: colors.muted }]}>Compile ideas by platform into a single text block</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

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
                  style={[exportStyles.platformChip, { backgroundColor: isActive ? pColor : colors.surface, borderColor: isActive ? pColor : colors.border }]}
                >
                  <Text style={[exportStyles.platformChipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[exportStyles.countText, { color: colors.muted }]}>
            {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? "s" : ""} selected
          </Text>

          <ScrollView style={[exportStyles.previewBox, { backgroundColor: colors.surface, borderColor: colors.border }]} showsVerticalScrollIndicator={false}>
            <Text style={[exportStyles.previewText, { color: colors.foreground }]}>{exportText}</Text>
          </ScrollView>

          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: copied ? "#10B981" : colors.surface, borderColor: copied ? "#10B981" : colors.border }]}>
              <IconSymbol name="doc.on.doc" size={18} color={copied ? "#FFFFFF" : colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: copied ? "#FFFFFF" : colors.foreground }]}>{copied ? "Copied!" : "Copy All"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
              <Text style={[modalStyles.actionBtnText, { color: "#FFFFFF" }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Export Analyses Modal ──────────────────────────────────────────────────

function ExportAnalysesModal({
  analyses,
  visible,
  onClose,
  colors,
}: {
  analyses: NicheAnalysis[];
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const [copied, setCopied] = useState(false);

  const exportText = analyses.length === 0
    ? "No analyses saved yet."
    : analyses.map((a, idx) => {
        const r = a.result;
        const lines = [
          `━━━ ANALYSIS ${idx + 1}: ${a.niche.toUpperCase()} ━━━`,
          a.platform && a.platform !== "all" ? `Platform: ${a.platform}` : "Platform: All",
          `Date: ${formatDate(a.savedAt)}`,
          ``,
          `📋 Overview:`,
          r.nicheOverview,
        ];
        if (r.quickWins?.length) {
          lines.push(``, `⚡ Quick Wins:`);
          r.quickWins.forEach((w, i) => lines.push(`${i + 1}. ${w}`));
        }
        if (r.contentPillars?.length) {
          lines.push(``, `📌 Content Pillars:`);
          r.contentPillars.forEach((p, i) => lines.push(`${i + 1}. ${p.pillar}: ${p.description}`));
        }
        if (r.contentGaps?.length) {
          lines.push(``, `🔍 Content Gaps:`);
          r.contentGaps.forEach((g) => lines.push(`• ${g.gap} → ${g.opportunity}`));
        }
        return lines.join("\n");
      }).join("\n\n") + `\n\n✨ Analyzed with ContentCraft\n${APP_WEB_URL}`;

  const handleCopy = () => {
    Clipboard.setString(exportText);
    setCopied(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: exportText, title: "ContentCraft Niche Analyses" });
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose} statusBarTranslucent={true} hardwareAccelerated={true}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <View style={modalStyles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>Export Analyses</Text>
              <Text style={[modalStyles.subtitle, { color: colors.muted }]}>{analyses.length} niche intelligence report{analyses.length !== 1 ? "s" : ""}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={[exportStyles.previewBox, { backgroundColor: colors.surface, borderColor: colors.border }]} showsVerticalScrollIndicator={false}>
            <Text style={[exportStyles.previewText, { color: colors.foreground }]}>{exportText}</Text>
          </ScrollView>
          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: copied ? "#10B981" : colors.surface, borderColor: copied ? "#10B981" : colors.border }]}>
              <IconSymbol name="doc.on.doc" size={18} color={copied ? "#FFFFFF" : colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: copied ? "#FFFFFF" : colors.foreground }]}>{copied ? "Copied!" : "Copy All"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
              <Text style={[modalStyles.actionBtnText, { color: "#FFFFFF" }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Export Prompts Modal ─────────────────────────────────────────────────────

function ExportPromptsModal({
  prompts,
  visible,
  onClose,
  colors,
}: {
  prompts: SavedPrompt[];
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const [copied, setCopied] = useState(false);

  const exportText = prompts.length === 0
    ? "No prompts saved yet."
    : prompts.map((p, idx) => {
        const lines = [
          `━━━ PROMPT ${idx + 1}: ${p.tool.toUpperCase()} | ${p.mediaType.toUpperCase()} ━━━`,
          `Subject: ${p.subject}`,
          `Platform: ${p.platform}`,
          ``,
          `📝 Main Prompt:`,
          p.mainPrompt,
        ];
        if (p.negativePrompt) {
          lines.push(``, `🚫 Negative Prompt:`, p.negativePrompt);
        }
        if (p.variations?.length) {
          lines.push(``, `🔄 Variations:`);
          p.variations.forEach((v, i) => lines.push(`${i + 1}. ${v}`));
        }
        if (p.tips?.length) {
          lines.push(``, `💡 Tips:`);
          p.tips.forEach((t) => lines.push(`• ${t}`));
        }
        return lines.join("\n");
      }).join("\n\n") + `\n\n✨ Created with ContentCraft\n${APP_WEB_URL}`;

  const handleCopy = () => {
    Clipboard.setString(exportText);
    setCopied(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: exportText, title: "ContentCraft AI Prompts" });
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose} statusBarTranslucent={true} hardwareAccelerated={true}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <View style={modalStyles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>Export Prompts</Text>
              <Text style={[modalStyles.subtitle, { color: colors.muted }]}>{prompts.length} AI prompt{prompts.length !== 1 ? "s" : ""}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={[exportStyles.previewBox, { backgroundColor: colors.surface, borderColor: colors.border }]} showsVerticalScrollIndicator={false}>
            <Text style={[exportStyles.previewText, { color: colors.foreground }]}>{exportText}</Text>
          </ScrollView>
          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: copied ? "#10B981" : colors.surface, borderColor: copied ? "#10B981" : colors.border }]}>
              <IconSymbol name="doc.on.doc" size={18} color={copied ? "#FFFFFF" : colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: copied ? "#FFFFFF" : colors.foreground }]}>{copied ? "Copied!" : "Copy All"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
              <Text style={[modalStyles.actionBtnText, { color: "#FFFFFF" }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Export Captions Modal ────────────────────────────────────────────────────

function ExportCaptionsModal({
  captions,
  visible,
  onClose,
  colors,
}: {
  captions: SavedCaption[];
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const [copied, setCopied] = useState(false);

  const exportText = captions.length === 0
    ? "No captions saved yet."
    : captions.map((c, idx) => {
        const lines = [
          `━━━ CAPTION ${idx + 1}: ${c.platform.toUpperCase()} | ${c.tone.toUpperCase()} ━━━`,
          ``,
          `📝 Caption:`,
          c.caption,
        ];
        if (c.hashtags?.length) {
          lines.push(``, `#️⃣ Hashtags:`, c.hashtags.join(" "));
        }
        return lines.join("\n");
      }).join("\n\n") + `\n\n✨ Created with ContentCraft\n${APP_WEB_URL}`;

  const handleCopy = () => {
    Clipboard.setString(exportText);
    setCopied(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: exportText, title: "ContentCraft Captions" });
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose} statusBarTranslucent={true} hardwareAccelerated={true}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <View style={modalStyles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>Export Captions</Text>
              <Text style={[modalStyles.subtitle, { color: colors.muted }]}>{captions.length} caption{captions.length !== 1 ? "s" : ""}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={[exportStyles.previewBox, { backgroundColor: colors.surface, borderColor: colors.border }]} showsVerticalScrollIndicator={false}>
            <Text style={[exportStyles.previewText, { color: colors.foreground }]}>{exportText}</Text>
          </ScrollView>
          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: copied ? "#10B981" : colors.surface, borderColor: copied ? "#10B981" : colors.border }]}>
              <IconSymbol name="doc.on.doc" size={18} color={copied ? "#FFFFFF" : colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: copied ? "#FFFFFF" : colors.foreground }]}>{copied ? "Copied!" : "Copy All"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
              <Text style={[modalStyles.actionBtnText, { color: "#FFFFFF" }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Visual Detail Modal ────────────────────────────────────────────────────

function VisualDetailModal({
  visual,
  visible,
  onClose,
  onDelete,
  colors,
}: {
  visual: SavedVisual | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  colors: any;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const [copied, setCopied] = useState(false);

  if (!visual) return null;

  const handleCopy = () => {
    const text = [
      `🎨 Visual Direction — ${visual.mediaType === "image" ? "Image" : "Video"}`,
      `Platform: ${visual.platform} | Content Type: ${visual.contentType}`,
      `From Idea: ${visual.ideaTitle}`,
      ``,
      `Concept: ${visual.concept}`,
      visual.lighting ? `Lighting: ${visual.lighting}` : "",
      visual.colors ? `Colors: ${visual.colors}` : "",
      visual.cameraAngle ? `Camera Angle: ${visual.cameraAngle}` : "",
      visual.additionalElements?.length ? `Elements: ${Array.isArray(visual.additionalElements) ? visual.additionalElements.join(", ") : visual.additionalElements}` : "",
      visual.promptReadyDescription ? `\nPrompt-Ready Description:\n${visual.promptReadyDescription}` : "",
    ].filter(Boolean).join("\n");
    Clipboard.setString(text);
    setCopied(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2500);
  };

  const platformColor = PLATFORMS.find((p) => p.id === visual.platform)?.color ?? "#F59E0B";

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose} statusBarTranslucent={true} hardwareAccelerated={true}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background, maxHeight: windowHeight * 0.92, minHeight: windowHeight * 0.75 }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <View style={modalStyles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>{visual.mediaType === "image" ? "Image" : "Video"} Visual Direction</Text>
              <Text style={[modalStyles.subtitle, { color: colors.muted }]}>{visual.platform} · {visual.contentType}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            {/* From Idea */}
            <View style={[{ backgroundColor: platformColor + "12", borderLeftWidth: 3, borderLeftColor: platformColor, borderRadius: 10, padding: 12, marginBottom: 14 }]}>
              <Text style={[{ fontSize: 11, fontWeight: "700", color: platformColor, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }]}>From Idea</Text>
              <Text style={[{ fontSize: 14, color: colors.foreground, fontWeight: "600" }]}>{visual.ideaTitle}</Text>
            </View>
            {/* Concept */}
            <View style={[{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }]}>
              <Text style={[{ fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }]}>Concept</Text>
              <Text style={[{ fontSize: 14, color: colors.foreground, lineHeight: 21 }]}>{visual.concept}</Text>
            </View>
            {/* Details Grid */}
            <View style={{ gap: 8, marginBottom: 14 }}>
              {visual.lighting ? (
                <View style={[{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 10, alignItems: "flex-start" }]}>
                  <Text style={{ fontSize: 16 }}>💡</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 11, fontWeight: "700", color: colors.muted, marginBottom: 2 }]}>LIGHTING</Text>
                    <Text style={[{ fontSize: 13, color: colors.foreground, lineHeight: 19 }]}>{visual.lighting}</Text>
                  </View>
                </View>
              ) : null}
              {visual.colors ? (
                <View style={[{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 10, alignItems: "flex-start" }]}>
                  <Text style={{ fontSize: 16 }}>🎨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 11, fontWeight: "700", color: colors.muted, marginBottom: 2 }]}>COLORS</Text>
                    <Text style={[{ fontSize: 13, color: colors.foreground, lineHeight: 19 }]}>{visual.colors}</Text>
                  </View>
                </View>
              ) : null}
              {visual.cameraAngle ? (
                <View style={[{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 10, alignItems: "flex-start" }]}>
                  <Text style={{ fontSize: 16 }}>📷</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 11, fontWeight: "700", color: colors.muted, marginBottom: 2 }]}>CAMERA ANGLE</Text>
                    <Text style={[{ fontSize: 13, color: colors.foreground, lineHeight: 19 }]}>{visual.cameraAngle}</Text>
                  </View>
                </View>
              ) : null}
              {visual.additionalElements && (Array.isArray(visual.additionalElements) ? visual.additionalElements.length > 0 : visual.additionalElements) ? (
                <View style={[{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 10, alignItems: "flex-start" }]}>
                  <Text style={{ fontSize: 16 }}>✨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 11, fontWeight: "700", color: colors.muted, marginBottom: 2 }]}>ADDITIONAL ELEMENTS</Text>
                    <Text style={[{ fontSize: 13, color: colors.foreground, lineHeight: 19 }]}>{Array.isArray(visual.additionalElements) ? visual.additionalElements.join(", ") : visual.additionalElements}</Text>
                  </View>
                </View>
              ) : null}
            </View>
            {/* Prompt-Ready Description */}
            {visual.promptReadyDescription ? (
              <View style={[{ backgroundColor: "#F59E0B10", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#F59E0B40", marginBottom: 14 }]}>
                <Text style={[{ fontSize: 12, fontWeight: "700", color: "#F59E0B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }]}>📋 Prompt-Ready Description</Text>
                <Text style={[{ fontSize: 13, color: colors.foreground, lineHeight: 20, fontStyle: "italic" }]}>{visual.promptReadyDescription}</Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={[modalStyles.actions, { paddingBottom: 8 }]}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: copied ? "#10B981" : colors.surface, borderColor: copied ? "#10B981" : colors.border, flex: 1 }]}>
              <IconSymbol name="doc.on.doc" size={18} color={copied ? "#FFFFFF" : colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: copied ? "#FFFFFF" : colors.foreground }]}>{copied ? "Copied!" : "Copy"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(visual.id)} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: "#EF444415", borderColor: "#EF444440", flex: 1 }]}>
              <IconSymbol name="trash.fill" size={18} color="#EF4444" />
              <Text style={[modalStyles.actionBtnText, { color: "#EF4444" }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Export Visuals Modal ────────────────────────────────────────────────────

function ExportVisualsModal({
  visuals,
  visible,
  onClose,
  colors,
}: {
  visuals: SavedVisual[];
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const [copied, setCopied] = useState(false);
  const { height: windowHeight } = useWindowDimensions();

  const exportText = visuals.length === 0
    ? "No visual directions saved yet."
    : visuals.map((v, idx) => {
        const lines = [
          `━━━ VISUAL ${idx + 1}: ${v.mediaType.toUpperCase()} | ${v.platform.toUpperCase()} ━━━`,
          ``,
          `💡 Concept:`,
          v.concept,
          ``,
          `📌 From Idea: ${v.ideaTitle}`,
        ];
        if (v.lighting) lines.push(``, `💡 Lighting: ${v.lighting}`);
        if (v.colors) lines.push(`🎨 Colors: ${v.colors}`);
        if (v.cameraAngle) lines.push(`📷 Camera Angle: ${v.cameraAngle}`);
        if (v.additionalElements?.length) lines.push(`✨ Elements: ${v.additionalElements.join(", ")}`);
        if (v.promptReadyDescription) lines.push(``, `📋 Prompt-Ready Description:`, v.promptReadyDescription);
        return lines.join("\n");
      }).join("\n\n") + `\n\n✨ Created with ContentCraft\n${APP_WEB_URL}`;

  const handleCopy = () => {
    Clipboard.setString(exportText);
    setCopied(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: exportText, title: "ContentCraft Visual Directions" });
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose} statusBarTranslucent={true} hardwareAccelerated={true}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <View style={modalStyles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>Export Visual Directions</Text>
              <Text style={[modalStyles.subtitle, { color: colors.muted }]}>{visuals.length} visual{visuals.length !== 1 ? "s" : ""}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={[modalStyles.closeBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={[exportStyles.previewBox, { backgroundColor: colors.surface, borderColor: colors.border, maxHeight: windowHeight * 0.9 - 220 }]} showsVerticalScrollIndicator={false}>
            <Text style={[exportStyles.previewText, { color: colors.foreground }]}>{exportText}</Text>
          </ScrollView>
          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={handleCopy} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: copied ? "#10B981" : colors.surface, borderColor: copied ? "#10B981" : colors.border }]}>
              <IconSymbol name="doc.on.doc" size={18} color={copied ? "#FFFFFF" : colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: copied ? "#FFFFFF" : colors.foreground }]}>{copied ? "Copied!" : "Copy All"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={[modalStyles.actionBtn, { backgroundColor: "#F59E0B", borderColor: "#F59E0B" }]}>
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
  const { savedIdeas, removeIdea, toggleStar, updateIdea } = useSavedIdeas();
  const { savedPrompts, removePrompt, clearAllPrompts, savedCaptions, removeCaption, clearAllCaptions, savedVisuals, removeVisual, clearAllVisuals, addCalendarEntry } = useStorage();
  const [activeTab, setActiveTab] = useState<Tab>("ideas");
  const [analyses, setAnalyses] = useState<NicheAnalysis[]>([]);

  // Detail modal state
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<NicheAnalysis | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<SavedPrompt | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState<SavedCaption | null>(null);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportAnalysesModal, setShowExportAnalysesModal] = useState(false);
  const [showExportPromptsModal, setShowExportPromptsModal] = useState(false);
  const [showExportCaptionsModal, setShowExportCaptionsModal] = useState(false);
  const [selectedVisual, setSelectedVisual] = useState<SavedVisual | null>(null);
  const [showVisualModal, setShowVisualModal] = useState(false);
  // Edit idea modal state
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null);
  const [showEditIdeaModal, setShowEditIdeaModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editHook, setEditHook] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCta, setEditCta] = useState("");
  const [showAddToCalendarFromEdit, setShowAddToCalendarFromEdit] = useState(false);
  const [calendarDate, setCalendarDate] = useState("");
  const [calendarTime, setCalendarTime] = useState("");
  const [calendarNotes, setCalendarNotes] = useState("");

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

  const clearAllPromptsFn = useCallback(() => {
    Alert.alert("Clear All Prompts", "This will permanently delete all saved prompts. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => clearAllPrompts() },
    ]);
  }, [clearAllPrompts]);

  const clearAllCaptionsFn = useCallback(() => {
    Alert.alert("Clear All Captions", "This will permanently delete all saved captions. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => clearAllCaptions() },
    ]);
  }, [clearAllCaptions]);

  const clearAllVisualsFn = useCallback(() => {
    Alert.alert("Clear All Visuals", "This will permanently delete all saved visual directions. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => clearAllVisuals() },
    ]);
  }, [clearAllVisuals]);

  const openEditIdea = useCallback((idea: ContentIdea) => {
    setEditingIdea(idea);
    setEditTitle(idea.title);
    setEditHook(idea.hook);
    setEditBody(idea.body);
    setEditCta(idea.cta);
    setCalendarDate("");
    setCalendarTime("");
    setCalendarNotes("");
    setShowAddToCalendarFromEdit(false);
    setShowEditIdeaModal(true);
  }, []);

  const saveEditedIdea = useCallback(async () => {
    if (!editingIdea) return;
    await updateIdea(editingIdea.id, { title: editTitle, hook: editHook, body: editBody, cta: editCta });
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowEditIdeaModal(false);
  }, [editingIdea, editTitle, editHook, editBody, editCta, updateIdea]);

  const addIdeaToCalendar = useCallback(async () => {
    if (!editingIdea || !calendarDate) {
      Alert.alert("Date Required", "Please enter a date (YYYY-MM-DD) to add to the calendar.");
      return;
    }
    const entry: import("@/lib/types").CalendarEntry = {
      id: Date.now().toString(),
      date: calendarDate,
      postTime: calendarTime || undefined,
      ideaId: editingIdea.id,
      ideaTitle: editTitle || editingIdea.title,
      platform: editingIdea.platform,
      contentType: editingIdea.contentType,
      notes: calendarNotes || undefined,
      completed: false,
    };
    await addCalendarEntry(entry);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Added to Calendar!", `"${entry.ideaTitle}" has been added to your Content Planning Calendar for ${calendarDate}.`);
    setShowAddToCalendarFromEdit(false);
    setShowEditIdeaModal(false);
  }, [editingIdea, editTitle, calendarDate, calendarTime, calendarNotes, addCalendarEntry]);

  const shareIdea = useCallback(async (idea: ContentIdea) => {
    const platformLabel = PLATFORMS.find((p) => p.id === idea.platform)?.label ?? idea.platform;
    const text = `📌 ${idea.title}\n\n🎣 Hook:\n${idea.hook}\n\n📝 Body:\n${idea.body}\n\n📣 CTA:\n${idea.cta}\n\n🏷️ ${platformLabel} | ${idea.contentType} | ${idea.niche}\n\n✨ Created with ContentCraft\n${APP_WEB_URL}`;
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

  // ─── Render Functions ───────────────────────────────────────────────────────

  const renderIdeaItem = ({ item: idea }: { item: ContentIdea }) => {
    const platformColor = getPlatformColor(idea.platform);
    const platform = PLATFORMS.find((p) => p.id === idea.platform);
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => { setSelectedIdea(idea); setShowIdeaModal(true); }}
          activeOpacity={0.85}
          style={{ flexGrow: 1, flexShrink: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.platformBadge, { backgroundColor: platformColor + "18", borderColor: platformColor + "40" }]}>
              <Text style={[styles.platformBadgeText, { color: platformColor }]}>{platform?.label ?? idea.platform}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{idea.contentType}</Text>
            </View>
            <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(idea.createdAt)}</Text>
          </View>

          <View style={[styles.nicheBadge, { backgroundColor: colors.border }]}>
            <IconSymbol name="tag.fill" size={11} color={colors.muted} />
            <Text style={[styles.nicheBadgeText, { color: colors.muted }]}>{idea.niche}</Text>
          </View>

          <Text style={[styles.ideaTitle, { color: colors.foreground }]}>{idea.title}</Text>

          <View style={[styles.hookBox, { backgroundColor: colors.primary + "08", borderLeftColor: colors.primary }]}>
            <Text style={[styles.hookLabel, { color: colors.primary }]}>Hook</Text>
            <Text style={[styles.hookText, { color: colors.foreground }]} numberOfLines={2}>{idea.hook}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <Text style={[styles.tapHint, { color: colors.primary }]}>Tap to view full idea →</Text>
          <TouchableOpacity
            onPress={() => openEditIdea(idea)}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: colors.primary + "12" }]}
          >
            <IconSymbol name="pencil" size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleStar(idea.id);
            }}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: idea.starred ? "#F59E0B18" : colors.surface }]}
          >
            <IconSymbol name={idea.starred ? "star.fill" : "star"} size={14} color={idea.starred ? "#F59E0B" : colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => shareIdea(idea)}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: colors.primary + "12" }]}
          >
            <IconSymbol name="square.and.arrow.up" size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Delete Idea", "Remove this idea from your saved list?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => removeIdea(idea.id) },
              ]);
            }}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: "#EF444412" }]}
          >
            <IconSymbol name="trash.fill" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAnalysisItem = ({ item: analysis }: { item: NicheAnalysis }) => {
    const platformColor = analysis.platform && analysis.platform !== "all"
      ? getPlatformColor(analysis.platform)
      : colors.primary;
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => { setSelectedAnalysis(analysis); setShowAnalysisModal(true); }}
          activeOpacity={0.85}
          style={{ flexGrow: 1, flexShrink: 1 }}
        >
          <View style={styles.cardHeader}>
            {analysis.platform && analysis.platform !== "all" && (
              <View style={[styles.platformBadge, { backgroundColor: platformColor + "18", borderColor: platformColor + "40" }]}>
                <Text style={[styles.platformBadgeText, { color: platformColor }]}>
                  {analysis.platform.charAt(0).toUpperCase() + analysis.platform.slice(1)}
                </Text>
              </View>
            )}
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>Niche Intelligence</Text>
            </View>
            <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(analysis.savedAt)}</Text>
          </View>
          <Text style={[styles.ideaTitle, { color: colors.foreground }]} numberOfLines={1}>{analysis.niche}</Text>
          <View style={[styles.hookBox, { backgroundColor: colors.primary + "08", borderLeftColor: colors.primary }]}>
            <Text style={[styles.hookLabel, { color: colors.primary }]}>Overview</Text>
            <Text style={[styles.hookText, { color: colors.foreground }]} numberOfLines={3}>{analysis.result.nicheOverview}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.cardFooter}>
          <Text style={[styles.tapHint, { color: colors.primary }]}>Tap to view full analysis →</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Delete Analysis", "Remove this analysis?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteAnalysis(analysis.id) },
              ]);
            }}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: "#EF444412" }]}
          >
            <IconSymbol name="trash.fill" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPromptItem = ({ item: prompt }: { item: SavedPrompt }) => {
    const toolColor = "#8B5CF6";
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => { setSelectedPrompt(prompt); setShowPromptModal(true); }}
          activeOpacity={0.85}
          style={{ flexGrow: 1, flexShrink: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.platformBadge, { backgroundColor: toolColor + "18", borderColor: toolColor + "40" }]}>
              <Text style={[styles.platformBadgeText, { color: toolColor }]}>{prompt.tool}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{prompt.mediaType}</Text>
            </View>
            <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(prompt.createdAt)}</Text>
          </View>
          <Text style={[styles.ideaTitle, { color: colors.foreground }]} numberOfLines={1}>{prompt.subject || "AI Prompt"}</Text>
          <View style={[styles.hookBox, { backgroundColor: toolColor + "08", borderLeftColor: toolColor }]}>
            <Text style={[styles.hookLabel, { color: toolColor }]}>Prompt</Text>
            <Text style={[styles.hookText, { color: colors.foreground }]} numberOfLines={3}>{prompt.mainPrompt}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.cardFooter}>
          <Text style={[styles.tapHint, { color: toolColor }]}>Tap to view full prompt →</Text>
          <TouchableOpacity
            onPress={() => {
              Clipboard.setString(prompt.mainPrompt);
              Alert.alert("Copied!", "Prompt copied to clipboard.");
            }}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: toolColor + "12" }]}
          >
            <IconSymbol name="doc.on.doc" size={14} color={toolColor} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Delete Prompt", "Remove this prompt?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => removePrompt(prompt.id) },
              ]);
            }}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: "#EF444412" }]}
          >
            <IconSymbol name="trash.fill" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCaptionItem = ({ item: caption }: { item: SavedCaption }) => {
    const PLATFORM_COLORS: Record<string, string> = {
      instagram: "#E1306C", facebook: "#1877F2", tiktok: "#00C2CB", youtube: "#FF0000", linkedin: "#0A66C2",
    };
    const pColor = PLATFORM_COLORS[caption.platform] ?? colors.primary;
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => { setSelectedCaption(caption); setShowCaptionModal(true); }}
          activeOpacity={0.85}
          style={{ flexGrow: 1, flexShrink: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.platformBadge, { backgroundColor: pColor + "18", borderColor: pColor + "40" }]}>
              <Text style={[styles.platformBadgeText, { color: pColor }]}>{caption.platform}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{caption.tone}</Text>
            </View>
            <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(caption.createdAt)}</Text>
          </View>
          <Text style={[styles.ideaTitle, { color: colors.foreground }]} numberOfLines={1}>{caption.topic}</Text>
          <View style={[styles.hookBox, { backgroundColor: pColor + "08", borderLeftColor: pColor }]}>
            <Text style={[styles.hookLabel, { color: pColor }]}>Caption</Text>
            <Text style={[styles.hookText, { color: colors.foreground }]} numberOfLines={3}>{caption.caption}</Text>
          </View>
          {caption.hashtags.length > 0 && (
            <Text style={[styles.summaryText, { color: colors.muted }]} numberOfLines={1}>
              {caption.hashtags.slice(0, 5).map((h) => `#${h.replace(/^#/, "")}`).join(" ")}{caption.hashtags.length > 5 ? " ..." : ""}
            </Text>
          )}
        </TouchableOpacity>
        <View style={styles.cardFooter}>
          <Text style={[styles.tapHint, { color: pColor }]}>Tap to view full caption →</Text>
          <TouchableOpacity
            onPress={() => {
              const hashtagStr = caption.hashtags.length > 0 ? "\n\n" + caption.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ") : "";
              Clipboard.setString(caption.caption + hashtagStr);
              Alert.alert("Copied!", "Caption copied to clipboard.");
            }}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: pColor + "12" }]}
          >
            <IconSymbol name="doc.on.doc" size={14} color={pColor} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Delete Caption", "Remove this caption?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => removeCaption(caption.id) },
              ]);
            }}
            activeOpacity={0.7}
            style={[styles.iconBtn, { backgroundColor: "#EF444412" }]}
          >
            <IconSymbol name="trash.fill" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ideasEmpty = savedIdeas.length === 0;
  const analysesEmpty = analyses.length === 0;
  const promptsEmpty = savedPrompts.length === 0;
  const captionsEmpty = savedCaptions.length === 0;
  const visualsEmpty = savedVisuals.length === 0;
  const [showExportVisualsModal, setShowExportVisualsModal] = useState(false);

  const TABS: { id: Tab; label: string; count: number; icon: any }[] = [
    { id: "ideas", label: "Ideas", count: savedIdeas.length, icon: "lightbulb.fill" },
    { id: "analyses", label: "Analyses", count: analyses.length, icon: "chart.line.uptrend.xyaxis" },
    { id: "prompts", label: "Prompts", count: savedPrompts.length, icon: "wand.and.stars" },
    { id: "captions", label: "Captions", count: savedCaptions.length, icon: "text.bubble.fill" },
    { id: "visuals", label: "Visuals", count: savedVisuals.length, icon: "photo.fill" },
  ];

  return (
    <View style={{ flex: 1 }}>
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Sticky Header + Tabs — these never scroll */}
      <View style={[styles.stickyTop, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.navy }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>History</Text>
              <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
                Your saved ideas and content
              </Text>
            </View>
            {activeTab === "ideas" && !ideasEmpty && (
              <TouchableOpacity onPress={() => setShowExportModal(true)} activeOpacity={0.8} style={[styles.exportBtn, { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" }]}>
                <IconSymbol name="square.and.arrow.up" size={15} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
            )}
            {activeTab === "analyses" && !analysesEmpty && (
              <TouchableOpacity onPress={() => setShowExportAnalysesModal(true)} activeOpacity={0.8} style={[styles.exportBtn, { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" }]}>
                <IconSymbol name="square.and.arrow.up" size={15} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
            )}
            {activeTab === "prompts" && !promptsEmpty && (
              <TouchableOpacity onPress={() => setShowExportPromptsModal(true)} activeOpacity={0.8} style={[styles.exportBtn, { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" }]}>
                <IconSymbol name="square.and.arrow.up" size={15} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
            )}
            {activeTab === "captions" && !captionsEmpty && (
              <TouchableOpacity onPress={() => setShowExportCaptionsModal(true)} activeOpacity={0.8} style={[styles.exportBtn, { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" }]}>
                <IconSymbol name="square.and.arrow.up" size={15} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
            )}
            {activeTab === "visuals" && !visualsEmpty && (
              <TouchableOpacity onPress={() => setShowExportVisualsModal(true)} activeOpacity={0.8} style={[styles.exportBtn, { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" }]}>
                <IconSymbol name="square.and.arrow.up" size={15} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Bar — 4 equal-width tabs, no horizontal scroll */}
        <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const tabColor = tab.id === "prompts" ? "#8B5CF6" : colors.primary;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.id);
                }}
                activeOpacity={0.75}
                style={[
                  styles.tabBtn,
                  isActive && { borderBottomColor: tabColor, borderBottomWidth: 2 },
                ]}
              >
                <IconSymbol name={tab.icon} size={14} color={isActive ? tabColor : colors.muted} />
                <Text style={[styles.tabBtnText, { color: isActive ? tabColor : colors.muted }]} numberOfLines={1}>
                  {tab.label}
                </Text>
                <View style={[styles.tabCount, { backgroundColor: isActive ? tabColor + "18" : colors.surface }]}>
                  <Text style={[styles.tabCountText, { color: isActive ? tabColor : colors.muted }]}>{tab.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Clear All row */}
        {((activeTab === "ideas" && !ideasEmpty) || (activeTab === "analyses" && !analysesEmpty) || (activeTab === "prompts" && !promptsEmpty) || (activeTab === "captions" && !captionsEmpty) || (activeTab === "visuals" && !visualsEmpty)) && (
          <View style={[styles.clearRow, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={activeTab === "ideas" ? clearAllIdeas : activeTab === "analyses" ? clearAllAnalyses : activeTab === "prompts" ? clearAllPromptsFn : activeTab === "captions" ? clearAllCaptionsFn : clearAllVisualsFn}
              activeOpacity={0.7}
              style={styles.clearBtn}
            >
              <IconSymbol name="trash.fill" size={13} color="#EF4444" />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Scrollable Content */}
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
      ) : activeTab === "analyses" ? (
        analysesEmpty ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Analyses Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              No analyses saved yet.
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
        )
      ) : activeTab === "prompts" ? (
        promptsEmpty ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: "#8B5CF615" }]}>
              <IconSymbol name="wand.and.stars" size={36} color="#8B5CF6" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Saved Prompts Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Go to the Prompt tab, generate AI prompts, and tap Save to store them here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedPrompts}
            keyExtractor={(item) => item.id}
            renderItem={renderPromptItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : activeTab === "captions" ? (
        captionsEmpty ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="text.bubble.fill" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Saved Captions Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Go to the Caption tab, write platform captions, and tap Save to store them here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedCaptions}
            keyExtractor={(item) => item.id}
            renderItem={renderCaptionItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        visualsEmpty ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: "#F59E0B15" }]}>
              <IconSymbol name="photo.fill" size={36} color="#F59E0B" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Saved Visuals Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Generate ideas, expand a card, open the Visual Direction section, and tap Save Visual.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedVisuals}
            keyExtractor={(item) => item.id}
            renderItem={({ item: visual }) => {
              const platformColor = PLATFORMS.find((p) => p.id === visual.platform)?.color ?? colors.primary;
              return (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => { setSelectedVisual(visual); setShowVisualModal(true); }}
                    activeOpacity={0.85}
                    style={{ flexGrow: 1, flexShrink: 1 }}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.platformBadge, { backgroundColor: platformColor + "18", borderColor: platformColor + "40" }]}>
                        <Text style={[styles.platformBadgeText, { color: platformColor }]}>{visual.platform}</Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: "#F59E0B12" }]}>
                        <Text style={[styles.typeBadgeText, { color: "#F59E0B" }]}>{visual.mediaType === "image" ? "Image" : "Video"}</Text>
                      </View>
                      <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(visual.savedAt)}</Text>
                    </View>
                    <Text style={[styles.ideaTitle, { color: colors.foreground }]} numberOfLines={2}>{visual.concept}</Text>
                    <View style={[styles.hookBox, { backgroundColor: "#F59E0B08", borderLeftColor: "#F59E0B" }]}>
                      <Text style={[styles.hookLabel, { color: "#F59E0B" }]}>From Idea</Text>
                      <Text style={[styles.hookText, { color: colors.foreground }]} numberOfLines={1}>{visual.ideaTitle}</Text>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 12, paddingBottom: 8 }}>
                      {visual.lighting ? <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}><Text style={[styles.typeBadgeText, { color: colors.muted }]} numberOfLines={1}>💡 {visual.lighting}</Text></View> : null}
                      {visual.colors ? <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}><Text style={[styles.typeBadgeText, { color: colors.muted }]} numberOfLines={1}>🎨 {visual.colors}</Text></View> : null}
                      {visual.cameraAngle ? <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}><Text style={[styles.typeBadgeText, { color: colors.muted }]} numberOfLines={1}>📷 {visual.cameraAngle}</Text></View> : null}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.tapHint, { color: "#F59E0B" }]}>Tap to view details →</Text>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert("Delete Visual", "Remove this saved visual direction?", [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", style: "destructive", onPress: () => removeVisual(visual.id) },
                        ]);
                      }}
                      activeOpacity={0.7}
                      style={[styles.iconBtn, { backgroundColor: "#EF444412" }]}
                    >
                      <IconSymbol name="trash.fill" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

    </ScreenContainer>
      <IdeaDetailModal
        idea={selectedIdea}
        visible={showIdeaModal}
        onClose={() => setShowIdeaModal(false)}
        colors={colors}
      />
      <AnalysisDetailModal
        analysis={selectedAnalysis}
        visible={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        colors={colors}
      />
      <PromptDetailModal
        prompt={selectedPrompt}
        visible={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        colors={colors}
      />
      <CaptionDetailModal
        caption={selectedCaption}
        visible={showCaptionModal}
        onClose={() => setShowCaptionModal(false)}
        colors={colors}
      />
      <ExportModal
        ideas={savedIdeas}
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        colors={colors}
      />
      <ExportAnalysesModal
        analyses={analyses}
        visible={showExportAnalysesModal}
        onClose={() => setShowExportAnalysesModal(false)}
        colors={colors}
      />
      <ExportPromptsModal
        prompts={savedPrompts}
        visible={showExportPromptsModal}
        onClose={() => setShowExportPromptsModal(false)}
        colors={colors}
      />
      <ExportCaptionsModal
        captions={savedCaptions}
        visible={showExportCaptionsModal}
        onClose={() => setShowExportCaptionsModal(false)}
        colors={colors}
      />
      <ExportVisualsModal
        visuals={savedVisuals}
        visible={showExportVisualsModal}
        onClose={() => setShowExportVisualsModal(false)}
        colors={colors}
      />
      <VisualDetailModal
        visual={selectedVisual}
        visible={showVisualModal}
        onClose={() => setShowVisualModal(false)}
        onDelete={(id) => { removeVisual(id); setShowVisualModal(false); }}
        colors={colors}
      />

      {/* Edit Idea Modal */}
      <Modal
        visible={showEditIdeaModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowEditIdeaModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: Dimensions.get("window").height * 0.92,
            minHeight: Dimensions.get("window").height * 0.6,
          }}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Edit Idea</Text>
              <TouchableOpacity onPress={() => setShowEditIdeaModal(false)} activeOpacity={0.7}>
                <IconSymbol name="xmark.circle.fill" size={26} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Title</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                multiline
                style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, color: colors.foreground, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 16, minHeight: 60 }}
                placeholderTextColor={colors.muted}
              />
              {/* Hook */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Hook</Text>
              <TextInput
                value={editHook}
                onChangeText={setEditHook}
                multiline
                style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, color: colors.foreground, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 16, minHeight: 80 }}
                placeholderTextColor={colors.muted}
              />
              {/* Body */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Body</Text>
              <TextInput
                value={editBody}
                onChangeText={setEditBody}
                multiline
                style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, color: colors.foreground, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 16, minHeight: 100 }}
                placeholderTextColor={colors.muted}
              />
              {/* CTA */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Call to Action</Text>
              <TextInput
                value={editCta}
                onChangeText={setEditCta}
                multiline
                style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, color: colors.foreground, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 24, minHeight: 60 }}
                placeholderTextColor={colors.muted}
              />

              {/* Add to Calendar section */}
              {!showAddToCalendarFromEdit ? (
                <TouchableOpacity
                  onPress={() => setShowAddToCalendarFromEdit(true)}
                  activeOpacity={0.8}
                  style={{ backgroundColor: colors.primary + "18", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}
                >
                  <IconSymbol name="calendar.badge.plus" size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 15 }}>Add to Content Planning Calendar</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>Add to Calendar</Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    value={calendarDate}
                    onChangeText={setCalendarDate}
                    placeholder="e.g. 2026-04-15"
                    style={{ backgroundColor: colors.background, borderRadius: 8, padding: 10, color: colors.foreground, fontSize: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}
                    placeholderTextColor={colors.muted}
                    returnKeyType="done"
                  />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>Time (optional, HH:MM)</Text>
                  <TextInput
                    value={calendarTime}
                    onChangeText={setCalendarTime}
                    placeholder="e.g. 09:00"
                    style={{ backgroundColor: colors.background, borderRadius: 8, padding: 10, color: colors.foreground, fontSize: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}
                    placeholderTextColor={colors.muted}
                    returnKeyType="done"
                  />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>Notes (optional)</Text>
                  <TextInput
                    value={calendarNotes}
                    onChangeText={setCalendarNotes}
                    placeholder="Any notes for this post..."
                    multiline
                    style={{ backgroundColor: colors.background, borderRadius: 8, padding: 10, color: colors.foreground, fontSize: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 16, minHeight: 60 }}
                    placeholderTextColor={colors.muted}
                  />
                  <TouchableOpacity
                    onPress={addIdeaToCalendar}
                    activeOpacity={0.85}
                    style={{ backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: "center" }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Save to Calendar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Save Changes button */}
              <TouchableOpacity
                onPress={saveEditedIdea}
                activeOpacity={0.85}
                style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stickyTop: {
    // No flex — this block has a fixed height and stays at the top
    zIndex: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 2 },
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

  // Tab bar — 4 equal-width tabs in a row, no scroll
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnText: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  tabCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  tabCountText: { fontSize: 10, fontWeight: "700" },

  clearRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1 },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#EF444412" },
  clearBtnText: { fontSize: 13, fontWeight: "600", color: "#EF4444" },

  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
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
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  tapHint: { flex: 1, flexShrink: 1, fontSize: 11, fontWeight: "600", fontStyle: "italic" },
  iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  scorePillText: { fontSize: 11, fontWeight: "700" },
  urlText: { fontSize: 12, fontStyle: "italic" },
  summaryText: { fontSize: 13, lineHeight: 19 },
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
    elevation: 32,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  platformBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  platformBadgeText: { fontSize: 11, fontWeight: "700" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  scorePillText: { fontSize: 11, fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3, lineHeight: 24 },
  subtitle: { fontSize: 13, marginTop: 2 },
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
