import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { useNiche } from "@/lib/niche-context";
import { POPULAR_NICHES } from "@/lib/types";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

interface NicheSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function NicheSheet({ visible, onClose }: NicheSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { niche, setNiche } = useNiche();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? POPULAR_NICHES.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    : POPULAR_NICHES;

  const handleSelect = useCallback(
    async (selected: string) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await setNiche(selected);
      setSearch("");
      onClose();
    },
    [setNiche, onClose]
  );

  const handleCustom = useCallback(async () => {
    if (!search.trim()) return;
    await handleSelect(search.trim());
  }, [search, handleSelect]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Backdrop - tap to dismiss */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Select Your Niche
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.muted }]}>
                  Current:{" "}
                  <Text style={{ color: colors.accent, fontWeight: "700" }}>
                    {niche}
                  </Text>
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={[styles.closeBtn, { backgroundColor: colors.surface }]}
              >
                <IconSymbol name="xmark" size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View
              style={[
                styles.searchWrap,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search or enter custom niche..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                returnKeyType="done"
                onSubmitEditing={handleCustom}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
                  <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Custom niche button */}
            {search.trim().length > 0 &&
              !POPULAR_NICHES.some(
                (n) => n.toLowerCase() === search.toLowerCase()
              ) && (
                <TouchableOpacity
                  onPress={handleCustom}
                  activeOpacity={0.75}
                  style={[
                    styles.customNicheBtn,
                    {
                      backgroundColor: colors.primary + "18",
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <IconSymbol name="plus.circle.fill" size={18} color={colors.primary} />
                  <Text style={[styles.customNicheText, { color: colors.primary }]}>
                    Use "{search.trim()}" as my niche
                  </Text>
                </TouchableOpacity>
              )}

            {/* Niche List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item === niche;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                    style={[
                      styles.nicheItem,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + "15"
                          : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.nicheItemText,
                        {
                          color: isSelected ? colors.primary : colors.foreground,
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  keyboardView: {
    width: "100%",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: "82%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  customNicheBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  customNicheText: {
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  nicheItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
  },
  nicheItemText: {
    fontSize: 15,
    flex: 1,
  },
});
