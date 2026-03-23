import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { NicheSheet } from "@/components/niche-sheet";
import { CONTENT_FRAMEWORKS, ContentFramework, PLATFORMS } from "@/lib/types";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeContext } from "@/lib/theme-provider";
import { useOnboarding } from "@/lib/onboarding-context";
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  scheduleDailyReminder,
  cancelDailyReminder,
  formatNotificationTime,
  type NotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
} from "@/lib/notification-service";

export default function MoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const { niche } = useNiche();
  const { resetOnboarding } = useOnboarding();
  const [nicheSheetVisible, setNicheSheetVisible] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<ContentFramework | null>(null);
  const [activeTab, setActiveTab] = useState<"frameworks" | "settings">("frameworks");
  const colorScheme = useColorScheme();
  const { setColorScheme } = useThemeContext();
  const toggleTheme = () => setColorScheme(colorScheme === "dark" ? "light" : "dark");
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);

  const isDark = colorScheme === "dark";

  // Load notification prefs on mount
  useEffect(() => {
    loadNotificationPrefs().then(setNotifPrefs);
  }, []);

  const handleNotifToggle = async (enabled: boolean) => {
    const newPrefs = { ...notifPrefs, enabled };
    setNotifPrefs(newPrefs);
    await saveNotificationPrefs(newPrefs);
    if (enabled) {
      const success = await scheduleDailyReminder(newPrefs, niche);
      if (!success) {
        Alert.alert("Permission Required", "Please allow notifications in your device settings to enable reminders.");
        setNotifPrefs({ ...newPrefs, enabled: false });
        await saveNotificationPrefs({ ...newPrefs, enabled: false });
      }
    } else {
      await cancelDailyReminder();
    }
  };

  const handleTimeChange = async (direction: "hour" | "minute", delta: number) => {
    const newHour = direction === "hour" ? (notifPrefs.hour + delta + 24) % 24 : notifPrefs.hour;
    const newMinute = direction === "minute" ? (notifPrefs.minute + delta + 60) % 60 : notifPrefs.minute;
    const newPrefs = { ...notifPrefs, hour: newHour, minute: newMinute };
    setNotifPrefs(newPrefs);
    await saveNotificationPrefs(newPrefs);
    if (newPrefs.enabled) await scheduleDailyReminder(newPrefs, niche);
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      "Replay Onboarding",
      "This will take you back to the welcome flow. Your niche and saved ideas will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replay",
          onPress: async () => {
            await resetOnboarding();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.navy }]}>
        <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>More</Text>
        <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
          Frameworks & Settings
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("frameworks")}
          activeOpacity={0.8}
          style={[
            styles.tabBtn,
            activeTab === "frameworks" && { backgroundColor: colors.primary },
          ]}
        >
          <IconSymbol name="text.alignleft" size={16} color={activeTab === "frameworks" ? "#FFFFFF" : colors.muted} />
          <Text style={[styles.tabBtnText, { color: activeTab === "frameworks" ? "#FFFFFF" : colors.muted }]}>
            Frameworks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("settings")}
          activeOpacity={0.8}
          style={[
            styles.tabBtn,
            activeTab === "settings" && { backgroundColor: colors.primary },
          ]}
        >
          <IconSymbol name="gearshape.fill" size={16} color={activeTab === "settings" ? "#FFFFFF" : colors.muted} />
          <Text style={[styles.tabBtnText, { color: activeTab === "settings" ? "#FFFFFF" : colors.muted }]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "frameworks" ? (
          <FrameworksTab
            colors={colors}
            onSelectFramework={setSelectedFramework}
          />
        ) : (
          <SettingsTab
            colors={colors}
            niche={niche}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onChangeNiche={() => setNicheSheetVisible(true)}
            onResetOnboarding={handleResetOnboarding}
            notifPrefs={notifPrefs}
            onNotifToggle={handleNotifToggle}
            onTimeChange={handleTimeChange}
          />
        )}
      </ScrollView>

      <NicheSheet visible={nicheSheetVisible} onClose={() => setNicheSheetVisible(false)} />

      {selectedFramework && (
        <FrameworkDetailModal
          framework={selectedFramework}
          colors={colors}
          onClose={() => setSelectedFramework(null)}
        />
      )}
    </ScreenContainer>
  );
}

function FrameworksTab({
  colors,
  onSelectFramework,
}: {
  colors: any;
  onSelectFramework: (f: ContentFramework) => void;
}) {
  const frameworkColors = [
    colors.primary,
    "#B8860B",
    "#0F2044",
    "#0A66C2",
    "#E1306C",
    "#10B981",
  ];

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <View style={[styles.sectionInfo, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
        <IconSymbol name="info.circle.fill" size={18} color={colors.primary} />
        <Text style={[styles.sectionInfoText, { color: colors.foreground }]}>
          These proven frameworks help structure your content for maximum engagement. Tap any framework to see detailed steps and examples.
        </Text>
      </View>

      {CONTENT_FRAMEWORKS.map((fw, index) => {
        const fwColor = frameworkColors[index % frameworkColors.length];
        return (
          <TouchableOpacity
            key={fw.id}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelectFramework(fw);
            }}
            activeOpacity={0.8}
            style={[
              styles.frameworkCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.frameworkCardLeft}>
              {fw.acronym && (
                <View style={[styles.acronymBadge, { backgroundColor: fwColor }]}>
                  <Text style={styles.acronymText}>{fw.acronym}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.frameworkName, { color: colors.foreground }]}>{fw.name}</Text>
                <Text style={[styles.frameworkDesc, { color: colors.muted }]} numberOfLines={2}>
                  {fw.description}
                </Text>
                <View style={styles.frameworkPlatforms}>
                  {fw.bestFor.slice(0, 3).map((p) => {
                    const platform = PLATFORMS.find((pl) => pl.id === p);
                    return (
                      <View
                        key={p}
                        style={[styles.miniPlatformBadge, { backgroundColor: (platform?.color ?? "#888") + "20" }]}
                      >
                        <Text style={[styles.miniPlatformText, { color: platform?.color ?? "#888" }]}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                      </View>
                    );
                  })}
                  {fw.bestFor.length > 3 && (
                    <Text style={[styles.morePlatforms, { color: colors.muted }]}>+{fw.bestFor.length - 3}</Text>
                  )}
                </View>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SettingsTab({
  colors,
  niche,
  isDark,
  onToggleTheme,
  onChangeNiche,
  onResetOnboarding,
  notifPrefs,
  onNotifToggle,
  onTimeChange,
}: {
  colors: any;
  niche: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onChangeNiche: () => void;
  onResetOnboarding: () => void;
  notifPrefs: NotificationPrefs;
  onNotifToggle: (enabled: boolean) => void;
  onTimeChange: (direction: "hour" | "minute", delta: number) => void;
}) {
  return (
    <View style={{ padding: 20, gap: 20 }}>
      {/* Niche Settings */}
      <View>
        <Text style={[styles.settingGroupTitle, { color: colors.foreground }]}>Content Niche</Text>
        <TouchableOpacity
          onPress={onChangeNiche}
          activeOpacity={0.75}
          style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.settingIcon, { backgroundColor: "#F0C04020" }]}>
            <IconSymbol name="tag.fill" size={18} color="#F0C040" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Current Niche</Text>
            <Text style={[styles.settingValue, { color: colors.primary }]}>{niche}</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onResetOnboarding}
          activeOpacity={0.75}
          style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}
        >
          <View style={[styles.settingIcon, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="arrow.counterclockwise" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Replay Onboarding</Text>
            <Text style={[styles.settingValue, { color: colors.muted }]}>Revisit the welcome flow</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View>
        <Text style={[styles.settingGroupTitle, { color: colors.foreground }]}>Daily Reminders</Text>
        <View style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.settingIcon, { backgroundColor: "#F59E0B20" }]}>
            <IconSymbol name="bell.fill" size={18} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Daily Reminder</Text>
            <Text style={[styles.settingValue, { color: colors.muted }]}>
              {notifPrefs.enabled
                ? `Fires at ${formatNotificationTime(notifPrefs.hour, notifPrefs.minute)}`
                : "Disabled"}
            </Text>
          </View>
          <Switch
            value={notifPrefs.enabled}
            onValueChange={onNotifToggle}
            trackColor={{ false: "#E2E8F0", true: "#F59E0B" }}
            thumbColor="#FFFFFF"
          />
        </View>
        {notifPrefs.enabled && (
          <View style={[styles.timePickerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Reminder Time</Text>
            <View style={styles.timePicker}>
              <TouchableOpacity onPress={() => onTimeChange("hour", -1)} activeOpacity={0.7} style={styles.timeBtn}>
                <IconSymbol name="chevron.left" size={16} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.timeDisplay, { color: colors.foreground }]}>
                {formatNotificationTime(notifPrefs.hour, notifPrefs.minute)}
              </Text>
              <TouchableOpacity onPress={() => onTimeChange("hour", 1)} activeOpacity={0.7} style={styles.timeBtn}>
                <IconSymbol name="chevron.right" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.timePicker}>
              <TouchableOpacity onPress={() => onTimeChange("minute", -15)} activeOpacity={0.7} style={styles.timeBtn}>
                <IconSymbol name="minus" size={14} color={colors.muted} />
              </TouchableOpacity>
              <Text style={[styles.timeMinLabel, { color: colors.muted }]}>±15 min</Text>
              <TouchableOpacity onPress={() => onTimeChange("minute", 15)} activeOpacity={0.7} style={styles.timeBtn}>
                <IconSymbol name="plus" size={14} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Appearance */}
      <View>
        <Text style={[styles.settingGroupTitle, { color: colors.foreground }]}>Appearance</Text>
        <View style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.settingIcon, { backgroundColor: colors.primary + "20" }]}>
            <IconSymbol name={isDark ? "moon.fill" : "sun.max.fill"} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Dark Mode</Text>
            <Text style={[styles.settingValue, { color: colors.muted }]}>{isDark ? "Enabled" : "Disabled"}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={onToggleTheme}
            trackColor={{ false: "#E2E8F0", true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* About */}
      <View>
        <Text style={[styles.settingGroupTitle, { color: colors.foreground }]}>About</Text>
        <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.aboutLogo, { backgroundColor: colors.navy }]}>
            <IconSymbol name="sparkles" size={28} color="#F0C040" />
          </View>
          <Text style={[styles.aboutTitle, { color: colors.foreground }]}>ContentCraft</Text>
          <Text style={[styles.aboutVersion, { color: colors.muted }]}>Version 1.0.0</Text>
          <Text style={[styles.aboutDesc, { color: colors.muted }]}>
            AI-powered social media content creation for Instagram, Facebook, TikTok, YouTube, and LinkedIn.
          </Text>
          <View style={[styles.poweredByRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.poweredByText, { color: colors.muted }]}>Powered by</Text>
            <Text style={[styles.poweredByBrand, { color: colors.accent }]}>Simply Your Marketer, LLC</Text>
          </View>
        </View>
      </View>

      {/* Platform Guide */}
      <View>
        <Text style={[styles.settingGroupTitle, { color: colors.foreground }]}>Platform Guide</Text>
        {PLATFORMS.map((p) => (
          <View
            key={p.id}
            style={[styles.platformGuideRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.platformGuideIcon, { backgroundColor: p.color + "18" }]}>
              <IconSymbol name={p.iconName as any} size={20} color={p.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.platformGuideName, { color: colors.foreground }]}>{p.label}</Text>
              <Text style={[styles.platformGuideDesc, { color: colors.muted }]}>
                {getPlatformDescription(p.id)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function FrameworkDetailModal({
  framework,
  colors,
  onClose,
}: {
  framework: ContentFramework;
  colors: any;
  onClose: () => void;
}) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{framework.name}</Text>
              <Text style={[styles.modalSubtitle, { color: colors.muted }]}>{framework.description}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={[styles.modalClose, { backgroundColor: colors.surface }]}
            >
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Steps */}
          <View style={{ paddingHorizontal: 20, gap: 12, marginBottom: 20 }}>
            <Text style={[styles.stepsTitle, { color: colors.foreground }]}>Framework Steps</Text>
            {framework.steps.map((step, index) => (
              <View
                key={index}
                style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.stepHeader}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.stepLabel, { color: colors.foreground }]}>{step.label}</Text>
                </View>
                <Text style={[styles.stepDesc, { color: colors.muted }]}>{step.description}</Text>
                <View style={[styles.exampleBox, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
                  <Text style={[styles.exampleLabel, { color: colors.primary }]}>EXAMPLE</Text>
                  <Text style={[styles.exampleText, { color: colors.foreground }]}>{step.example}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Best For */}
          <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
            <Text style={[styles.stepsTitle, { color: colors.foreground }]}>Best For</Text>
            <View style={styles.bestForRow}>
              {framework.bestFor.map((p) => {
                const platform = PLATFORMS.find((pl) => pl.id === p);
                return (
                  <View
                    key={p}
                    style={[styles.bestForBadge, { backgroundColor: (platform?.color ?? "#888") + "18", borderColor: (platform?.color ?? "#888") + "40" }]}
                  >
                    <View style={[styles.bestForDot, { backgroundColor: platform?.color ?? "#888" }]} />
                    <Text style={[styles.bestForText, { color: platform?.color ?? "#888" }]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function getPlatformDescription(id: string): string {
  const map: Record<string, string> = {
    instagram: "Visual storytelling, reels, stories & carousel posts",
    facebook: "Community engagement, longer posts & shared content",
    tiktok: "Short-form video, trends & entertainment-first content",
    youtube: "Long-form video, tutorials, SEO-optimized content",
    linkedin: "Professional thought leadership & B2B content",
  };
  return map[id] ?? "";
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
  tabSwitcher: {
    flexDirection: "row",
    margin: 20,
    marginBottom: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  sectionInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  frameworkCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  frameworkCardLeft: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  acronymBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  acronymText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  frameworkName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  frameworkDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  frameworkPlatforms: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  miniPlatformBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniPlatformText: {
    fontSize: 10,
    fontWeight: "700",
  },
  morePlatforms: {
    fontSize: 11,
    alignSelf: "center",
  },
  settingGroupTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
    opacity: 0.6,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  settingValue: {
    fontSize: 13,
    marginTop: 1,
  },
  aboutCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  aboutLogo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  aboutVersion: {
    fontSize: 13,
  },
  aboutDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 4,
  },
  platformGuideRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  platformGuideIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  platformGuideName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  platformGuideDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: "88%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepsTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  stepCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  exampleBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  exampleLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  exampleText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },
  bestForRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  timePickerRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  timeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timeDisplay: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    flex: 1,
    textAlign: "center",
  },
  timeMinLabel: {
    fontSize: 13,
    flex: 1,
    textAlign: "center",
  },
  poweredByRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  poweredByText: {
    fontSize: 12,
  },
  poweredByBrand: {
    fontSize: 12,
    fontWeight: "700",
  },
  bestForBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  bestForDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bestForText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
