import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { NicheSheet } from "@/components/niche-sheet";
import { PLATFORMS } from "@/lib/types";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { DesktopContainer } from "@/components/desktop-container";

type PlatformFilter = "all" | "instagram" | "facebook" | "tiktok" | "youtube" | "linkedin";

type NicheIntelligenceResult = {
  nicheOverview: string;
  competitorLandscape: {
    dominantAccountTypes: string[];
    commonContentStyles: string[];
    postingPatterns: string;
    toneAndVoice: string;
  };
  contentGaps: Array<{
    gap: string;
    opportunity: string;
    contentFormat: string;
  }>;
  audiencePainPoints: Array<{
    painPoint: string;
    contentAngle: string;
  }>;
  contentPillars: Array<{
    pillar: string;
    description: string;
    exampleTopics: string[];
  }>;
  quickWins: string[];
};

function SectionCard({
  label,
  labelColor,
  bgColor,
  children,
}: {
  label: string;
  labelColor: string;
  bgColor: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.sectionCard, { backgroundColor: bgColor, borderColor: colors.border }]}>
      <Text style={[styles.sectionCardLabel, { color: labelColor }]}>{label}</Text>
      {children}
    </View>
  );
}

export default function NicheIntelligenceScreen() {
  const colors = useColors();
  const { niche } = useNiche();
  const [nicheSheetVisible, setNicheSheetVisible] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [result, setResult] = useState<NicheIntelligenceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPillar, setExpandedPillar] = useState<number | null>(null);

  const intelligenceMutation = trpc.content.getNicheIntelligence.useMutation();

  const handleGenerate = useCallback(async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setResult(null);
    try {
      const data = await intelligenceMutation.mutateAsync({
        niche,
        platform: platformFilter,
      });
      setResult(data as NicheIntelligenceResult);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
    }
  }, [niche, platformFilter, intelligenceMutation]);

  return (
    <ScreenContainer>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.navy }]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Niche Intelligence</Text>
              <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
                Competitor landscape, content gaps & strategy
              </Text>
            </View>
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

        <DesktopContainer>
          {/* Platform Filter */}
          <View style={[styles.filterWrap, { borderBottomColor: colors.border }]}>
            <Text style={[styles.filterLabel, { color: colors.foreground }]}>Focus Platform</Text>
            <View style={styles.filterRow}>
              {[{ id: "all", label: "All Platforms" }, ...PLATFORMS].map((p) => {
                const isActive = platformFilter === p.id;
                const pColor =
                  p.id === "all"
                    ? colors.primary
                    : PLATFORMS.find((pl) => pl.id === p.id)?.color ?? colors.primary;
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
            </View>
          </View>

          {/* Disclaimer */}
          <View style={[styles.disclaimer, { backgroundColor: "#F59E0B10", borderColor: "#F59E0B30" }]}>
            <Text style={[styles.disclaimerText, { color: "#92400E" }]}>
              ⚠️ Based on AI training data, not live account analytics. Use as a strategic starting point.
            </Text>
          </View>

          {/* Generate Button */}
          <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={isLoading}
              activeOpacity={0.85}
              style={[styles.generateBtn, { backgroundColor: isLoading ? colors.muted : colors.primary }]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <IconSymbol name="binoculars.fill" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.generateBtnText}>
                {isLoading ? "Analyzing Niche..." : "Analyze My Niche"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          {result && (
            <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 16 }}>

              {/* Niche Overview */}
              <SectionCard label="NICHE OVERVIEW" labelColor={colors.primary} bgColor={colors.primary + "08"}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{result.nicheOverview}</Text>
              </SectionCard>

              {/* Quick Wins */}
              {result.quickWins?.length > 0 && (
                <SectionCard label="⚡ QUICK WINS" labelColor="#10B981" bgColor="#10B98108">
                  {result.quickWins.map((win, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: "#10B981" }]} />
                      <Text style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}>{win}</Text>
                    </View>
                  ))}
                </SectionCard>
              )}

              {/* Competitor Landscape */}
              <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.groupCardTitle, { color: colors.foreground }]}>Competitor Landscape</Text>

                <View style={[styles.subCard, { backgroundColor: colors.navy + "10" }]}>
                  <Text style={[styles.subCardLabel, { color: colors.navy }]}>DOMINANT ACCOUNT TYPES</Text>
                  {result.competitorLandscape.dominantAccountTypes.map((t, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: colors.navy }]} />
                      <Text style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}>{t}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.subCard, { backgroundColor: colors.primary + "08" }]}>
                  <Text style={[styles.subCardLabel, { color: colors.primary }]}>COMMON CONTENT STYLES</Text>
                  {result.competitorLandscape.commonContentStyles.map((s, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}>{s}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.subCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.subCardLabel, { color: colors.muted }]}>POSTING PATTERNS</Text>
                  <Text style={[styles.bodyText, { color: colors.foreground }]}>{result.competitorLandscape.postingPatterns}</Text>
                </View>

                <View style={[styles.subCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.subCardLabel, { color: colors.muted }]}>TONE & VOICE</Text>
                  <Text style={[styles.bodyText, { color: colors.foreground }]}>{result.competitorLandscape.toneAndVoice}</Text>
                </View>
              </View>

              {/* Content Gaps */}
              <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.groupCardTitle, { color: colors.foreground }]}>Content Gaps</Text>
                <Text style={[styles.groupCardSub, { color: colors.muted }]}>Underserved angles you can own</Text>
                {result.contentGaps.map((gap, i) => (
                  <View key={i} style={[styles.gapCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.gapHeader}>
                      <View style={[styles.gapBadge, { backgroundColor: colors.accent + "15" }]}>
                        <Text style={[styles.gapBadgeText, { color: colors.accent }]}>{gap.contentFormat}</Text>
                      </View>
                    </View>
                    <Text style={[styles.gapTitle, { color: colors.foreground }]}>{gap.gap}</Text>
                    <Text style={[styles.bodyText, { color: colors.muted }]}>{gap.opportunity}</Text>
                  </View>
                ))}
              </View>

              {/* Audience Pain Points */}
              <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.groupCardTitle, { color: colors.foreground }]}>Audience Pain Points</Text>
                <Text style={[styles.groupCardSub, { color: colors.muted }]}>What your audience struggles with</Text>
                {result.audiencePainPoints.map((pt, i) => (
                  <View key={i} style={[styles.subCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.subCardLabel, { color: colors.error }]}>PAIN POINT</Text>
                    <Text style={[styles.bodyText, { color: colors.foreground, fontWeight: "600" }]}>{pt.painPoint}</Text>
                    <Text style={[styles.subCardLabel, { color: colors.primary, marginTop: 6 }]}>CONTENT ANGLE</Text>
                    <Text style={[styles.bodyText, { color: colors.foreground }]}>{pt.contentAngle}</Text>
                  </View>
                ))}
              </View>

              {/* Content Pillars */}
              <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.groupCardTitle, { color: colors.foreground }]}>Content Pillars</Text>
                <Text style={[styles.groupCardSub, { color: colors.muted }]}>Core themes to build your presence around</Text>
                {result.contentPillars.map((pillar, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setExpandedPillar(expandedPillar === i ? null : i)}
                    activeOpacity={0.85}
                    style={[styles.pillarCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <View style={styles.pillarHeader}>
                      <View style={[styles.pillarNumber, { backgroundColor: colors.primary }]}>
                        <Text style={styles.pillarNumberText}>{i + 1}</Text>
                      </View>
                      <Text style={[styles.pillarTitle, { color: colors.foreground, flex: 1 }]}>{pillar.pillar}</Text>
                      <IconSymbol
                        name={expandedPillar === i ? "chevron.up" : "chevron.down"}
                        size={14}
                        color={colors.muted}
                      />
                    </View>
                    {expandedPillar === i && (
                      <View style={{ gap: 8, marginTop: 10 }}>
                        <Text style={[styles.bodyText, { color: colors.muted }]}>{pillar.description}</Text>
                        <Text style={[styles.subCardLabel, { color: colors.primary }]}>EXAMPLE TOPICS</Text>
                        {pillar.exampleTopics.map((topic, j) => (
                          <View key={j} style={styles.bulletRow}>
                            <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}>{topic}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

            </View>
          )}

          {/* Empty State */}
          {!result && !isLoading && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
                <IconSymbol name="binoculars.fill" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Know Your Niche</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Get a strategic breakdown of your niche — competitor landscape, content gaps, audience pain points, and content pillars to build your presence around.
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  disclaimer: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  generateBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
  },
  sectionCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  groupCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  groupCardSub: {
    fontSize: 12,
    marginTop: -4,
  },
  subCard: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  subCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  gapCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  gapHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  gapBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gapBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  gapTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  pillarCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pillarNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pillarNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
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
