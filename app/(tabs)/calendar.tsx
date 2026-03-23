import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
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

// ─── Add Entry Modal ──────────────────────────────────────────────────────────

interface AddEntryModalProps {
  visible: boolean;
  selectedDate: string;
  onClose: () => void;
  onAdd: (entry: Omit<CalendarEntry, "id">) => void;
  savedIdeas: { id: string; title: string; platform: SocialPlatform; contentType: ContentType }[];
  colors: ReturnType<typeof useColors>;
}

function AddEntryModal({ visible, selectedDate, onClose, onAdd, savedIdeas, colors }: AddEntryModalProps) {
  const [title, setTitle] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("instagram");
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("post");
  const [notes, setNotes] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

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
    });
    setTitle("");
    setNotes("");
    setSelectedIdeaId(null);
    onClose();
  };

  const CONTENT_TYPES: ContentType[] = ["post", "reel", "story", "carousel", "image", "video", "short", "long-form"];

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent hardwareAccelerated>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />
          <View style={[modalStyles.header, { borderBottomColor: colors.border }]}>
            <Text style={[modalStyles.headerTitle, { color: colors.foreground }]}>
              Schedule for {formatDisplayDate(selectedDate)}
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <IconSymbol name="xmark.circle.fill" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Link saved idea */}
            {savedIdeas.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={[modalStyles.label, { color: colors.foreground }]}>Link a Saved Idea (optional)</Text>
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
                          modalStyles.ideaChip,
                          { backgroundColor: isSelected ? pColor + "15" : colors.surface, borderColor: isSelected ? pColor : colors.border },
                        ]}
                      >
                        <View style={[modalStyles.ideaDot, { backgroundColor: pColor }]} />
                        <Text style={[modalStyles.ideaChipText, { color: isSelected ? pColor : colors.foreground }]} numberOfLines={1}>
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
                <Text style={[modalStyles.label, { color: colors.foreground }]}>Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Weekly tips post..."
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  style={[modalStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            )}

            {/* Platform */}
            {!selectedIdeaId && (
              <View style={{ gap: 8 }}>
                <Text style={[modalStyles.label, { color: colors.foreground }]}>Platform</Text>
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
                          modalStyles.chip,
                          { backgroundColor: isActive ? pColor : colors.surface, borderColor: isActive ? pColor : colors.border },
                        ]}
                      >
                        <Text style={[modalStyles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>{p.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Content Type */}
            {!selectedIdeaId && (
              <View style={{ gap: 8 }}>
                <Text style={[modalStyles.label, { color: colors.foreground }]}>Content Type</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {CONTENT_TYPES.map((ct) => {
                    const isActive = selectedContentType === ct;
                    return (
                      <TouchableOpacity
                        key={ct}
                        onPress={() => setSelectedContentType(ct)}
                        activeOpacity={0.8}
                        style={[
                          modalStyles.chip,
                          { backgroundColor: isActive ? colors.primary : colors.surface, borderColor: isActive ? colors.primary : colors.border },
                        ]}
                      >
                        <Text style={[modalStyles.chipText, { color: isActive ? "#FFFFFF" : colors.foreground }]}>
                          {CONTENT_TYPE_LABELS[ct]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Notes */}
            <View style={{ gap: 8 }}>
              <Text style={[modalStyles.label, { color: colors.foreground }]}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional notes..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={2}
                returnKeyType="done"
                style={[modalStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, minHeight: 60, textAlignVertical: "top" }]}
              />
            </View>

            <TouchableOpacity
              onPress={handleAdd}
              activeOpacity={0.85}
              style={[modalStyles.addBtn, { backgroundColor: colors.primary }]}
            >
              <IconSymbol name="calendar.badge.plus" size={18} color="#FFFFFF" />
              <Text style={modalStyles.addBtnText}>Schedule Post</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", minHeight: "60%" },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
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
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleAddEntry = useCallback(async (entry: Omit<CalendarEntry, "id">) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addCalendarEntry({ ...entry, id: `cal-${Date.now()}` });
  }, [addCalendarEntry]);

  const handleToggleComplete = useCallback(async (id: string, completed: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateCalendarEntry(id, { completed: !completed });
  }, [updateCalendarEntry]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Remove Entry", "Remove this scheduled post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: () => removeCalendarEntry(id),
      },
    ]);
  }, [removeCalendarEntry]);

  const todayStr = toDateStr(today);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.navy }]}>
          <View style={styles.headerRow}>
            <View style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <IconSymbol name="calendar" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>Content Calendar</Text>
              <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.6)" }]}>
                Plan and schedule your content
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
              {/* Day headers */}
              <View style={styles.dayHeaderRow}>
                {DAYS_OF_WEEK.map((d) => (
                  <View key={d} style={styles.dayHeaderCell}>
                    <Text style={[styles.dayHeaderText, { color: colors.muted }]}>{d}</Text>
                  </View>
                ))}
              </View>
              {/* Days grid */}
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
            // Week view
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
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
              >
                <IconSymbol name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Schedule</Text>
              </TouchableOpacity>
            </View>

            {selectedEntries.length === 0 ? (
              <View style={styles.emptyDay}>
                <IconSymbol name="calendar.badge.plus" size={32} color={colors.muted} />
                <Text style={[styles.emptyDayText, { color: colors.muted }]}>No posts scheduled</Text>
                <Text style={[styles.emptyDayHint, { color: colors.muted }]}>Tap "Schedule" to add a post</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {selectedEntries.map((entry) => {
                  const pColor = PLATFORM_COLORS[entry.platform];
                  return (
                    <View
                      key={entry.id}
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
                    </View>
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

      <AddEntryModal
        visible={showAddModal}
        selectedDate={selectedDate}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddEntry}
        savedIdeas={savedIdeas.map((i) => ({ id: i.id, title: i.title, platform: i.platform, contentType: i.contentType }))}
        colors={colors}
      />
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
