import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  useWindowDimensions,
  Modal,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useStorage } from "@/lib/storage-context";
import { useSavedIdeas } from "@/lib/saved-ideas-context";
import { PLATFORMS, Platform as SocialPlatform, ContentType, CalendarEntry } from "@/lib/types";
import * as Haptics from "expo-haptics";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#00C2CB",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  post: "Post",
  reel: "Reel",
  story: "Story",
  carousel: "Carousel",
  "long-form": "Long-form",
  short: "Short",
  image: "Image",
  video: "Video",
  "talking-head": "Talking Head",
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

// ─── Cross-platform overlay sheet ────────────────────────────────────────────
// Uses Modal on native (works perfectly) and a fixed-position View on web
// (position:absolute fails on web because it's relative to parent, not viewport)

interface OverlaySheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
}

function OverlaySheet({ visible, onClose, children, maxHeight }: OverlaySheetProps) {
  const { height: winH } = useWindowDimensions();
  const sheetMax = maxHeight ?? winH * 0.85;

  if (Platform.OS === "web") {
    // On web: use a fixed-position overlay that covers the full viewport
    if (!visible) return null;
    return (
      <View
        style={[
          overlayStyles.webRoot,
          // @ts-ignore - position fixed is web-only
          { position: "fixed" as any },
        ]}
      >
        <TouchableOpacity style={overlayStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[overlayStyles.sheet, { maxHeight: sheetMax }]}>
          {children}
        </View>
      </View>
    );
  }

  // On native: use Modal which properly renders above everything
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={overlayStyles.nativeRoot}>
        <TouchableOpacity style={overlayStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[overlayStyles.sheet, { maxHeight: sheetMax }]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const overlayStyles = StyleSheet.create({
  webRoot: {
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    justifyContent: "flex-end",
  },
  nativeRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdrop: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "50%" as any,
    overflow: "hidden",
  },
});

// ─── Add Entry Sheet ──────────────────────────────────────────────────────────

interface AddEntrySheetProps {
  visible: boolean;
  selectedDate: string;
  onClose: () => void;
  onAdd: (entry: Omit<CalendarEntry, "id">) => void;
  savedIdeas: { id: string; title: string; platform: SocialPlatform; contentType: ContentType }[];
  colors: ReturnType<typeof useColors>;
  prefillTitle?: string;
  prefillPlatform?: SocialPlatform;
  prefillContentType?: ContentType;
  prefillIdeaId?: string;
}

function AddEntrySheet({ visible, selectedDate, onClose, onAdd, savedIdeas, colors, prefillTitle, prefillPlatform, prefillContentType, prefillIdeaId }: AddEntrySheetProps) {
  const [title, setTitle] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("instagram");
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("post");
  const [notes, setNotes] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [postTime, setPostTime] = useState("09:00");

  // Pre-fill from linked idea when sheet opens
  React.useEffect(() => {
    if (visible) {
      if (prefillTitle) setTitle(prefillTitle);
      if (prefillPlatform) setSelectedPlatform(prefillPlatform);
      if (prefillContentType) setSelectedContentType(prefillContentType);
      if (prefillIdeaId) setSelectedIdeaId(prefillIdeaId);
    }
  }, [visible, prefillTitle, prefillPlatform, prefillContentType, prefillIdeaId]);

  const handleAdd = () => {
    if (!title.trim() && !selectedIdeaId) {
      Alert.alert("Enter a Title", "Please enter a title or select a saved idea.");
      return;
    }
    const linkedIdea = savedIdeas.find((i) => i.id === selectedIdeaId);
    onAdd({
      date: selectedDate,
      ideaId: selectedIdeaId ?? undefined,
      ideaTitle: linkedIdea?.title ?? title.trim(),
      platform: linkedIdea?.platform ?? selectedPlatform,
      contentType: linkedIdea?.contentType ?? selectedContentType,
      notes: notes.trim() || undefined,
      completed: false,
      postTime: postTime || undefined,
    });
    setTitle("");
    setNotes("");
    setSelectedIdeaId(null);
    setPostTime("09:00");
    onClose();
  };

  const CONTENT_TYPES: ContentType[] = ["post", "reel", "story", "carousel", "image", "video", "short", "long-form", "talking-head"];
  const TIME_SLOTS = ["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"];

  function formatTimeLabel(t: string) {
    const [h] = t.split(":").map(Number);
    return h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
  }

  return (
    <OverlaySheet visible={visible} onClose={onClose}>
      <View style={{ backgroundColor: colors.background, flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
        <View style={[sheetStyles.handle, { backgroundColor: colors.border }]} />
        <View style={[sheetStyles.header, { borderBottomColor: colors.border }]}>
          <Text style={[sheetStyles.headerTitle, { color: colors.foreground }]}>
            Plan Content for {formatDisplayDate(selectedDate)}
          </Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <IconSymbol name="xmark.circle.fill" size={24} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Link saved idea */}
          {savedIdeas.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={[sheetStyles.label, { color: colors.foreground }]}>Link a Saved Idea (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                {savedIdeas.slice(0, 10).map((idea) => {
                  const isSelected = selectedIdeaId === idea.id;
                  const pColor = PLATFORM_COLORS[idea.platform];
                  return (
                    <TouchableOpacity
                      key={idea.id}
                      onPress={() => setSelectedIdeaId(isSelected ? null : idea.id)}
                      activeOpacity={0.8}
                      style={[
                        sheetStyles.ideaChip,
                        { backgroundColor: isSelected ? pColor + "15" : colors.surface, borderColor: isSelected ? pColor : colors.border },
                      ]}
                    >
                      <View style={[sheetStyles.ideaDot, { backgroundColor: pColor }]} />
                      <Text style={[sheetStyles.ideaChipText, { color: isSelected ? pColor : colors.foreground }]} numberOfLines={1}>
                        {idea.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Title */}
          {!selectedIdeaId && (
            <View style={{ gap: 8 }}>
              <Text style={[sheetStyles.label, { color: colors.foreground }]}>Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Weekly tips post..."
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                style={[sheetStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
          )}

          {/* Platform */}
          {!selectedIdeaId && (
            <View style={{ gap: 8 }}>
              <Text style={[sheetStyles.label, { color: colors.foreground }]}>Platform</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {PLATFORMS.map((p) => {
                  const isActive = selectedPlatform === p.id;
                  const pColor = PLATFORM_COLORS[p.id];
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setSelectedPlatform(p.id)}
                      activeOpacity={0.8}
                      style={[
                        sheetStyles.chip,
                        { backgroundColor: isActive ? pColor : colors.surface, borderColor: isActive ? pColor : colors.border },
                      ]}
                    >
                      <Text style={[sheetStyles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Content Type */}
          {!selectedIdeaId && (
            <View style={{ gap: 8 }}>
              <Text style={[sheetStyles.label, { color: colors.foreground }]}>Content Type</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {CONTENT_TYPES.map((ct) => {
                  const isActive = selectedContentType === ct;
                  return (
                    <TouchableOpacity
                      key={ct}
                      onPress={() => setSelectedContentType(ct)}
                      activeOpacity={0.8}
                      style={[
                        sheetStyles.chip,
                        { backgroundColor: isActive ? colors.primary : colors.surface, borderColor: isActive ? colors.primary : colors.border },
                      ]}
                    >
                      <Text style={[sheetStyles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>
                        {CONTENT_TYPE_LABELS[ct]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Time of Post */}
          <View style={{ gap: 8 }}>
            <Text style={[sheetStyles.label, { color: colors.foreground }]}>Time of Post</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {TIME_SLOTS.map((t) => {
                const isActive = postTime === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setPostTime(t)}
                    activeOpacity={0.8}
                    style={[sheetStyles.chip, { backgroundColor: isActive ? colors.primary : colors.surface, borderColor: isActive ? colors.primary : colors.border }]}
                  >
                    <Text style={[sheetStyles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>{formatTimeLabel(t)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={{ gap: 8 }}>
            <Text style={[sheetStyles.label, { color: colors.foreground }]}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={2}
              returnKeyType="done"
              style={[sheetStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, minHeight: 60, textAlignVertical: "top" }]}
            />
          </View>

          <TouchableOpacity
            onPress={handleAdd}
            activeOpacity={0.85}
            style={[sheetStyles.addBtn, { backgroundColor: colors.primary }]}
          >
            <IconSymbol name="calendar.badge.plus" size={18} color="#FFFFFF" />
            <Text style={sheetStyles.addBtnText}>Plan Content</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </OverlaySheet>
  );
}

const sheetStyles = StyleSheet.create({
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  label: { fontSize: 13, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1.5 },
  chipText: { fontSize: 12, fontWeight: "600" },
  ideaChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, marginHorizontal: 4, maxWidth: 180 },
  ideaDot: { width: 6, height: 6, borderRadius: 3 },
  ideaChipText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  addBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const colors = useColors();
  const { calendarEntries, addCalendarEntry, updateCalendarEntry, removeCalendarEntry } = useStorage();
  const { savedIdeas } = useSavedIdeas();

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState<string>(toDateStr(today));
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedCalendarEntry, setSelectedCalendarEntry] = useState<CalendarEntry | null>(null);
  const [showEntryDetail, setShowEntryDetail] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Build calendar grid for month view
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(toDateStr(new Date(year, month, d)));
    }
    return days;
  }, [year, month]);

  // Build week view days
  const weekDays = useMemo(() => {
    const sel = selectedDate ? new Date(selectedDate + "T00:00:00") : today;
    const dow = sel.getDay();
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sel);
      d.setDate(sel.getDate() - dow + i);
      days.push(toDateStr(d));
    }
    return days;
  }, [selectedDate]);

  const entriesForDate = useCallback((dateStr: string) => {
    return calendarEntries.filter((e) => e.date === dateStr);
  }, [calendarEntries]);

  const selectedEntries = entriesForDate(selectedDate);

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleAddEntry = useCallback(async (entry: Omit<CalendarEntry, "id">) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addCalendarEntry({ ...entry, id: `cal-${Date.now()}` });
  }, [addCalendarEntry]);

  const handleToggleComplete = useCallback(async (id: string, completed: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateCalendarEntry(id, { completed: !completed });
    // Update the selectedCalendarEntry so the detail sheet reflects the change
    setSelectedCalendarEntry((prev) => prev?.id === id ? { ...prev, completed: !completed } : prev);
  }, [updateCalendarEntry]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Remove Entry", "Remove this scheduled post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: () => {
          removeCalendarEntry(id);
          setShowEntryDetail(false);
          setSelectedCalendarEntry(null);
        },
      },
    ]);
  }, [removeCalendarEntry]);

  const todayStr = toDateStr(today);

  function formatTimeLabel(t: string) {
    const [h] = t.split(":").map(Number);
    return h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.navy }]}>
            <View style={styles.headerRow}>
              <View style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <IconSymbol name="calendar" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Content Planning Calendar</Text>
                <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
                  Your content roadmap, built for planning, not posting.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { setSelectedDate(todayStr); setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); }}
                activeOpacity={0.8}
                style={[styles.todayBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              >
                <Text style={styles.todayBtnText}>Today</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            {/* View Mode Toggle */}
            <View style={[styles.viewToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {(["month", "week"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  activeOpacity={0.8}
                  style={[styles.viewToggleBtn, viewMode === mode && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.viewToggleBtnText, { color: viewMode === mode ? "#FFFFFF" : colors.muted }]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Month Navigation */}
            <View style={[styles.monthNav, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7} style={styles.navBtn}>
                <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.foreground }]}>
                {MONTHS[month]} {year}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7} style={styles.navBtn}>
                <IconSymbol name="chevron.right" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            {viewMode === "month" ? (
              <View style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.dayHeaderRow}>
                  {DAYS_OF_WEEK.map((d) => (
                    <View key={d} style={styles.dayHeaderCell}>
                      <Text style={[styles.dayHeaderText, { color: colors.muted }]}>{d}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.daysGrid}>
                  {calendarDays.map((dateStr, idx) => {
                    if (!dateStr) return <View key={`empty-${idx}`} style={styles.dayCell} />;
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const dayEntries = entriesForDate(dateStr);
                    const hasEntries = dayEntries.length > 0;
                    return (
                      <TouchableOpacity
                        key={dateStr}
                        onPress={() => setSelectedDate(dateStr)}
                        activeOpacity={0.7}
                        style={[
                          styles.dayCell,
                          isSelected && { backgroundColor: colors.primary, borderRadius: 10 },
                          isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10 },
                        ]}
                      >
                        <Text style={[
                          styles.dayNum,
                          { color: isSelected ? "#FFFFFF" : isToday ? colors.primary : colors.foreground },
                        ]}>
                          {dateStr.split("-")[2].replace(/^0/, "")}
                        </Text>
                        {hasEntries && (
                          <View style={styles.dotRow}>
                            {dayEntries.slice(0, 3).map((e, i) => (
                              <View key={i} style={[styles.entryDot, { backgroundColor: isSelected ? "rgba(255,255,255,0.7)" : PLATFORM_COLORS[e.platform] }]} />
                            ))}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.weekRow}>
                  {weekDays.map((dateStr) => {
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const dayEntries = entriesForDate(dateStr);
                    const dayNum = parseInt(dateStr.split("-")[2], 10);
                    const dayOfWeek = new Date(dateStr + "T00:00:00").getDay();
                    return (
                      <TouchableOpacity
                        key={dateStr}
                        onPress={() => setSelectedDate(dateStr)}
                        activeOpacity={0.7}
                        style={[
                          styles.weekDayCell,
                          isSelected && { backgroundColor: colors.primary, borderRadius: 12 },
                          isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 12 },
                        ]}
                      >
                        <Text style={[styles.weekDayName, { color: isSelected ? "rgba(255,255,255,0.7)" : colors.muted }]}>
                          {DAYS_OF_WEEK[dayOfWeek]}
                        </Text>
                        <Text style={[styles.weekDayNum, { color: isSelected ? "#FFFFFF" : isToday ? colors.primary : colors.foreground }]}>
                          {dayNum}
                        </Text>
                        {dayEntries.length > 0 && (
                          <View style={[styles.weekEntryBadge, { backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : colors.primary + "20" }]}>
                            <Text style={[styles.weekEntryBadgeText, { color: isSelected ? "#FFFFFF" : colors.primary }]}>
                              {dayEntries.length}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Selected Date Entries */}
            <View style={[styles.dayDetailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.dayDetailHeader}>
                <Text style={[styles.dayDetailTitle, { color: colors.foreground }]}>
                  {selectedDate === todayStr ? "Today" : formatDisplayDate(selectedDate)}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddSheet(true)}
                  activeOpacity={0.8}
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                >
                  <IconSymbol name="plus" size={16} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>Plan Content</Text>
                </TouchableOpacity>
              </View>

              {selectedEntries.length === 0 ? (
                <View style={styles.emptyDay}>
                  <IconSymbol name="calendar.badge.plus" size={32} color={colors.muted} />
                  <Text style={[styles.emptyDayText, { color: colors.muted }]}>Your calendar is empty. Start planning.</Text>
                  <Text style={[styles.emptyDayHint, { color: colors.muted }]}>Tap "Plan Content" to add a post</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {selectedEntries.map((entry) => {
                    const pColor = PLATFORM_COLORS[entry.platform];
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        onPress={() => { setSelectedCalendarEntry(entry); setShowEntryDetail(true); }}
                        activeOpacity={0.85}
                        style={[styles.entryCard, { backgroundColor: colors.background, borderColor: pColor + "30", borderLeftColor: pColor, borderLeftWidth: 4 }]}
                      >
                        <View style={styles.entryCardTop}>
                          <TouchableOpacity
                            onPress={() => handleToggleComplete(entry.id, entry.completed)}
                            activeOpacity={0.7}
                            style={{ padding: 2 }}
                          >
                            <IconSymbol
                              name={entry.completed ? "checkmark.square.fill" : "square"}
                              size={22}
                              color={entry.completed ? "#10B981" : colors.muted}
                            />
                          </TouchableOpacity>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[styles.entryTitle, { color: entry.completed ? colors.muted : colors.foreground, textDecorationLine: entry.completed ? "line-through" : "none" }]}>
                              {entry.ideaTitle}
                            </Text>
                            <View style={styles.entryMeta}>
                              <View style={[styles.platformBadge, { backgroundColor: pColor + "15" }]}>
                                <Text style={[styles.platformBadgeText, { color: pColor }]}>{entry.platform}</Text>
                              </View>
                              <View style={[styles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
                                <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                                  {CONTENT_TYPE_LABELS[entry.contentType]}
                                </Text>
                              </View>
                            </View>
                            {entry.postTime && (
                              <Text style={[styles.entryNotes, { color: colors.primary }]}>🕐 {formatTimeLabel(entry.postTime)}</Text>
                            )}
                            {entry.notes && (
                              <Text style={[styles.entryNotes, { color: colors.muted }]} numberOfLines={2}>{entry.notes}</Text>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDelete(entry.id)}
                            activeOpacity={0.7}
                            style={{ padding: 4 }}
                          >
                            <IconSymbol name="trash.fill" size={16} color={colors.muted} />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Upcoming Posts Summary */}
            {calendarEntries.filter((e) => e.date >= todayStr && !e.completed).length > 0 && (
              <View style={[styles.upcomingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.upcomingTitle, { color: colors.foreground }]}>Upcoming This Week</Text>
                {calendarEntries
                  .filter((e) => {
                    const sevenDays = new Date(today);
                    sevenDays.setDate(today.getDate() + 7);
                    return e.date >= todayStr && e.date <= toDateStr(sevenDays) && !e.completed;
                  })
                  .slice(0, 5)
                  .map((entry) => {
                    const pColor = PLATFORM_COLORS[entry.platform];
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        onPress={() => setSelectedDate(entry.date)}
                        activeOpacity={0.7}
                        style={[styles.upcomingRow, { borderBottomColor: colors.border }]}
                      >
                        <View style={[styles.upcomingDot, { backgroundColor: pColor }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.upcomingEntryTitle, { color: colors.foreground }]} numberOfLines={1}>
                            {entry.ideaTitle}
                          </Text>
                          <Text style={[styles.upcomingDate, { color: colors.muted }]}>
                            {formatDisplayDate(entry.date)} · {entry.platform}
                          </Text>
                        </View>
                        <IconSymbol name="chevron.right" size={14} color={colors.muted} />
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </ScreenContainer>

      {/* Add Entry Sheet — cross-platform overlay */}
      <AddEntrySheet
        visible={showAddSheet}
        selectedDate={selectedDate}
        onClose={() => setShowAddSheet(false)}
        onAdd={handleAddEntry}
        savedIdeas={savedIdeas.map((i) => ({ id: i.id, title: i.title, platform: i.platform, contentType: i.contentType }))}
        colors={colors}
      />

      {/* Entry Detail Sheet — cross-platform overlay */}
      <OverlaySheet
        visible={showEntryDetail}
        onClose={() => setShowEntryDetail(false)}
        maxHeight={Dimensions.get("window").height * 0.75}
      >
        {selectedCalendarEntry && (() => {
          const pColor = PLATFORM_COLORS[selectedCalendarEntry.platform];
          const timeLabel = selectedCalendarEntry.postTime ? formatTimeLabel(selectedCalendarEntry.postTime) : null;
          return (
            <View style={{ backgroundColor: colors.surface, flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <View style={[sheetStyles.header, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 16, fontWeight: "700", color: colors.foreground, lineHeight: 22 }]} numberOfLines={2}>
                    {selectedCalendarEntry.ideaTitle}
                  </Text>
                  <Text style={[{ fontSize: 13, marginTop: 2, color: colors.muted }]}>
                    {formatDisplayDate(selectedCalendarEntry.date)}{timeLabel ? ` · ${timeLabel}` : ""}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowEntryDetail(false)} activeOpacity={0.7} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 20, color: colors.muted }}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <View style={[styles.platformBadge, { backgroundColor: pColor + "15" }]}>
                    <Text style={[styles.platformBadgeText, { color: pColor }]}>{selectedCalendarEntry.platform}</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{CONTENT_TYPE_LABELS[selectedCalendarEntry.contentType]}</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: selectedCalendarEntry.completed ? "#10B98115" : "#F59E0B15" }]}>
                    <Text style={[styles.typeBadgeText, { color: selectedCalendarEntry.completed ? "#10B981" : "#F59E0B" }]}>
                      {selectedCalendarEntry.completed ? "Completed" : "Planned"}
                    </Text>
                  </View>
                </View>
                {selectedCalendarEntry.notes ? (
                  <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</Text>
                    <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>{selectedCalendarEntry.notes}</Text>
                  </View>
                ) : null}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => { handleToggleComplete(selectedCalendarEntry.id, selectedCalendarEntry.completed); setShowEntryDetail(false); }}
                    activeOpacity={0.85}
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: selectedCalendarEntry.completed ? "#F59E0B" : "#10B981" }}
                  >
                    <IconSymbol name={selectedCalendarEntry.completed ? "arrow.counterclockwise" : "checkmark.circle.fill"} size={18} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                      {selectedCalendarEntry.completed ? "Mark as Planned" : "Mark as Done"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { handleDelete(selectedCalendarEntry.id); }}
                    activeOpacity={0.85}
                    style={{ paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.error + "15", borderWidth: 1, borderColor: colors.error + "30" }}
                  >
                    <IconSymbol name="trash.fill" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          );
        })()}
      </OverlaySheet>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  headerSub: { fontSize: 13, marginTop: 2 },
  todayBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  todayBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  content: { padding: 16, gap: 12 },
  viewToggle: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  viewToggleBtn: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10 },
  viewToggleBtnText: { fontSize: 14, fontWeight: "700" },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 10 },
  navBtn: { padding: 8 },
  monthTitle: { fontSize: 16, fontWeight: "700" },
  calendarCard: { borderRadius: 16, borderWidth: 1, padding: 12 },
  dayHeaderRow: { flexDirection: "row", marginBottom: 4 },
  dayHeaderCell: { flex: 1, alignItems: "center", paddingVertical: 4 },
  dayHeaderText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 2 },
  dayNum: { fontSize: 14, fontWeight: "600" },
  dotRow: { flexDirection: "row", gap: 2, marginTop: 2 },
  entryDot: { width: 4, height: 4, borderRadius: 2 },
  weekRow: { flexDirection: "row", gap: 4 },
  weekDayCell: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 4 },
  weekDayName: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  weekDayNum: { fontSize: 18, fontWeight: "800" },
  weekEntryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  weekEntryBadgeText: { fontSize: 10, fontWeight: "700" },
  dayDetailCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  dayDetailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayDetailTitle: { fontSize: 16, fontWeight: "700" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  emptyDay: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyDayText: { fontSize: 15, fontWeight: "600" },
  emptyDayHint: { fontSize: 13 },
  entryCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  entryCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  entryTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  entryMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  platformBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  platformBadgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  entryNotes: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  upcomingCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  upcomingTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  upcomingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 0.5 },
  upcomingDot: { width: 8, height: 8, borderRadius: 4 },
  upcomingEntryTitle: { fontSize: 13, fontWeight: "600" },
  upcomingDate: { fontSize: 11, marginTop: 2 },
});
