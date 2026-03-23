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

  const handleCopy = useCallback(async (idea: ContentIdea) => {
    const text = `${idea.title}\n\n${idea.hook}\n\n${idea.body}\n\n${idea.cta}`;
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied!", "Idea copied to clipboard.");
  }, []);

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
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Platform</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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
          </ScrollView>
        </View>

        {/* Content Type Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Content Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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
          </ScrollView>
        </View>

        {/* Generate Button */}
        <View style={{ paddingHorizontal: 20, marginTop: 4, marginBottom: 8 }}>
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
                      <View style={[styles.ideaSection, { backgroundColor: colors.primary + "08" }]}>
                        <Text style={[styles.ideaSectionLabel, { color: colors.primary }]}>BODY</Text>
                        <Text style={[styles.ideaSectionText, { color: colors.foreground }]}>{idea.body}</Text>
                      </View>
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
