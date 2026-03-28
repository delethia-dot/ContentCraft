import React, { useState, useCallback, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Share,
  ActivityIndicator,
  Switch,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { useStorage } from "@/lib/storage-context";
import { PLATFORMS, Platform as SocialPlatform } from "@/lib/types";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { APP_WEB_URL } from "@/constants/app-url";

// ─── Types & Constants ────────────────────────────────────────────────────────

type Tone = "professional" | "casual" | "witty" | "inspirational" | "educational";

interface CaptionResult {
  id: string;
  caption: string;
  hashtags: string[];
  characterCount: number;
  tips: string[];
  alternativeHook: string;
  topic: string;
  platform: SocialPlatform;
  tone: Tone;
  createdAt: string;
}

const TONES: { id: Tone; label: string; emoji: string; description: string }[] = [
  { id: "professional", label: "Professional", emoji: "💼", description: "Authoritative & polished" },
  { id: "casual", label: "Casual", emoji: "😊", description: "Friendly & relatable" },
  { id: "witty", label: "Witty", emoji: "😄", description: "Clever & humorous" },
  { id: "inspirational", label: "Inspiring", emoji: "✨", description: "Motivating & uplifting" },
  { id: "educational", label: "Educational", emoji: "📚", description: "Informative & clear" },
];

const PLATFORM_LIMITS: Record<SocialPlatform, number> = {
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  youtube: 5000,
  linkedin: 3000,
};

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#00C2CB",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CaptionScreen() {
  const colors = useColors();
  const { niche } = useNiche();
  const { saveCaption } = useStorage();

  const params = useLocalSearchParams<{ prefillTopic?: string; prefillPlatform?: string }>();
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>(
    (params.prefillPlatform as SocialPlatform) ?? "instagram"
  );
  const [selectedTone, setSelectedTone] = useState<Tone>("casual");
  const [topic, setTopic] = useState(params.prefillTopic ?? "");

  // Re-apply params when navigated here with new values
  useEffect(() => {
    if (params.prefillTopic) setTopic(params.prefillTopic);
    if (params.prefillPlatform) setSelectedPlatform(params.prefillPlatform as SocialPlatform);
  }, [params.prefillTopic, params.prefillPlatform]);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const generateMutation = trpc.content.generateCaption.useMutation();
  const hashtagMutation = trpc.content.researchHashtags.useMutation();

  const [showHashtagResearch, setShowHashtagResearch] = useState(false);
  const [hashtagResult, setHashtagResult] = useState<{
    hashtags: { tag: string; reach: string; competition: string; relevance: number; category: string }[];
    strategy: string;
    topPick: string;
  } | null>(null);
  const [isResearchingHashtags, setIsResearchingHashtags] = useState(false);
  const [copiedHashtag, setCopiedHashtag] = useState<string | null>(null);

  const platformColor = PLATFORM_COLORS[selectedPlatform];
  const charLimit = PLATFORM_LIMITS[selectedPlatform];

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      Alert.alert("Enter a Topic", "Please describe the topic or idea for your caption.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setResult(null);
    setIsSaved(false);
    try {
      const res = await generateMutation.mutateAsync({
        topic: topic.trim(),
        platform: selectedPlatform,
        tone: selectedTone,
        niche,
        includeHashtags,
        includeEmojis,
      });
      setResult(res as CaptionResult);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Generation Failed", "Could not generate the caption. Please try again.");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  }, [topic, selectedPlatform, selectedTone, niche, includeHashtags, includeEmojis, generateMutation]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    await saveCaption({
      id: result.id,
      topic: result.topic,
      platform: result.platform,
      tone: result.tone,
      caption: result.caption,
      hashtags: result.hashtags,
      characterCount: result.characterCount,
      createdAt: result.createdAt,
    });
    setIsSaved(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved!", "Caption saved to your History.");
  }, [result, saveCaption]);

  const copyText = useCallback(async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const shareCaption = useCallback(async () => {
    if (!result) return;
    const hashtagStr = result.hashtags.length > 0 ? "\n\n" + result.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ") : "";
    const text = `${result.caption}${hashtagStr}\n\n✨ Created with ContentCraft\n${APP_WEB_URL}`;
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: text, title: "Caption" });
    } catch {}
  }, [result]);

  const charPercent = result ? Math.min((result.characterCount / charLimit) * 100, 100) : 0;
  const charColor = charPercent > 90 ? "#EF4444" : charPercent > 70 ? "#F59E0B" : "#10B981";

  const handleResearchHashtags = useCallback(async () => {
    if (!topic.trim()) {
      Alert.alert("Enter a Topic", "Please enter a topic first to research hashtags.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsResearchingHashtags(true);
    setHashtagResult(null);
    try {
      const res = await hashtagMutation.mutateAsync({
        niche,
        platform: selectedPlatform,
        topic: topic.trim(),
        count: 20,
      });
      setHashtagResult(res as any);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Research Failed", "Could not research hashtags. Please try again.");
    } finally {
      setIsResearchingHashtags(false);
    }
  }, [topic, niche, selectedPlatform, hashtagMutation]);

  const getReachColor = (reach: string) => {
    if (reach === "high") return "#10B981";
    if (reach === "medium") return "#F59E0B";
    return "#6366F1";
  };
  const getCompetitionColor = (comp: string) => {
    if (comp === "high") return "#EF4444";
    if (comp === "medium") return "#F59E0B";
    return "#10B981";
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.navy }]}>
          <View style={styles.headerRow}>
            <View style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <IconSymbol name="text.bubble.fill" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Caption Writer</Text>
              <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
                Platform-optimized captions with hashtags
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Platform */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Platform</Text>
            <View style={styles.chipWrap}>
              {PLATFORMS.map((p) => {
                const isActive = selectedPlatform === p.id;
                const pColor = PLATFORM_COLORS[p.id];
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedPlatform(p.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.platformChip,
                      { backgroundColor: isActive ? pColor : colors.background, borderColor: isActive ? pColor : colors.border },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[styles.limitBadge, { backgroundColor: platformColor + "12", borderColor: platformColor + "30" }]}>
              <IconSymbol name="info.circle.fill" size={13} color={platformColor} />
              <Text style={[styles.limitText, { color: platformColor }]}>
                {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} caption limit: {charLimit.toLocaleString()} characters
              </Text>
            </View>
          </View>

          {/* Tone */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tone</Text>
            <View style={styles.toneGrid}>
              {TONES.map((tone) => {
                const isActive = selectedTone === tone.id;
                return (
                  <TouchableOpacity
                    key={tone.id}
                    onPress={() => setSelectedTone(tone.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.toneCard,
                      { backgroundColor: isActive ? colors.primary + "15" : colors.background, borderColor: isActive ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={styles.toneEmoji}>{tone.emoji}</Text>
                    <Text style={[styles.toneLabel, { color: isActive ? colors.primary : colors.foreground }]}>{tone.label}</Text>
                    <Text style={[styles.toneDesc, { color: colors.muted }]} numberOfLines={1}>{tone.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Topic */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Topic / Idea *</Text>
            <Text style={[styles.sectionHint, { color: colors.muted }]}>
              What is this post about? Be specific for better results.
            </Text>
            <TextInput
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. 5 morning habits that changed my productivity..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              returnKeyType="done"
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>

          {/* Options */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Options</Text>
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>Include Hashtags</Text>
                <Text style={[styles.optionHint, { color: colors.muted }]}>Add relevant hashtags at the end</Text>
              </View>
              <Switch
                value={includeHashtags}
                onValueChange={setIncludeHashtags}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={includeHashtags ? colors.primary : colors.muted}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>Include Emojis</Text>
                <Text style={[styles.optionHint, { color: colors.muted }]}>Add relevant emojis for visual appeal</Text>
              </View>
              <Switch
                value={includeEmojis}
                onValueChange={setIncludeEmojis}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={includeEmojis ? colors.primary : colors.muted}
              />
            </View>
          </View>

          {/* Hashtag Research Section */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setShowHashtagResearch(!showHashtagResearch)}
              activeOpacity={0.8}
              style={styles.hashtagToggleRow}
            >
              <View style={[styles.hashtagToggleIcon, { backgroundColor: colors.accent + "15" }]}>
                <IconSymbol name="number" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hashtag Suggestions</Text>
                <Text style={[styles.sectionHint, { color: colors.muted, marginTop: 2 }]}>AI-suggested hashtags ranked by estimated reach & competition</Text>
              </View>
              <IconSymbol name={showHashtagResearch ? "chevron.up" : "chevron.down"} size={16} color={colors.muted} />
            </TouchableOpacity>

            {showHashtagResearch && (
              <View style={{ gap: 12 }}>
                {/* Disclaimer */}
                <View style={{ backgroundColor: "#F59E0B10", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#F59E0B30" }}>
                  <Text style={{ fontSize: 11, color: "#92400E", lineHeight: 16 }}>
                    ⚠️ These suggestions are AI-generated based on training data and do not reflect live platform metrics. Verify current trends using Instagram, TikTok, or a dedicated hashtag tool before publishing.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleResearchHashtags}
                  activeOpacity={0.85}
                  disabled={isResearchingHashtags}
                  style={[styles.hashtagResearchBtn, { backgroundColor: isResearchingHashtags ? colors.muted : colors.accent }]}
                >
                  {isResearchingHashtags ? (
                    <><ActivityIndicator size="small" color="#FFFFFF" /><Text style={styles.generateBtnText}>Researching...</Text></>
                  ) : (
                    <><IconSymbol name="magnifyingglass" size={16} color="#FFFFFF" /><Text style={styles.generateBtnText}>Get Hashtag Suggestions</Text></>
                  )}
                </TouchableOpacity>

                {hashtagResult && (
                  <View style={{ gap: 10 }}>
                    {/* Strategy */}
                    <View style={[styles.strategyBox, { backgroundColor: colors.accent + "08", borderColor: colors.accent + "25" }]}>
                      <Text style={[styles.blockLabel, { color: colors.accent }]}>Strategy</Text>
                      <Text style={[styles.strategyText, { color: colors.foreground }]}>{hashtagResult.strategy}</Text>
                    </View>
                    {/* Top Pick */}
                    <View style={[styles.topPickBox, { backgroundColor: "#10B98110", borderColor: "#10B98130" }]}>
                      <IconSymbol name="star.fill" size={13} color="#10B981" />
                      <Text style={[styles.topPickText, { color: colors.foreground }]}>{hashtagResult.topPick}</Text>
                    </View>
                    {/* Hashtag Grid */}
                    <View style={{ gap: 6 }}>
                      <View style={styles.hashtagTableHeader}>
                        <Text style={[styles.tableHeaderText, { color: colors.muted, flex: 2 }]}>Hashtag</Text>
                        <Text style={[styles.tableHeaderText, { color: colors.muted, flex: 1, textAlign: "center" }]}>Reach</Text>
                        <Text style={[styles.tableHeaderText, { color: colors.muted, flex: 1, textAlign: "center" }]}>Comp.</Text>
                        <Text style={[styles.tableHeaderText, { color: colors.muted, flex: 1, textAlign: "center" }]}>Score</Text>
                      </View>
                      {hashtagResult.hashtags.map((ht, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={async () => {
                            await Clipboard.setStringAsync(`#${ht.tag.replace(/^#/, "")}`);
                            setCopiedHashtag(ht.tag);
                            setTimeout(() => setCopiedHashtag(null), 1500);
                          }}
                          activeOpacity={0.7}
                          style={[styles.hashtagTableRow, { backgroundColor: i % 2 === 0 ? colors.background : colors.surface, borderColor: colors.border }]}
                        >
                          <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <View style={[styles.categoryDot, { backgroundColor: colors.accent }]} />
                            <Text style={[styles.hashtagRowTag, { color: copiedHashtag === ht.tag ? "#10B981" : colors.primary }]} numberOfLines={1}>
                              #{ht.tag.replace(/^#/, "")}
                            </Text>
                          </View>
                          <View style={[styles.reachBadge, { backgroundColor: getReachColor(ht.reach) + "20", flex: 1, alignItems: "center" }]}>
                            <Text style={[styles.reachText, { color: getReachColor(ht.reach) }]}>{ht.reach}</Text>
                          </View>
                          <View style={[styles.reachBadge, { backgroundColor: getCompetitionColor(ht.competition) + "20", flex: 1, alignItems: "center" }]}>
                            <Text style={[styles.reachText, { color: getCompetitionColor(ht.competition) }]}>{ht.competition}</Text>
                          </View>
                          <View style={{ flex: 1, alignItems: "center" }}>
                            <Text style={[styles.relevanceScore, { color: ht.relevance >= 8 ? "#10B981" : ht.relevance >= 6 ? "#F59E0B" : colors.muted }]}>{ht.relevance}/10</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {/* Copy All */}
                    <TouchableOpacity
                      onPress={async () => {
                        const all = hashtagResult.hashtags.map((h) => `#${h.tag.replace(/^#/, "")}`).join(" ");
                        await Clipboard.setStringAsync(all);
                        Alert.alert("Copied!", "All hashtags copied to clipboard.");
                      }}
                      activeOpacity={0.8}
                      style={[styles.copyAllBtn, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "30" }]}
                    >
                      <IconSymbol name="doc.on.doc" size={14} color={colors.accent} />
                      <Text style={[styles.copyAllBtnText, { color: colors.accent }]}>Copy All {hashtagResult.hashtags.length} Hashtags</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            onPress={handleGenerate}
            activeOpacity={0.85}
            disabled={isGenerating}
            style={[styles.generateBtn, { backgroundColor: isGenerating ? colors.muted : platformColor }]}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Writing Caption...</Text>
              </>
            ) : (
              <>
                <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>
                  Write {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Caption
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Result */}
          {result && (
            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: platformColor + "40" }]}>
              {/* Result Header */}
              <View style={[styles.resultHeader, { backgroundColor: platformColor + "12" }]}>
                <View style={[styles.platformDot, { backgroundColor: platformColor }]} />
                <Text style={[styles.resultHeaderText, { color: platformColor }]}>
                  {result.platform.charAt(0).toUpperCase() + result.platform.slice(1)} Caption Ready
                </Text>
                {/* Character count */}
                <View style={[styles.charBadge, { backgroundColor: charColor + "20" }]}>
                  <Text style={[styles.charBadgeText, { color: charColor }]}>
                    {result.characterCount} chars
                  </Text>
                </View>
              </View>

              {/* Caption Block */}
              <View style={styles.captionBlock}>
                <View style={styles.captionLabelRow}>
                  <Text style={[styles.blockLabel, { color: colors.foreground }]}>Caption</Text>
                  <TouchableOpacity
                    onPress={() => copyText(result.caption, "caption")}
                    activeOpacity={0.7}
                    style={[styles.copyBtn, { backgroundColor: copiedField === "caption" ? "#10B981" : platformColor + "15" }]}
                  >
                    <IconSymbol name={copiedField === "caption" ? "checkmark" : "doc.on.doc"} size={13} color={copiedField === "caption" ? "#FFFFFF" : platformColor} />
                    <Text style={[styles.copyBtnText, { color: copiedField === "caption" ? "#FFFFFF" : platformColor }]}>
                      {copiedField === "caption" ? "Copied!" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.captionBox, { backgroundColor: colors.background, borderColor: platformColor + "30" }]}>
                  <Text style={[styles.captionText, { color: colors.foreground }]}>{result.caption}</Text>
                </View>
                {/* Char progress bar */}
                <View style={[styles.charBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.charBarFill, { width: `${charPercent}%` as any, backgroundColor: charColor }]} />
                </View>
                <Text style={[styles.charBarLabel, { color: colors.muted }]}>
                  {result.characterCount} / {charLimit.toLocaleString()} characters
                </Text>
              </View>

              {/* Hashtags */}
              {result.hashtags.length > 0 && (
                <View style={styles.captionBlock}>
                  <View style={styles.captionLabelRow}>
                    <Text style={[styles.blockLabel, { color: colors.foreground }]}>Hashtags</Text>
                    <TouchableOpacity
                      onPress={() => copyText(result.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" "), "hashtags")}
                      activeOpacity={0.7}
                      style={[styles.copyBtn, { backgroundColor: copiedField === "hashtags" ? "#10B981" : platformColor + "15" }]}
                    >
                      <IconSymbol name={copiedField === "hashtags" ? "checkmark" : "doc.on.doc"} size={13} color={copiedField === "hashtags" ? "#FFFFFF" : platformColor} />
                      <Text style={[styles.copyBtnText, { color: copiedField === "hashtags" ? "#FFFFFF" : platformColor }]}>
                        {copiedField === "hashtags" ? "Copied!" : "Copy All"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.hashtagWrap}>
                    {result.hashtags.map((tag, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => copyText(`#${tag.replace(/^#/, "")}`, `tag-${i}`)}
                        activeOpacity={0.7}
                        style={[styles.hashtagChip, { backgroundColor: platformColor + "12", borderColor: platformColor + "30" }]}
                      >
                        <Text style={[styles.hashtagText, { color: platformColor }]}>
                          #{tag.replace(/^#/, "")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Alternative Hook */}
              {!!result.alternativeHook && (
                <View style={styles.captionBlock}>
                  <View style={styles.captionLabelRow}>
                    <Text style={[styles.blockLabel, { color: colors.foreground }]}>A/B Test Hook</Text>
                    <TouchableOpacity
                      onPress={() => copyText(result.alternativeHook, "hook")}
                      activeOpacity={0.7}
                      style={[styles.copyBtn, { backgroundColor: copiedField === "hook" ? "#10B981" : colors.accent + "15" }]}
                    >
                      <IconSymbol name={copiedField === "hook" ? "checkmark" : "doc.on.doc"} size={13} color={copiedField === "hook" ? "#FFFFFF" : colors.accent} />
                      <Text style={[styles.copyBtnText, { color: copiedField === "hook" ? "#FFFFFF" : colors.accent }]}>
                        {copiedField === "hook" ? "Copied!" : "Copy"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.captionBox, { backgroundColor: colors.accent + "08", borderColor: colors.accent + "25" }]}>
                    <Text style={[styles.captionText, { color: colors.foreground }]}>{result.alternativeHook}</Text>
                  </View>
                </View>
              )}

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <View style={styles.captionBlock}>
                  <Text style={[styles.blockLabel, { color: colors.foreground }]}>Platform Tips</Text>
                  {result.tips.map((tip, i) => (
                    <View key={i} style={styles.tipRow}>
                      <View style={[styles.tipDot, { backgroundColor: platformColor }]} />
                      <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Bottom Actions */}
              <View style={styles.resultActions}>
                <TouchableOpacity
                  onPress={() => {
                    const hashtagStr = result.hashtags.length > 0
                      ? "\n\n" + result.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")
                      : "";
                    copyText(result.caption + hashtagStr, "full");
                  }}
                  activeOpacity={0.8}
                  style={[styles.actionBtn, { backgroundColor: platformColor }]}
                >
                  <IconSymbol name="doc.on.doc" size={16} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Copy Full</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  activeOpacity={0.8}
                  style={[styles.actionBtn, { backgroundColor: isSaved ? "#10B98120" : colors.surface, borderColor: isSaved ? "#10B981" : colors.border, borderWidth: 1 }]}
                >
                  <IconSymbol name={isSaved ? "bookmark.fill" : "bookmark"} size={16} color={isSaved ? "#10B981" : colors.foreground} />
                  <Text style={[styles.actionBtnText, { color: isSaved ? "#10B981" : colors.foreground }]}>
                    {isSaved ? "Saved!" : "Save"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={shareCaption}
                  activeOpacity={0.8}
                  style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                >
                  <IconSymbol name="square.and.arrow.up" size={16} color={colors.foreground} />
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  headerSub: { fontSize: 13, marginTop: 2 },
  content: { padding: 16, gap: 12 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", letterSpacing: -0.1 },
  sectionHint: { fontSize: 12, lineHeight: 17, marginTop: -6 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  platformChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: "600" },
  limitBadge: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  limitText: { fontSize: 12, fontWeight: "600" },
  toneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toneCard: { borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 3, minWidth: "30%", flex: 1, alignItems: "center" },
  toneEmoji: { fontSize: 22 },
  toneLabel: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  toneDesc: { fontSize: 10, textAlign: "center", lineHeight: 14 },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 20, minHeight: 80, textAlignVertical: "top" },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  optionLabel: { fontSize: 14, fontWeight: "600" },
  optionHint: { fontSize: 12, marginTop: 2 },
  divider: { height: 1 },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16 },
  generateBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 },
  resultCard: { borderRadius: 20, borderWidth: 1.5, overflow: "hidden" },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  platformDot: { width: 8, height: 8, borderRadius: 4 },
  resultHeaderText: { flex: 1, fontSize: 14, fontWeight: "700" },
  charBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  charBadgeText: { fontSize: 11, fontWeight: "700" },
  captionBlock: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  captionLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  blockLabel: { fontSize: 13, fontWeight: "700" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  copyBtnText: { fontSize: 12, fontWeight: "600" },
  captionBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  captionText: { fontSize: 14, lineHeight: 22 },
  charBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  charBarFill: { height: "100%", borderRadius: 2 },
  charBarLabel: { fontSize: 11, textAlign: "right" },
  hashtagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  hashtagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  hashtagText: { fontSize: 12, fontWeight: "600" },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },
  resultActions: { flexDirection: "row", gap: 8, padding: 16, paddingTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  // Hashtag Research styles
  hashtagToggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  hashtagToggleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hashtagResearchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  strategyBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  strategyText: { fontSize: 13, lineHeight: 19 },
  topPickBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  topPickText: { flex: 1, fontSize: 12, lineHeight: 18 },
  hashtagTableHeader: { flexDirection: "row", paddingHorizontal: 10, paddingVertical: 4 },
  tableHeaderText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  hashtagTableRow: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  hashtagRowTag: { fontSize: 12, fontWeight: "700", flex: 1 },
  reachBadge: { paddingVertical: 3, borderRadius: 6 },
  reachText: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  relevanceScore: { fontSize: 12, fontWeight: "700" },
  copyAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  copyAllBtnText: { fontSize: 13, fontWeight: "700" },
});
