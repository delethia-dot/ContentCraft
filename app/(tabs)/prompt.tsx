import React, { useState, useCallback } from "react";
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

// ─── Constants ────────────────────────────────────────────────────────────────

type MediaType = "image" | "video";

interface PresetTool {
  id: string;
  label: string;
  mediaTypes: MediaType[];
  color: string;
  description: string;
  isCustom?: false;
}

const PRESET_TOOLS: PresetTool[] = [
  { id: "midjourney", label: "Midjourney", mediaTypes: ["image"], color: "#7C3AED", description: "Artistic & photorealistic" },
  { id: "dalle", label: "DALL-E 3", mediaTypes: ["image"], color: "#10A37F", description: "OpenAI image generator" },
  { id: "stable-diffusion", label: "Stable Diffusion", mediaTypes: ["image"], color: "#F97316", description: "Open-source generation" },
  { id: "ideogram", label: "Ideogram", mediaTypes: ["image"], color: "#0284C7", description: "Text-in-image specialist" },
  { id: "adobe-firefly", label: "Adobe Firefly", mediaTypes: ["image"], color: "#FF0000", description: "Commercial-safe images" },
  { id: "sora", label: "Sora", mediaTypes: ["video"], color: "#0EA5E9", description: "OpenAI video generator" },
  { id: "runway", label: "Runway Gen-3", mediaTypes: ["video"], color: "#EC4899", description: "Professional AI video" },
  { id: "kling", label: "Kling AI", mediaTypes: ["video"], color: "#8B5CF6", description: "Cinematic AI video" },
  { id: "pika", label: "Pika", mediaTypes: ["video"], color: "#F59E0B", description: "Quick video generation" },
  { id: "hailuo", label: "Hailuo / MiniMax", mediaTypes: ["video"], color: "#06B6D4", description: "High-quality video AI" },
];

const CUSTOM_TOOL_ID = "__custom__";

const STYLES = [
  "Photorealistic", "Cinematic", "Minimalist", "Vibrant & Bold",
  "Dark & Moody", "Soft Pastel", "Editorial", "Documentary",
  "Animated / Illustrated", "Luxury & Premium",
];

const MOODS = [
  "Inspiring", "Energetic", "Calm & Peaceful", "Playful",
  "Professional", "Emotional", "Mysterious", "Warm & Inviting",
  "Urgent / FOMO", "Aspirational",
];

const ASPECT_RATIOS: Record<SocialPlatform, { label: string; value: string }[]> = {
  instagram: [{ label: "Square 1:1", value: "1:1" }, { label: "Portrait 4:5", value: "4:5" }, { label: "Story 9:16", value: "9:16" }],
  facebook: [{ label: "Landscape 16:9", value: "16:9" }, { label: "Square 1:1", value: "1:1" }],
  tiktok: [{ label: "Vertical 9:16", value: "9:16" }, { label: "Square 1:1", value: "1:1" }],
  youtube: [{ label: "Landscape 16:9", value: "16:9" }, { label: "Square 1:1", value: "1:1" }],
  linkedin: [{ label: "Landscape 1.91:1", value: "1.91:1" }, { label: "Square 1:1", value: "1:1" }],
};

interface GeneratedPrompt {
  id: string;
  mainPrompt: string;
  negativePrompt: string;
  tips: string[];
  variations: string[];
  estimatedQuality: string;
  tool: string;
  mediaType: MediaType;
  subject: string;
  platform: SocialPlatform;
  createdAt: string;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PromptScreen() {
  const colors = useColors();
  const { niche } = useNiche();
  const { savePrompt } = useStorage();

  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [selectedToolId, setSelectedToolId] = useState<string>("midjourney");
  const [customToolName, setCustomToolName] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("instagram");
  const [selectedStyle, setSelectedStyle] = useState("Photorealistic");
  const [selectedMood, setSelectedMood] = useState("Inspiring");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [subject, setSubject] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const generateMutation = trpc.content.generatePrompt.useMutation();

  const availablePresetTools = PRESET_TOOLS.filter((t) => t.mediaTypes.includes(mediaType));
  const isCustom = selectedToolId === CUSTOM_TOOL_ID;
  const effectiveToolName = isCustom ? customToolName.trim() : (PRESET_TOOLS.find((t) => t.id === selectedToolId)?.label ?? selectedToolId);
  const toolColor = PRESET_TOOLS.find((t) => t.id === selectedToolId)?.color ?? colors.primary;
  const availableRatios = ASPECT_RATIOS[selectedPlatform];

  const handleGenerate = useCallback(async () => {
    if (!subject.trim()) {
      Alert.alert("Enter a Subject", "Please describe the subject or scene you want to generate.");
      return;
    }
    if (isCustom && !customToolName.trim()) {
      Alert.alert("Enter Tool Name", "Please enter the name of your AI tool.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setGeneratedPrompt(null);
    setIsSaved(false);
    try {
      const result = await generateMutation.mutateAsync({
        tool: effectiveToolName,
        mediaType,
        style: selectedStyle,
        mood: selectedMood,
        subject: subject.trim(),
        platform: selectedPlatform,
        aspectRatio: selectedRatio,
        niche,
        additionalDetails: additionalDetails.trim() || undefined,
        isCustomTool: isCustom,
      });
      setGeneratedPrompt(result as GeneratedPrompt);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Generation Failed", "Could not generate the prompt. Please try again.");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  }, [subject, isCustom, customToolName, effectiveToolName, mediaType, selectedStyle, selectedMood, selectedPlatform, selectedRatio, niche, additionalDetails, generateMutation]);

  const handleSave = useCallback(async () => {
    if (!generatedPrompt) return;
    await savePrompt({
      id: generatedPrompt.id,
      tool: effectiveToolName,
      mediaType: generatedPrompt.mediaType,
      subject: generatedPrompt.subject,
      platform: generatedPrompt.platform,
      mainPrompt: generatedPrompt.mainPrompt,
      negativePrompt: generatedPrompt.negativePrompt,
      tips: generatedPrompt.tips,
      variations: generatedPrompt.variations,
      estimatedQuality: generatedPrompt.estimatedQuality,
      createdAt: generatedPrompt.createdAt,
    });
    setIsSaved(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved!", "Prompt saved to your History.");
  }, [generatedPrompt, effectiveToolName, savePrompt]);

  const copyText = useCallback(async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const sharePrompt = useCallback(async () => {
    if (!generatedPrompt) return;
    const text = `🎨 AI ${generatedPrompt.mediaType === "image" ? "Image" : "Video"} Prompt for ${effectiveToolName}\n\n📝 Main Prompt:\n${generatedPrompt.mainPrompt}${generatedPrompt.negativePrompt ? `\n\n🚫 Negative Prompt:\n${generatedPrompt.negativePrompt}` : ""}\n\n✨ Generated by ContentCraft`;
    try {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({ message: text, title: "AI Prompt" });
    } catch {}
  }, [generatedPrompt, effectiveToolName]);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.navy }]}>
          <View style={styles.headerIconRow}>
            <View style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <IconSymbol name="wand.and.stars" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Prompt Generator</Text>
              <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
                Craft perfect AI image & video prompts
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Media Type Toggle */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Media Type</Text>
            <View style={[styles.toggleRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {(["image", "video"] as MediaType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    setMediaType(type);
                    const firstTool = PRESET_TOOLS.find((t) => t.mediaTypes.includes(type));
                    if (firstTool) setSelectedToolId(firstTool.id);
                  }}
                  activeOpacity={0.8}
                  style={[styles.toggleBtn, mediaType === type && { backgroundColor: colors.primary }]}
                >
                  <IconSymbol
                    name={type === "image" ? "photo.fill" : "video.fill"}
                    size={16}
                    color={mediaType === type ? "#FFFFFF" : colors.muted}
                  />
                  <Text style={[styles.toggleBtnText, { color: mediaType === type ? "#FFFFFF" : colors.muted }]}>
                    {type === "image" ? "Image" : "Video"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AI Tool Selector */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Tool</Text>
            <Text style={[styles.sectionHint, { color: colors.muted }]}>
              Select a preset tool or choose "Custom" to enter any tool you use
            </Text>
            <View style={styles.toolGrid}>
              {availablePresetTools.map((tool) => {
                const isActive = selectedToolId === tool.id;
                return (
                  <TouchableOpacity
                    key={tool.id}
                    onPress={() => setSelectedToolId(tool.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.toolCard,
                      {
                        backgroundColor: isActive ? tool.color + "15" : colors.background,
                        borderColor: isActive ? tool.color : colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.toolDot, { backgroundColor: tool.color }]} />
                    <Text style={[styles.toolLabel, { color: isActive ? tool.color : colors.foreground }]}>
                      {tool.label}
                    </Text>
                    <Text style={[styles.toolDesc, { color: colors.muted }]} numberOfLines={1}>
                      {tool.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {/* Custom Tool Card */}
              <TouchableOpacity
                onPress={() => setSelectedToolId(CUSTOM_TOOL_ID)}
                activeOpacity={0.8}
                style={[
                  styles.toolCard,
                  {
                    backgroundColor: isCustom ? colors.accent + "15" : colors.background,
                    borderColor: isCustom ? colors.accent : colors.border,
                    borderStyle: "dashed",
                  },
                ]}
              >
                <IconSymbol name="plus.circle.fill" size={14} color={isCustom ? colors.accent : colors.muted} />
                <Text style={[styles.toolLabel, { color: isCustom ? colors.accent : colors.foreground }]}>
                  Custom Tool
                </Text>
                <Text style={[styles.toolDesc, { color: colors.muted }]} numberOfLines={1}>
                  Any other AI tool
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom tool name input */}
            {isCustom && (
              <View style={styles.customToolInputWrap}>
                <IconSymbol name="pencil" size={16} color={colors.accent} />
                <TextInput
                  value={customToolName}
                  onChangeText={setCustomToolName}
                  placeholder="Enter tool name (e.g. Ideogram, Firefly, Haiper...)"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  style={[styles.customToolInput, { color: colors.foreground, borderColor: colors.accent }]}
                />
              </View>
            )}
          </View>

          {/* Platform */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Target Platform</Text>
            <View style={styles.chipWrap}>
              {PLATFORMS.map((p) => {
                const isActive = selectedPlatform === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setSelectedPlatform(p.id);
                      setSelectedRatio(ASPECT_RATIOS[p.id][0].value);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.chip,
                      { backgroundColor: isActive ? p.color : colors.background, borderColor: isActive ? p.color : colors.border },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Aspect Ratio */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Aspect Ratio</Text>
            <View style={styles.chipWrap}>
              {availableRatios.map((r) => {
                const isActive = selectedRatio === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setSelectedRatio(r.value)}
                    activeOpacity={0.8}
                    style={[
                      styles.chip,
                      { backgroundColor: isActive ? colors.primary : colors.background, borderColor: isActive ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Style */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Visual Style</Text>
            <View style={styles.chipWrap}>
              {STYLES.map((s) => {
                const isActive = selectedStyle === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSelectedStyle(s)}
                    activeOpacity={0.8}
                    style={[
                      styles.chip,
                      { backgroundColor: isActive ? colors.accent : colors.background, borderColor: isActive ? colors.accent : colors.border },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Mood */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mood & Atmosphere</Text>
            <View style={styles.chipWrap}>
              {MOODS.map((m) => {
                const isActive = selectedMood === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMood(m)}
                    activeOpacity={0.8}
                    style={[
                      styles.chip,
                      { backgroundColor: isActive ? "#B8860B" : colors.background, borderColor: isActive ? "#B8860B" : colors.border },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Subject */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Subject / Scene *</Text>
            <Text style={[styles.sectionHint, { color: colors.muted }]}>
              Describe what you want in the {mediaType}
            </Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. a woman doing yoga on a rooftop at sunrise..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              returnKeyType="done"
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>

          {/* Additional Details */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Additional Details</Text>
            <Text style={[styles.sectionHint, { color: colors.muted }]}>
              Optional: lighting, colors, camera angle, specific elements
            </Text>
            <TextInput
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
              placeholder="e.g. golden hour lighting, shallow depth of field..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={2}
              returnKeyType="done"
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            onPress={handleGenerate}
            activeOpacity={0.85}
            disabled={isGenerating}
            style={[styles.generateBtn, { backgroundColor: isGenerating ? colors.muted : (isCustom ? colors.accent : toolColor) }]}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Crafting Prompt...</Text>
              </>
            ) : (
              <>
                <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>
                  Generate {isCustom ? (customToolName.trim() || "Custom Tool") : effectiveToolName} Prompt
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Result */}
          {generatedPrompt && (
            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: (isCustom ? colors.accent : toolColor) + "40" }]}>
              {/* Result Header */}
              <View style={[styles.resultHeader, { backgroundColor: (isCustom ? colors.accent : toolColor) + "12" }]}>
                <View style={[styles.toolDot, { backgroundColor: isCustom ? colors.accent : toolColor }]} />
                <Text style={[styles.resultHeaderText, { color: isCustom ? colors.accent : toolColor }]}>
                  {effectiveToolName} Prompt Ready
                </Text>
                <TouchableOpacity onPress={sharePrompt} activeOpacity={0.7} style={styles.actionIconBtn}>
                  <IconSymbol name="square.and.arrow.up" size={18} color={isCustom ? colors.accent : toolColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  activeOpacity={0.7}
                  style={[styles.actionIconBtn, { backgroundColor: isSaved ? "#10B98120" : "transparent" }]}
                >
                  <IconSymbol name={isSaved ? "bookmark.fill" : "bookmark"} size={18} color={isSaved ? "#10B981" : colors.muted} />
                </TouchableOpacity>
              </View>

              {/* Main Prompt */}
              <View style={styles.promptBlock}>
                <View style={styles.promptLabelRow}>
                  <Text style={[styles.promptLabel, { color: colors.foreground }]}>Main Prompt</Text>
                  <TouchableOpacity
                    onPress={() => copyText(generatedPrompt.mainPrompt, "main")}
                    activeOpacity={0.7}
                    style={[styles.copyBtn, { backgroundColor: copiedField === "main" ? "#10B981" : colors.primary + "15" }]}
                  >
                    <IconSymbol name={copiedField === "main" ? "checkmark" : "doc.on.doc"} size={13} color={copiedField === "main" ? "#FFFFFF" : colors.primary} />
                    <Text style={[styles.copyBtnText, { color: copiedField === "main" ? "#FFFFFF" : colors.primary }]}>
                      {copiedField === "main" ? "Copied!" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.promptBox, { backgroundColor: colors.background, borderColor: (isCustom ? colors.accent : toolColor) + "30" }]}>
                  <Text style={[styles.promptText, { color: colors.foreground }]}>{generatedPrompt.mainPrompt}</Text>
                </View>
              </View>

              {/* Negative Prompt */}
              {!!generatedPrompt.negativePrompt && (
                <View style={styles.promptBlock}>
                  <View style={styles.promptLabelRow}>
                    <Text style={[styles.promptLabel, { color: colors.foreground }]}>Negative Prompt</Text>
                    <TouchableOpacity
                      onPress={() => copyText(generatedPrompt.negativePrompt, "negative")}
                      activeOpacity={0.7}
                      style={[styles.copyBtn, { backgroundColor: copiedField === "negative" ? "#10B981" : "#EF444415" }]}
                    >
                      <IconSymbol name={copiedField === "negative" ? "checkmark" : "doc.on.doc"} size={13} color={copiedField === "negative" ? "#FFFFFF" : "#EF4444"} />
                      <Text style={[styles.copyBtnText, { color: copiedField === "negative" ? "#FFFFFF" : "#EF4444" }]}>
                        {copiedField === "negative" ? "Copied!" : "Copy"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.promptBox, { backgroundColor: "#EF444408", borderColor: "#EF444430" }]}>
                    <Text style={[styles.promptText, { color: colors.foreground }]}>{generatedPrompt.negativePrompt}</Text>
                  </View>
                </View>
              )}

              {/* Quality Note */}
              <View style={[styles.qualityBox, { backgroundColor: "#10B98110", borderColor: "#10B98130" }]}>
                <IconSymbol name="star.fill" size={14} color="#10B981" />
                <Text style={[styles.qualityText, { color: colors.foreground }]}>{generatedPrompt.estimatedQuality}</Text>
              </View>

              {/* Tips */}
              {generatedPrompt.tips.length > 0 && (
                <View style={styles.promptBlock}>
                  <Text style={[styles.promptLabel, { color: colors.foreground }]}>Pro Tips</Text>
                  {generatedPrompt.tips.map((tip, i) => (
                    <View key={i} style={styles.tipRow}>
                      <View style={[styles.tipDot, { backgroundColor: isCustom ? colors.accent : toolColor }]} />
                      <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Variations */}
              {generatedPrompt.variations.length > 0 && (
                <View style={styles.promptBlock}>
                  <Text style={[styles.promptLabel, { color: colors.foreground }]}>Prompt Variations</Text>
                  {generatedPrompt.variations.map((variation, i) => (
                    <View key={i} style={[styles.variationBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.variationLabel, { color: colors.muted }]}>Variation {i + 1}</Text>
                      <Text style={[styles.promptText, { color: colors.foreground }]}>{variation}</Text>
                      <TouchableOpacity
                        onPress={() => copyText(variation, `var-${i}`)}
                        activeOpacity={0.7}
                        style={[styles.copyBtn, { backgroundColor: copiedField === `var-${i}` ? "#10B981" : colors.primary + "15", alignSelf: "flex-start", marginTop: 6 }]}
                      >
                        <IconSymbol name={copiedField === `var-${i}` ? "checkmark" : "doc.on.doc"} size={13} color={copiedField === `var-${i}` ? "#FFFFFF" : colors.primary} />
                        <Text style={[styles.copyBtnText, { color: copiedField === `var-${i}` ? "#FFFFFF" : colors.primary }]}>
                          {copiedField === `var-${i}` ? "Copied!" : "Copy"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Bottom Actions */}
              <View style={styles.resultActions}>
                <TouchableOpacity
                  onPress={() => copyText(generatedPrompt.mainPrompt, "main-bottom")}
                  activeOpacity={0.8}
                  style={[styles.resultActionBtn, { backgroundColor: isCustom ? colors.accent : toolColor }]}
                >
                  <IconSymbol name="doc.on.doc" size={16} color="#FFFFFF" />
                  <Text style={styles.resultActionBtnText}>Copy Prompt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  activeOpacity={0.8}
                  style={[styles.resultActionBtn, { backgroundColor: isSaved ? "#10B98120" : colors.surface, borderColor: isSaved ? "#10B981" : colors.border, borderWidth: 1 }]}
                >
                  <IconSymbol name={isSaved ? "bookmark.fill" : "bookmark"} size={16} color={isSaved ? "#10B981" : colors.foreground} />
                  <Text style={[styles.resultActionBtnText, { color: isSaved ? "#10B981" : colors.foreground }]}>
                    {isSaved ? "Saved!" : "Save"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={sharePrompt}
                  activeOpacity={0.8}
                  style={[styles.resultActionBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                >
                  <IconSymbol name="square.and.arrow.up" size={16} color={colors.foreground} />
                  <Text style={[styles.resultActionBtnText, { color: colors.foreground }]}>Share</Text>
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
  headerIconRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  headerSub: { fontSize: 13, marginTop: 2 },
  content: { padding: 16, gap: 12 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", letterSpacing: -0.1 },
  sectionHint: { fontSize: 12, lineHeight: 17, marginTop: -6 },
  toggleRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  toggleBtnText: { fontSize: 14, fontWeight: "700" },
  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toolCard: { borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 4, minWidth: "46%", flex: 1 },
  toolDot: { width: 8, height: 8, borderRadius: 4 },
  toolLabel: { fontSize: 13, fontWeight: "700" },
  toolDesc: { fontSize: 11, lineHeight: 15 },
  customToolInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  customToolInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: "600" },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 20, minHeight: 80, textAlignVertical: "top" },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16, marginTop: 4 },
  generateBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 },
  resultCard: { borderRadius: 20, borderWidth: 1.5, overflow: "hidden", marginTop: 4 },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  resultHeaderText: { flex: 1, fontSize: 14, fontWeight: "700" },
  actionIconBtn: { padding: 4, borderRadius: 8 },
  promptBlock: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  promptLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  promptLabel: { fontSize: 13, fontWeight: "700" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  copyBtnText: { fontSize: 12, fontWeight: "600" },
  promptBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  promptText: { fontSize: 13, lineHeight: 20 },
  qualityBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  qualityText: { flex: 1, fontSize: 13, lineHeight: 19 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },
  variationBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  variationLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  resultActions: { flexDirection: "row", gap: 8, padding: 16, paddingTop: 12 },
  resultActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  resultActionBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
});
