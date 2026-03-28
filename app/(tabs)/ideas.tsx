import React, { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { useSavedIdeas } from "@/lib/saved-ideas-context";
import { NicheSheet } from "@/components/niche-sheet";
import { PLATFORMS, CONTENT_TYPES, ContentIdea, Platform as SocialPlatform, ContentType } from "@/lib/types";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { DesktopContainer } from "@/components/desktop-container";

export default function IdeasScreen() {
  const colors = useColors();
  const { niche } = useNiche();
  const { saveIdea, removeIdea, isIdeaSaved } = useSavedIdeas();
  const [nicheSheetVisible, setNicheSheetVisible] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("instagram");
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("post");
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const generateMutation = trpc.content.generateIdeas.useMutation();

  const availableContentTypes = CONTENT_TYPES.filter((ct) =>
    ct.platforms.includes(selectedPlatform)
  );

  const handleGenerate = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({
        platform: selectedPlatform,
        contentType: selectedContentType,
        niche,
      });
      setIdeas(result.ideas as ContentIdea[]);
      setExpandedId(null);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", "Failed to generate ideas. Please try again.");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedPlatform, selectedContentType, niche, generateMutation]);

  const buildCopyText = useCallback((idea: any): string => {
    const lines: string[] = [`${idea.title}`, ``, `HOOK: ${idea.hook}`, ``];

    if (idea.script) {
      lines.push(`--- FULL SCRIPT ---`);
      lines.push(`INTRO: ${idea.script.intro}`);
      if (Array.isArray(idea.script.scenes)) {
        idea.script.scenes.forEach((s: any) => {
          lines.push(``, `SCENE ${s.sceneNumber} (${s.duration}): ${s.description}`);
          if (s.dialogue) lines.push(`DIALOGUE: ${s.dialogue}`);
        });
      }
      lines.push(``, `OUTRO: ${idea.script.outro}`);
      if (idea.estimatedDuration) lines.push(``, `Duration: ${idea.estimatedDuration}`);
      if (idea.productionNotes) lines.push(`Production Notes: ${idea.productionNotes}`);
    } else if (idea.slides) {
      lines.push(`--- CAROUSEL BREAKDOWN (${idea.slideCount ?? idea.slides.length} slides) ---`);
      idea.slides.forEach((s: any) => {
        lines.push(``, `SLIDE ${s.slideNumber}: ${s.headline}`);
        if (s.bodyText) lines.push(s.bodyText);
        if (s.visualDirection) lines.push(`Visual: ${s.visualDirection}`);
      });
    } else if (idea.imageConceptDetails) {
      lines.push(`--- IMAGE CONCEPT ---`);
      lines.push(`Composition: ${idea.imageConceptDetails.composition}`);
      lines.push(`Text Overlay: ${idea.imageConceptDetails.textOverlay}`);
      lines.push(`Color/Mood: ${idea.imageConceptDetails.colorMood}`);
      lines.push(`Style: ${idea.imageConceptDetails.style}`);
      if (idea.toolSuggestions?.length) lines.push(``, `Tools: ${idea.toolSuggestions.join(', ')}`);
      if (idea.captionHint) lines.push(`Caption Hint: ${idea.captionHint}`);
    } else if (idea.shortScript) {
      lines.push(`--- SHORT VIDEO SCRIPT ---`);
      lines.push(`Hook (first 3s): ${idea.shortScript.hook}`);
      if (Array.isArray(idea.shortScript.keyPoints)) {
        lines.push(``, `Key Points:`);
        idea.shortScript.keyPoints.forEach((pt: string) => lines.push(`• ${pt}`));
      }
      lines.push(``, `Closing: ${idea.shortScript.closingLine}`);
      if (idea.trendAngle) lines.push(`Trend Angle: ${idea.trendAngle}`);
    } else if (idea.outline) {
      lines.push(`--- CONTENT OUTLINE ---`);
      lines.push(`Intro: ${idea.outline.intro}`);
      if (Array.isArray(idea.outline.sections)) {
        idea.outline.sections.forEach((sec: any) => {
          lines.push(``, `${sec.heading}:`);
          if (Array.isArray(sec.keyPoints)) sec.keyPoints.forEach((pt: string) => lines.push(`• ${pt}`));
        });
      }
      lines.push(``, `Conclusion: ${idea.outline.conclusion}`);
      if (idea.seoAngle) lines.push(`SEO Angle: ${idea.seoAngle}`);
    } else if (idea.talkingHeadScript) {
      lines.push(`--- TALKING HEAD SCRIPT ---`);
      lines.push(`Opening Hook: ${idea.talkingHeadScript.openingHook}`);
      if (Array.isArray(idea.talkingHeadScript.keyTalkingPoints)) {
        lines.push(``, `Key Talking Points:`);
        idea.talkingHeadScript.keyTalkingPoints.forEach((pt: string) => lines.push(`• ${pt}`));
      }
      lines.push(``, `Personality Angle: ${idea.talkingHeadScript.personalityAngle}`);
      lines.push(`Closing Line: ${idea.talkingHeadScript.closingLine}`);
      if (idea.topicCategory) lines.push(``, `Topic Category: ${idea.topicCategory}`);
      if (idea.estimatedDuration) lines.push(`Duration: ${idea.estimatedDuration}`);
      if (idea.expertiseAngle) lines.push(`Expertise Angle: ${idea.expertiseAngle}`);
      if (idea.audienceProblemSolved) lines.push(`Audience Problem Solved: ${idea.audienceProblemSolved}`);
    } else if (idea.postStructure) {
      lines.push(idea.postStructure.openingLine);
      lines.push(``, idea.postStructure.mainContent);
      lines.push(``, idea.postStructure.closingCTA);
    } else {
      lines.push(idea.body);
    }

    lines.push(``, `CTA: ${idea.cta}`);
    return lines.join('\n');
  }, []);

  const handleCopy = useCallback(async (idea: ContentIdea) => {
    const text = buildCopyText(idea);
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied!", "Full content copied to clipboard. Paste into Caption Writer for captions.");
  }, [buildCopyText]);

  const handleSaveToggle = useCallback(
    async (idea: ContentIdea) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isIdeaSaved(idea.id)) {
        await removeIdea(idea.id);
      } else {
        await saveIdea(idea);
      }
    },
    [isIdeaSaved, saveIdea, removeIdea]
  );

  return (
    <ScreenContainer>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.navy }]}>
          <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Idea Generator</Text>
          <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
            AI-powered content ideas for every platform
          </Text>
          <TouchableOpacity
            onPress={() => setNicheSheetVisible(true)}
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

        {/* Platform Selector */}
        <DesktopContainer>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Platform</Text>
          <View style={styles.chipWrap}>
            {PLATFORMS.map((p) => {
              const isActive = selectedPlatform === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    setSelectedPlatform(p.id);
                    const types = CONTENT_TYPES.filter((ct) => ct.platforms.includes(p.id));
                    if (types.length > 0) setSelectedContentType(types[0].id);
                  }}
                  activeOpacity={0.75}
                  style={[
                    styles.platformChip,
                    {
                      backgroundColor: isActive ? p.color : colors.surface,
                      borderColor: isActive ? p.color : colors.border,
                    },
                  ]}
                >
                  <IconSymbol name={p.iconName as any} size={16} color={isActive ? "#FFFFFF" : p.color} />
                  <Text style={[styles.chipLabel, { color: isActive ? "#FFFFFF" : colors.foreground }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        </DesktopContainer>
        {/* Content Type Selector */}
        <DesktopContainer>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Content Type</Text>
          <View style={styles.chipWrap}>
            {availableContentTypes.map((ct) => {
              const isActive = selectedContentType === ct.id;
              return (
                <TouchableOpacity
                  key={ct.id}
                  onPress={() => setSelectedContentType(ct.id)}
                  activeOpacity={0.75}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipLabel, { color: isActive ? "#FFFFFF" : colors.foreground }]}>
                    {ct.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        </DesktopContainer>
        {/* Generate Button */}
        <DesktopContainer>
        <View style={{ paddingHorizontal: 0, marginTop: 4, marginBottom: 8 }}>
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.85}
            style={[
              styles.generateBtn,
              { backgroundColor: isGenerating ? colors.muted : colors.primary },
            ]}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.generateBtnText}>
              {isGenerating ? "Generating Ideas..." : "Generate 5 Ideas"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ideas List */}
        {ideas.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
              Generated Ideas ({ideas.length})
            </Text>
            {ideas.map((idea) => {
              const isExpanded = expandedId === idea.id;
              const isSaved = isIdeaSaved(idea.id);
              const platform = PLATFORMS.find((p) => p.id === idea.platform);
              return (
                <View
                  key={idea.id}
                  style={[styles.ideaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <TouchableOpacity
                    onPress={() => setExpandedId(isExpanded ? null : idea.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.ideaCardTop}>
                      <View style={[styles.platformBadge, { backgroundColor: (platform?.color ?? "#888") + "20" }]}>
                        <View style={[styles.platformDot, { backgroundColor: platform?.color ?? "#888" }]} />
                        <Text style={[styles.platformBadgeText, { color: platform?.color ?? "#888" }]}>
                          {platform?.label}
                        </Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: colors.primary + "15" }]}>
                        <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{idea.contentType}</Text>
                      </View>
                      <IconSymbol
                        name={isExpanded ? "chevron.down" : "chevron.right"}
                        size={16}
                        color={colors.muted}
                      />
                    </View>
                    <Text style={[styles.ideaTitle, { color: colors.foreground }]}>{idea.title}</Text>
                    <Text
                      style={[styles.ideaHook, { color: colors.muted }]}
                      numberOfLines={isExpanded ? undefined : 2}
                    >
                      {idea.hook}
                    </Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.ideaExpanded, { borderTopColor: colors.border }]}>
                      {/* Body summary always shown */}
                      <View style={[styles.ideaSection, { backgroundColor: colors.primary + "08" }]}>
                        <Text style={[styles.ideaSectionLabel, { color: colors.primary }]}>OVERVIEW</Text>
                        <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{idea.body}</Text>
                      </View>

                      {/* Scripted Video */}
                      {(idea as any).script && (
                        <>
                          {(idea as any).estimatedDuration && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>ESTIMATED DURATION</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).estimatedDuration}</Text>
                            </View>
                          )}
                          <View style={[styles.ideaSection, { backgroundColor: colors.navy + "12" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.navy }]}>INTRO (Hook)</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).script.intro}</Text>
                          </View>
                          {Array.isArray((idea as any).script.scenes) && (idea as any).script.scenes.map((scene: any) => (
                            <View key={scene.sceneNumber} style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.primary }]}>SCENE {scene.sceneNumber} · {scene.duration}</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{scene.description}</Text>
                              {scene.dialogue ? <Text style={[styles.ideaSectionText, { color: colors.muted, fontStyle: 'italic', marginTop: 4 }]}>🎙 {scene.dialogue}</Text> : null}
                            </View>
                          ))}
                          <View style={[styles.ideaSection, { backgroundColor: colors.accent + "12" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.accent }]}>OUTRO (CTA)</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).script.outro}</Text>
                          </View>
                          {(idea as any).productionNotes && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>PRODUCTION NOTES</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).productionNotes}</Text>
                            </View>
                          )}
                        </>
                      )}

                      {/* Carousel */}
                      {(idea as any).slides && (
                        <>
                          <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>CAROUSEL · {(idea as any).slideCount ?? (idea as any).slides.length} SLIDES</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.muted }]}>Tap Copy to get the full breakdown</Text>
                          </View>
                          {(idea as any).slides.map((slide: any) => (
                            <View key={slide.slideNumber} style={[styles.ideaSection, { backgroundColor: slide.slideNumber === 1 ? colors.primary + "10" : colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.primary }]}>SLIDE {slide.slideNumber}{slide.slideNumber === 1 ? ' (Cover)' : slide.slideNumber === (idea as any).slideCount ? ' (CTA)' : ''}</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground, fontWeight: '700' }]}>{slide.headline}</Text>
                              {slide.bodyText ? <Text style={[styles.ideaSectionText, { color: colors.foreground, marginTop: 2 }]}>{slide.bodyText}</Text> : null}
                              {slide.visualDirection ? <Text style={[styles.ideaSectionText, { color: colors.muted, fontStyle: 'italic', marginTop: 4 }]}>Visual: {slide.visualDirection}</Text> : null}
                            </View>
                          ))}
                        </>
                      )}

                      {/* Image/Graphic */}
                      {(idea as any).imageConceptDetails && (
                        <>
                          <View style={[styles.ideaSection, { backgroundColor: colors.navy + "10" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.navy }]}>COMPOSITION</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).imageConceptDetails.composition}</Text>
                          </View>
                          <View style={[styles.ideaSection, { backgroundColor: colors.accent + "10" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.accent }]}>TEXT OVERLAY</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).imageConceptDetails.textOverlay}</Text>
                          </View>
                          <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>COLOR / MOOD</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).imageConceptDetails.colorMood}</Text>
                          </View>
                          <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>STYLE</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).imageConceptDetails.style}</Text>
                          </View>
                          {Array.isArray((idea as any).toolSuggestions) && (idea as any).toolSuggestions.length > 0 && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.primary + "08" }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.primary }]}>TOOL SUGGESTIONS</Text>
                              {(idea as any).toolSuggestions.map((t: string, i: number) => (
                                <Text key={i} style={[styles.ideaSectionText, { color: colors.foreground }]}>• {t}</Text>
                              ))}
                            </View>
                          )}
                          {(idea as any).captionHint && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>CAPTION HINT</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).captionHint}</Text>
                            </View>
                          )}
                        </>
                      )}

                      {/* Short-form / Reel */}
                      {(idea as any).shortScript && (
                        <>
                          {(idea as any).estimatedDuration && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>DURATION</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).estimatedDuration}</Text>
                            </View>
                          )}
                          <View style={[styles.ideaSection, { backgroundColor: colors.primary + "10" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.primary }]}>HOOK (First 3 seconds)</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).shortScript.hook}</Text>
                          </View>
                          {Array.isArray((idea as any).shortScript.keyPoints) && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>KEY TALKING POINTS</Text>
                              {(idea as any).shortScript.keyPoints.map((pt: string, i: number) => (
                                <Text key={i} style={[styles.ideaSectionText, { color: colors.foreground }]}>• {pt}</Text>
                              ))}
                            </View>
                          )}
                          <View style={[styles.ideaSection, { backgroundColor: colors.accent + "10" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.accent }]}>CLOSING LINE</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).shortScript.closingLine}</Text>
                          </View>
                          {(idea as any).trendAngle && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>TREND ANGLE</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).trendAngle}</Text>
                            </View>
                          )}
                        </>
                      )}

                      {/* Long-form outline */}
                      {(idea as any).outline && (
                        <>
                          {(idea as any).estimatedLength && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>ESTIMATED LENGTH</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).estimatedLength}</Text>
                            </View>
                          )}
                          <View style={[styles.ideaSection, { backgroundColor: colors.navy + "10" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.navy }]}>INTRO / ANGLE</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).outline.intro}</Text>
                          </View>
                          {Array.isArray((idea as any).outline.sections) && (idea as any).outline.sections.map((sec: any, i: number) => (
                            <View key={i} style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.primary }]}>{sec.heading}</Text>
                              {Array.isArray(sec.keyPoints) && sec.keyPoints.map((pt: string, j: number) => (
                                <Text key={j} style={[styles.ideaSectionText, { color: colors.foreground }]}>• {pt}</Text>
                              ))}
                            </View>
                          ))}
                          <View style={[styles.ideaSection, { backgroundColor: colors.accent + "10" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.accent }]}>CONCLUSION</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).outline.conclusion}</Text>
                          </View>
                          {(idea as any).seoAngle && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>SEO ANGLE</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).seoAngle}</Text>
                            </View>
                          )}
                        </>
                      )}

                      {/* Post structure */}
                      {(idea as any).postStructure && (
                        <>
                          <View style={[styles.ideaSection, { backgroundColor: colors.primary + "08" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.primary }]}>OPENING LINE</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).postStructure.openingLine}</Text>
                          </View>
                          <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>MAIN CONTENT</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).postStructure.mainContent}</Text>
                          </View>
                          <View style={[styles.ideaSection, { backgroundColor: colors.accent + "08" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.accent }]}>CLOSING CTA</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).postStructure.closingCTA}</Text>
                          </View>
                          {(idea as any).visualSuggestion && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>VISUAL SUGGESTION</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).visualSuggestion}</Text>
                            </View>
                          )}
                        </>
                      )}

                      {/* Talking Head Script */}
                      {(idea as any).talkingHeadScript && (
                        <>
                          <View style={[styles.ideaSection, { backgroundColor: colors.primary + "08" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.primary }]}>OPENING HOOK (ON CAMERA)</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).talkingHeadScript.openingHook}</Text>
                          </View>
                          {Array.isArray((idea as any).talkingHeadScript.keyTalkingPoints) && (idea as any).talkingHeadScript.keyTalkingPoints.map((pt: string, i: number) => (
                            <View key={i} style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>TALKING POINT {i + 1}</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{pt}</Text>
                            </View>
                          ))}
                          <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>PERSONALITY ANGLE</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).talkingHeadScript.personalityAngle}</Text>
                          </View>
                          <View style={[styles.ideaSection, { backgroundColor: colors.navy + "10" }]}>
                            <Text style={[styles.ideaSectionLabel, { color: colors.navy }]}>CLOSING LINE</Text>
                            <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).talkingHeadScript.closingLine}</Text>
                          </View>
                          {(idea as any).topicCategory && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>TOPIC CATEGORY</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).topicCategory.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</Text>
                            </View>
                          )}
                          {(idea as any).expertiseAngle && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>EXPERTISE ANGLE</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).expertiseAngle}</Text>
                            </View>
                          )}
                          {(idea as any).audienceProblemSolved && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.accent + "08" }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.accent }]}>AUDIENCE PROBLEM SOLVED</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).audienceProblemSolved}</Text>
                            </View>
                          )}
                          {(idea as any).estimatedDuration && (
                            <View style={[styles.ideaSection, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.ideaSectionLabel, { color: colors.muted }]}>ESTIMATED DURATION</Text>
                              <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{(idea as any).estimatedDuration}</Text>
                            </View>
                          )}
                        </>
                      )}
                      {/* CTA always at bottom */}
                      <View style={[styles.ideaSection, { backgroundColor: colors.accent + "08" }]}>
                        <Text style={[styles.ideaSectionLabel, { color: colors.accent }]}>CALL TO ACTION</Text>
                        <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{idea.cta}</Text>
                      </View>
                    </View>
                  )}

                  <View style={[styles.ideaActions, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      onPress={() => handleCopy(idea)}
                      activeOpacity={0.7}
                      style={styles.actionBtn}
                    >
                      <IconSymbol name="doc.on.doc" size={16} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleSaveToggle(idea)}
                      activeOpacity={0.7}
                      style={styles.actionBtn}
                    >
                      <IconSymbol
                        name={isSaved ? "bookmark.fill" : "bookmark"}
                        size={16}
                        color={isSaved ? colors.accent : colors.muted}
                      />
                      <Text style={[styles.actionBtnText, { color: isSaved ? colors.accent : colors.muted }]}>
                        {isSaved ? "Saved" : "Save"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setExpandedId(isExpanded ? null : idea.id)}
                      activeOpacity={0.7}
                      style={styles.actionBtn}
                    >
                      <IconSymbol
                        name={isExpanded ? "eye.slash.fill" : "eye.fill"}
                        size={16}
                        color={colors.muted}
                      />
                      <Text style={[styles.actionBtnText, { color: colors.muted }]}>
                        {isExpanded ? "Less" : "More"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {ideas.length === 0 && !isGenerating && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="lightbulb.fill" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Ready to Create</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Select your platform and content type, then tap Generate to get AI-powered ideas tailored to your niche.
            </Text>
          </View>
        )}
        </DesktopContainer>
      </ScrollView>

      <NicheSheet visible={nicheSheetVisible} onClose={() => setNicheSheetVisible(false)} />
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
    marginBottom: 12,
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
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  chipRow: {
    gap: 8,
    paddingRight: 20,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  generateBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  ideaCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  ideaCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    paddingBottom: 8,
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
  ideaTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.2,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  ideaHook: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  ideaExpanded: {
    borderTopWidth: 1,
    padding: 14,
    gap: 10,
  },
  ideaSection: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  ideaSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  ideaSectionText: {
    fontSize: 13,
    lineHeight: 19,
  },
  ideaActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 48,
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
});
