import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { NicheSheet } from "@/components/niche-sheet";
import * as Haptics from "expo-haptics";
import { Platform as RNPlatform } from "react-native";
import { DesktopContainer } from "@/components/desktop-container";

type Tool = {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
};

const TOOLS: Tool[] = [
  {
    id: "prompt",
    title: "Prompt Generator",
    description: "Craft perfect image & video prompts for Midjourney, DALL-E, Sora, Runway, and more.",
    icon: "wand.and.stars",
    route: "/(tabs)/prompt",
    color: "#7C3AED",
    badge: "AI",
  },
  {
    id: "caption",
    title: "Caption Writer",
    description: "Write platform-optimized captions with hashtags, tone control, and character counts.",
    icon: "text.bubble.fill",
    route: "/(tabs)/caption",
    color: "#E1306C",
    badge: "AI",
  },
  {
    id: "calendar",
    title: "Content Calendar",
    description: "Schedule your ideas to specific dates and platforms. Plan your posting strategy.",
    icon: "calendar",
    route: "/(tabs)/calendar",
    color: "#0D9488",
  },
  {
    id: "tracker",
    title: "Performance Tracker",
    description: "Log actual post metrics and compare against AI predictions to improve over time.",
    icon: "chart.line.uptrend.xyaxis",
    route: "/(tabs)/tracker",
    color: "#F59E0B",
  },
  {
    id: "history",
    title: "History",
    description: "Browse all your saved ideas, URL analyses, prompts, and captions in one place.",
    icon: "clock.arrow.circlepath",
    route: "/(tabs)/history",
    color: "#0D9488",
  },
];

const QUICK_TIPS = [
  { icon: "lightbulb.fill", color: "#F59E0B", tip: "Generate ideas first, then write captions for the best ones." },
  { icon: "wand.and.stars", color: "#7C3AED", tip: "Use the Prompt Generator with your niche for on-brand visuals." },
  { icon: "chart.line.uptrend.xyaxis", color: "#0D9488", tip: "Track 5 posts to see which content type performs best for you." },
];

export default function ToolsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { niche } = useNiche();
  const [nicheSheetVisible, setNicheSheetVisible] = useState(false);

  const handleToolPress = (tool: Tool) => {
    if (RNPlatform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(tool.route as any);
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <DesktopContainer>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.navy }]}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Tools</Text>
                <Text style={styles.headerSub}>Your content creation toolkit</Text>
              </View>
              <TouchableOpacity
                onPress={() => setNicheSheetVisible(true)}
                style={[styles.nicheBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              >
                <IconSymbol name="tag.fill" size={12} color="#F0C040" />
                <Text style={styles.nicheText} numberOfLines={1}>
                  {niche || "Set Niche"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tools Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Tools</Text>
            <View style={styles.toolsGrid}>
              {TOOLS.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  onPress={() => handleToolPress(tool)}
                  style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.75}
                >
                  <View style={styles.toolCardTop}>
                    <View style={[styles.toolIcon, { backgroundColor: tool.color + "20" }]}>
                      <IconSymbol name={tool.icon as any} size={22} color={tool.color} />
                    </View>
                    {tool.badge && (
                      <View style={[styles.aiBadge, { backgroundColor: colors.accent + "20" }]}>
                        <Text style={[styles.aiBadgeText, { color: colors.accent }]}>{tool.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.toolTitle, { color: colors.foreground }]}>{tool.title}</Text>
                  <Text style={[styles.toolDesc, { color: colors.muted }]} numberOfLines={3}>
                    {tool.description}
                  </Text>
                  <View style={[styles.toolArrow, { backgroundColor: tool.color + "15" }]}>
                    <IconSymbol name="arrow.right" size={14} color={tool.color} />
                    <Text style={[styles.toolArrowText, { color: tool.color }]}>Open</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Tips */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pro Tips</Text>
            <View style={styles.tipsContainer}>
              {QUICK_TIPS.map((tip, idx) => (
                <View
                  key={idx}
                  style={[styles.tipRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.tipIcon, { backgroundColor: tip.color + "20" }]}>
                    <IconSymbol name={tip.icon as any} size={16} color={tip.color} />
                  </View>
                  <Text style={[styles.tipText, { color: colors.muted }]}>{tip.tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Workflow Banner */}
          <View style={[styles.workflowBanner, { backgroundColor: colors.navy }]}>
            <View style={styles.workflowHeader}>
              <IconSymbol name="sparkles" size={18} color="#F0C040" />
              <Text style={styles.workflowTitle}>Recommended Workflow</Text>
            </View>
            <View style={styles.workflowSteps}>
              {[
                { num: "1", label: "Generate Ideas", sub: "Pick niche + platform" },
                { num: "2", label: "Write Caption", sub: "Add hashtags + tone" },
                { num: "3", label: "Create Visuals", sub: "Use Prompt Generator" },
                { num: "4", label: "Schedule & Track", sub: "Calendar + Tracker" },
              ].map((step, idx) => (
                <View key={idx} style={styles.workflowStep}>
                  <View style={[styles.workflowNum, { backgroundColor: colors.accent }]}>
                    <Text style={styles.workflowNumText}>{step.num}</Text>
                  </View>
                  <Text style={styles.workflowLabel}>{step.label}</Text>
                  <Text style={styles.workflowSub}>{step.sub}</Text>
                </View>
              ))}
            </View>
          </View>
        </DesktopContainer>
      </ScrollView>

      <NicheSheet visible={nicheSheetVisible} onClose={() => setNicheSheetVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  nicheBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    maxWidth: 140,
  },
  nicheText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  toolCard: {
    width: "47%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  toolCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  toolDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  toolArrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  toolArrowText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tipsContainer: {
    gap: 8,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  workflowBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  workflowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  workflowTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  workflowSteps: {
    flexDirection: "row",
    gap: 8,
  },
  workflowStep: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  workflowNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  workflowNumText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  workflowLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  workflowSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
});
