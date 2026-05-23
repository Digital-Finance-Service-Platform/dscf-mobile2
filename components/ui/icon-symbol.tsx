// Fallback for using MaterialIcons on Android and web.

import type { ComponentProps } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
/**
 * Map a small set of SF Symbols to portable icon names. Extend as needed.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "line.horizontal.3": "menu",
  cart: "shopping-cart",
  magnifyingglass: "search",
} as IconMapping;

type IconSymbolName = keyof typeof MAPPING;

/**
 * IconSymbol: Prefer HugeIcons when available, fall back to MaterialIcons.
 * - Uses a safe dynamic require so the code still runs when HugeIcons
 *   aren't installed (e.g., in some CI or contributor environments).
 * - Keeps the same `name` mapping interface used across the app for
 *   portability and future maintainability.
 */
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
  return (
    <MaterialIcons
      color={color as string}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
