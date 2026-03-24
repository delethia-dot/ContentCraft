import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "lightbulb.fill": "lightbulb",
  "link": "link",
  "chart.bar.fill": "trending-up",
  "ellipsis": "more-horiz",
  // General
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "keyboard-arrow-down",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "plus": "add",
  "minus": "remove",
  "plus.circle.fill": "add-circle",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "square.and.arrow.up": "share",
  "doc.on.doc": "content-copy",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "star.fill": "star",
  "star": "star-border",
  "magnifyingglass": "search",
  "arrow.clockwise": "refresh",
  "gearshape.fill": "settings",
  "person.fill": "person",
  "bell.fill": "notifications",
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",
  "trash.fill": "delete",
  "pencil": "edit",
  "sparkles": "auto-awesome",
  "wand.and.stars": "auto-fix-high",
  "flame.fill": "local-fire-department",
  "binoculars.fill": "manage-search",
  "number": "tag",
  "bolt.fill": "bolt",
  "globe": "language",
  "calendar": "calendar-today",
  "clock.fill": "schedule",
  "info.circle.fill": "info",
  "exclamationmark.circle.fill": "error",
  "arrow.up.right": "open-in-new",
  "list.bullet": "list",
  "square.grid.2x2.fill": "grid-view",
  "tag.fill": "label",
  "chart.line.uptrend.xyaxis": "show-chart",
  "text.alignleft": "format-align-left",
  "doc.text.fill": "article",
  "play.fill": "play-arrow",
  "camera.fill": "camera-alt",
  "photo.fill": "photo",
  "video.fill": "videocam",
  "mic.fill": "mic",
  "hand.thumbsup.fill": "thumb-up",
  "hand.thumbsdown.fill": "thumb-down",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  "arrow.counterclockwise": "history",
  "clock.arrow.circlepath": "history",
  "briefcase.fill": "work",
  "heart.fill": "favorite",
  "paintbrush.fill": "brush",
  "desktopcomputer": "computer",
  "book.fill": "menu-book",
  "leaf.fill": "eco",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "lock.fill": "lock",
  "questionmark.circle.fill": "help",
  "text.bubble.fill": "chat-bubble",
  "captions.bubble.fill": "subtitles",
  "calendar.badge.plus": "event",
  "calendar.badge.clock": "event-note",
  "checkmark.square.fill": "check-box",
  "square": "check-box-outline-blank",
  "note.text": "note",
  "text.cursor": "text-fields",
  "rectangle.and.pencil.and.ellipsis": "rate-review",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
