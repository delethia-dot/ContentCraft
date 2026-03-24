import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { useOnboarding } from "@/lib/onboarding-context";
import { POPULAR_NICHES } from "@/lib/types";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURES = [
  {
    icon: "lightbulb.fill" as const,
    color: "#F0C040",
    title: "AI Idea Generator",
    description:
      "Generate 5 tailored content ideas for Instagram, TikTok, YouTube, Facebook, and LinkedIn — all tuned to your niche.",
  },
  {
    icon: "binoculars.fill" as const,
    color: "#EF4444",
    title: "Niche Intelligence",
    description:
      "Get a strategic breakdown of your niche — competitor landscape, content gaps, audience pain points, and content pillars to build your presence around.",
  },
  {
    icon: "pencil" as const,
    color: "#0A66C2",
    title: "Caption Writer",
    description:
      "Write platform-optimized captions with the right tone, hashtags, and character count — plus A/B hook alternatives to maximize engagement.",
  },
];

const NICHE_CATEGORIES = [
  {
    label: "Business",
    niches: ["Business & Entrepreneurship", "Personal Finance", "Real Estate"],
    color: "#0A66C2",
    icon: "briefcase.fill" as const,
  },
  {
    label: "Lifestyle",
    niches: ["Fitness & Health", "Mental Health & Wellness", "Food & Cooking", "Travel & Adventure"],
    color: "#E1306C",
    icon: "heart.fill" as const,
  },
  {
    label: "Creative",
    niches: ["Photography", "Art & Design", "Music & Entertainment", "DIY & Crafts"],
    color: "#8B5CF6",
    icon: "paintbrush.fill" as const,
  },
  {
    label: "Tech & Gaming",
    niches: ["Technology", "Gaming"],
    color: "#0D9488",
    icon: "desktopcomputer" as const,
  },
  {
    label: "Education",
    niches: ["Education & Learning", "Motivational & Self-Help"],
    color: "#F59E0B",
    icon: "book.fill" as const,
  },
  {
    label: "Family & Nature",
    niches: ["Parenting & Family", "Pets & Animals", "Sustainability & Eco", "Sports"],
    color: "#10B981",
    icon: "leaf.fill" as const,
  },
  {
    label: "Style",
    niches: ["Beauty & Fashion"],
    color: "#EC4899",
    icon: "sparkles" as const,
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { setNiche } = useNiche();
  const { completeOnboarding } = useOnboarding();

  const [step, setStep] = useState(0); // 0=welcome, 1=features, 2=niche
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [customNiche, setCustomNiche] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredNiches = searchQuery.trim()
    ? POPULAR_NICHES.filter((n) => n.toLowerCase().includes(searchQuery.toLowerCase()))
    : POPULAR_NICHES;

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => s + 1);
  }, []);

  const handleBack = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleSelectNiche = useCallback((niche: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedNiche(niche);
    setCustomNiche("");
  }, []);

  const handleFinish = useCallback(async () => {
    const finalNiche = customNiche.trim() || selectedNiche;
    if (!finalNiche) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaving(true);
    await setNiche(finalNiche);
    await completeOnboarding();
    setIsSaving(false);
    router.replace("/(tabs)");
  }, [customNiche, selectedNiche, setNiche, completeOnboarding, router]);

  const canFinish = !!(customNiche.trim() || selectedNiche);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top", "bottom", "left", "right"]}>
      {/* Progress Dots */}
      <View style={styles.progressRow}>
        {step > 0 && (
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        )}
        <View style={[styles.progressDots, step === 0 && { marginLeft: "auto", marginRight: "auto" }]}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === step ? colors.primary : colors.border,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        {step > 0 && <View style={styles.backBtn} />}
      </View>

      {/* Step Content */}
      {step === 0 && <WelcomeStep colors={colors} onNext={handleNext} />}
      {step === 1 && <FeaturesStep colors={colors} onNext={handleNext} />}
      {step === 2 && (
        <NicheStep
          colors={colors}
          selectedNiche={selectedNiche}
          customNiche={customNiche}
          searchQuery={searchQuery}
          filteredNiches={filteredNiches}
          canFinish={canFinish}
          isSaving={isSaving}
          onSelectNiche={handleSelectNiche}
          onCustomNicheChange={(t) => {
            setCustomNiche(t);
            if (t.trim()) setSelectedNiche(null);
          }}
          onSearchChange={setSearchQuery}
          onFinish={handleFinish}
        />
      )}
    </SafeAreaView>
  );
}

/* ─── Step 0: Welcome ─────────────────────────────────────────── */
function WelcomeStep({ colors, onNext }: { colors: any; onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeContent}>
        {/* Logo area */}
        <View style={[styles.logoWrap, { backgroundColor: colors.navy }]}>
          <View style={[styles.logoInner, { backgroundColor: "rgba(240,192,64,0.15)" }]}>
            <IconSymbol name="sparkles" size={48} color="#F0C040" />
          </View>
        </View>

        <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
          Welcome to{"\n"}
          <Text style={{ color: colors.primary }}>ContentCraft</Text>
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.muted }]}>
          Your AI-powered social media content studio. Generate ideas, analyze what works, and stay ahead of trends — all in one place.
        </Text>

        {/* Platform icons row */}
        <View style={styles.platformRow}>
          {[
            { label: "IG", color: "#E1306C" },
            { label: "FB", color: "#1877F2" },
            { label: "TK", color: "#00C2CB" },
            { label: "YT", color: "#FF0000" },
            { label: "LI", color: "#0A66C2" },
          ].map((p) => (
            <View key={p.label} style={[styles.platformPill, { backgroundColor: p.color + "18", borderColor: p.color + "40" }]}>
              <Text style={[styles.platformPillText, { color: p.color }]}>{p.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={onNext}
        activeOpacity={0.88}
        style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.primaryBtnText}>Get Started</Text>
        <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

/* ─── Step 1: Features ────────────────────────────────────────── */
function FeaturesStep({ colors, onNext }: { colors: any; onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>Everything you need to{" "}
          <Text style={{ color: colors.primary }}>create great content</Text>
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
          Three powerful tools designed to supercharge your social media presence.
        </Text>

        <View style={[styles.instructionNote, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
          <Text style={[styles.instructionText, { color: colors.primary }]}>
            Tap the Choose Your Niche button below to continue.
          </Text>
        </View>

        <View style={styles.featuresList}>
          {FEATURES.map((f, i) => (
            <View
              key={i}
              style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: f.color + "18" }]}>
                <IconSymbol name={f.icon} size={26} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.muted }]}>{f.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={onNext}
        activeOpacity={0.88}
        style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.primaryBtnText}>Choose Your Niche</Text>
        <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

/* ─── Step 2: Niche Selection ─────────────────────────────────── */
function NicheStep({
  colors,
  selectedNiche,
  customNiche,
  searchQuery,
  filteredNiches,
  canFinish,
  isSaving,
  onSelectNiche,
  onCustomNicheChange,
  onSearchChange,
  onFinish,
}: {
  colors: any;
  selectedNiche: string | null;
  customNiche: string;
  searchQuery: string;
  filteredNiches: string[];
  canFinish: boolean;
  isSaving: boolean;
  onSelectNiche: (n: string) => void;
  onCustomNicheChange: (t: string) => void;
  onSearchChange: (t: string) => void;
  onFinish: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.foreground }]}>
        What's your{" "}
        <Text style={{ color: colors.primary }}>content niche?</Text>
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
        This helps us tailor ideas and trending topics specifically for you. You can change it anytime.
      </Text>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search niches..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange("")} activeOpacity={0.7}>
            <IconSymbol name="xmark.circle.fill" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Niche Grid */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.nicheGrid}
      >
        {filteredNiches.map((niche) => {
          const isSelected = selectedNiche === niche;
          return (
            <TouchableOpacity
              key={niche}
              onPress={() => onSelectNiche(niche)}
              activeOpacity={0.75}
              style={[
                styles.nicheChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              {isSelected && (
                <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
              )}
              <Text
                style={[
                  styles.nicheChipText,
                  { color: isSelected ? "#FFFFFF" : colors.foreground },
                ]}
              >
                {niche}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Custom niche input */}
        <View style={[styles.customNicheWrap, { borderColor: colors.border }]}>
          <Text style={[styles.customNicheLabel, { color: colors.muted }]}>
            Don't see yours? Enter a custom niche:
          </Text>
          <View
            style={[
              styles.customNicheInput,
              {
                backgroundColor: colors.surface,
                borderColor: customNiche.trim() ? colors.primary : colors.border,
              },
            ]}
          >
            <IconSymbol name="pencil" size={15} color={colors.muted} />
            <TextInput
              style={[styles.customInput, { color: colors.foreground }]}
              placeholder="e.g. Vintage Cars, Crypto Trading..."
              placeholderTextColor={colors.muted}
              value={customNiche}
              onChangeText={onCustomNicheChange}
              returnKeyType="done"
              autoCorrect={false}
            />
          </View>
        </View>
      </ScrollView>

      {/* Selected indicator */}
      {(selectedNiche || customNiche.trim()) && (
        <View style={[styles.selectedBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
          <Text style={[styles.selectedBannerText, { color: colors.primary }]}>
            Selected: <Text style={{ fontWeight: "700" }}>{customNiche.trim() || selectedNiche}</Text>
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={onFinish}
        disabled={!canFinish || isSaving}
        activeOpacity={0.88}
        style={[
          styles.primaryBtn,
          {
            backgroundColor: canFinish ? colors.primary : colors.border,
            opacity: canFinish ? 1 : 0.6,
          },
        ]}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>Start Creating</Text>
            <IconSymbol name="sparkles" size={18} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDots: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },

  /* Welcome */
  welcomeContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  logoWrap: {
    width: 110,
    height: 110,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  platformRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8,
  },
  platformPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  platformPillText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  /* Features */
  stepTitle: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  featuresList: {
    gap: 12,
    marginTop: 8,
  },
  instructionNote: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  instructionText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 19,
  },

  /* Niche */
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  nicheGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 16,
  },
  nicheChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  nicheChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  customNicheWrap: {
    width: "100%",
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  customNicheLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  customNicheInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  customInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedBannerText: {
    fontSize: 14,
  },

  /* Shared */
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 18,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
