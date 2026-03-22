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
import { UrlAnalysis } from "@/lib/types";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_ANALYSES_KEY = "@contentcraft_analyses";

function ResonanceRing({ score, color }: { score: number; color: string }) {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 75) return "#10B981";
    if (s >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const scoreColor = getScoreColor(score);

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: scoreColor + "25",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
        }}
      />
      <View
        style={{
          width: size - strokeWidth * 2 - 4,
          height: size - strokeWidth * 2 - 4,
          borderRadius: (size - strokeWidth * 2 - 4) / 2,
          borderWidth: strokeWidth,
          borderColor: scoreColor,
          borderTopColor: "transparent",
          borderRightColor: score > 25 ? scoreColor : "transparent",
          borderBottomColor: score > 50 ? scoreColor : "transparent",
          borderLeftColor: score > 75 ? scoreColor : "transparent",
          position: "absolute",
          transform: [{ rotate: "-90deg" }],
        }}
      />
      <Text style={{ fontSize: 22, fontWeight: "800", color: scoreColor }}>{score}</Text>
      <Text style={{ fontSize: 10, color: "#9CA3AF", fontWeight: "600" }}>/ 100</Text>
    </View>
  );
}

export default function AnalyzeScreen() {
  const colors = useColors();
  const { niche } = useNiche();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<UrlAnalysis | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<UrlAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const analyzeMutation = trpc.content.analyzeUrl.useMutation();

  const loadHistory = useCallback(async () => {
    const data = await AsyncStorage.getItem(SAVED_ANALYSES_KEY);
    if (data) setSavedAnalyses(JSON.parse(data));
  }, []);

  const saveAnalysis = useCallback(async (a: UrlAnalysis) => {
    const data = await AsyncStorage.getItem(SAVED_ANALYSES_KEY);
    const existing: UrlAnalysis[] = data ? JSON.parse(data) : [];
    const updated = [a, ...existing.filter((e) => e.id !== a.id)].slice(0, 20);
    await AsyncStorage.setItem(SAVED_ANALYSES_KEY, JSON.stringify(updated));
    setSavedAnalyses(updated);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) {
      Alert.alert("Enter a URL", "Please paste a social media content URL to analyze.");
      return;
    }
    if (!url.startsWith("http")) {
      Alert.alert("Invalid URL", "Please enter a valid URL starting with http:// or https://");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeMutation.mutateAsync({ url: url.trim(), niche });
      const analysisResult = result as UrlAnalysis;
      setAnalysis(analysisResult);
      await saveAnalysis(analysisResult);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Analysis Failed", "Could not analyze this URL. Please check the URL and try again.");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [url, niche, analyzeMutation, saveAnalysis]);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 65) return "Good";
    if (score >= 50) return "Average";
    if (score >= 35) return "Below Average";
    return "Poor";
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#10B981";
    if (score >= 50) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.navy }]}>
          <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>URL Analyzer</Text>
          <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
            Understand why content resonates with audiences
          </Text>
        </View>

        {/* URL Input */}
        <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Paste Content URL</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <IconSymbol name="link" size={18} color={colors.muted} />
            <TextInput
              style={[styles.urlInput, { color: colors.foreground }]}
              placeholder="https://www.instagram.com/p/..."
              placeholderTextColor={colors.muted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleAnalyze}
            />
            {url.length > 0 && (
              <TouchableOpacity onPress={() => setUrl("")} activeOpacity={0.7}>
                <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={isAnalyzing}
            activeOpacity={0.85}
            style={[
              styles.analyzeBtn,
              { backgroundColor: isAnalyzing ? colors.muted : colors.primary },
            ]}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <IconSymbol name="wand.and.stars" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.analyzeBtnText}>
              {isAnalyzing ? "Analyzing Content..." : "Analyze Content"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.supportedText, { color: colors.muted }]}>
            Supports Instagram, TikTok, YouTube, Facebook, LinkedIn & more
          </Text>
        </View>

        {/* Analysis Result */}
        {analysis && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            {/* Score Card */}
            <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.scoreRow}>
                <View style={styles.scoreLeft}>
                  <Text style={[styles.scoreTitle, { color: colors.foreground }]}>Resonance Score</Text>
                  <Text style={[styles.scoreLabel, { color: getScoreColor(analysis.resonanceScore) }]}>
                    {getScoreLabel(analysis.resonanceScore)}
                  </Text>
                  {analysis.platform && (analysis.platform as string) !== "unknown" && (
                    <View style={[styles.platformTag, { backgroundColor: getPlatformColor(analysis.platform) + "20" }]}>
                      <Text style={[styles.platformTagText, { color: getPlatformColor(analysis.platform) }]}>
                        {analysis.platform.charAt(0).toUpperCase() + analysis.platform.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>
                <ResonanceRing score={analysis.resonanceScore} color={getScoreColor(analysis.resonanceScore)} />
              </View>
              {analysis.title && (
                <Text style={[styles.analysisTitle, { color: colors.muted }]} numberOfLines={2}>
                  {analysis.title}
                </Text>
              )}
              <Text style={[styles.analysisSummary, { color: colors.foreground }]}>{analysis.summary}</Text>
            </View>

            {/* What Worked */}
            <View style={[styles.analysisSection, { backgroundColor: "#10B98110", borderColor: "#10B98130" }]}>
              <View style={styles.analysisSectionHeader}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
                <Text style={[styles.analysisSectionTitle, { color: "#10B981" }]}>What Worked</Text>
              </View>
              {analysis.whatWorked.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: "#10B981" }]} />
                  <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                </View>
              ))}
            </View>

            {/* What Didn't Work */}
            {analysis.whatDidntWork.length > 0 && (
              <View style={[styles.analysisSection, { backgroundColor: "#EF444410", borderColor: "#EF444430" }]}>
                <View style={styles.analysisSectionHeader}>
                  <IconSymbol name="exclamationmark.circle.fill" size={20} color="#EF4444" />
                  <Text style={[styles.analysisSectionTitle, { color: "#EF4444" }]}>What Didn't Work</Text>
                </View>
                {analysis.whatDidntWork.map((item, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: "#EF4444" }]} />
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Audience Insights */}
            <View style={[styles.analysisSection, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <View style={styles.analysisSectionHeader}>
                <IconSymbol name="person.fill" size={20} color={colors.primary} />
                <Text style={[styles.analysisSectionTitle, { color: colors.primary }]}>Audience Insights</Text>
              </View>
              <Text style={[styles.insightText, { color: colors.foreground }]}>{analysis.audienceInsights}</Text>
            </View>

            {/* Framework Recommendation */}
            <View style={[styles.analysisSection, { backgroundColor: colors.accent + "10", borderColor: colors.accent + "30" }]}>
              <View style={styles.analysisSectionHeader}>
                <IconSymbol name="text.alignleft" size={20} color={colors.accent} />
                <Text style={[styles.analysisSectionTitle, { color: colors.accent }]}>Framework Recommendation</Text>
              </View>
              <Text style={[styles.insightText, { color: colors.foreground }]}>{analysis.frameworkRecommendation}</Text>
            </View>
          </View>
        )}

        {/* Empty State */}
        {!analysis && !isAnalyzing && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Analyze Any Content</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Paste a URL from any social media platform to get a detailed analysis of why the content resonated — or didn't — with its audience.
            </Text>
            <View style={[styles.exampleBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.exampleTitle, { color: colors.foreground }]}>What you'll get:</Text>
              {[
                "Resonance score (0–100)",
                "What worked well",
                "Areas for improvement",
                "Audience behavior insights",
                "Framework recommendation",
              ].map((item, i) => (
                <View key={i} style={styles.exampleRow}>
                  <IconSymbol name="checkmark" size={14} color={colors.primary} />
                  <Text style={[styles.exampleText, { color: colors.muted }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function getPlatformColor(platform: string): string {
  const map: Record<string, string> = {
    instagram: "#E1306C",
    facebook: "#1877F2",
    tiktok: "#010101",
    youtube: "#FF0000",
    linkedin: "#0A66C2",
  };
  return map[platform] ?? "#888";
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
  inputCard: {
    margin: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  urlInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
  },
  analyzeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  supportedText: {
    fontSize: 12,
    textAlign: "center",
  },
  scoreCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
    gap: 12,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreLeft: {
    flex: 1,
    gap: 6,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  scoreLabel: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  platformTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  platformTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  analysisTitle: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  analysisSummary: {
    fontSize: 14,
    lineHeight: 21,
  },
  analysisSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  analysisSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  analysisSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 21,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
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
  exampleBox: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exampleText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
