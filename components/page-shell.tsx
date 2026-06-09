import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { type ReactNode } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

type PageShellProps = {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightNode?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  compactHeader?: boolean;
  style?: ViewStyle;
};

export function PageShell({
  title,
  subtitle,
  showBackButton = false,
  rightNode,
  footer,
  children,
  compactHeader = false,
  style,
}: PageShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const showHeader = showBackButton || title || subtitle || rightNode;

  return (
    <>
      <ThemedView style={[styles.container, style]}>
      {showHeader ? (
        <View
          style={[styles.headerRow, compactHeader && styles.headerRowCompact]}
        >
          {showBackButton ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <MaterialIcons name="arrow-back" size={20} color="#333" />
            </TouchableOpacity>
          ) : (
            <View style={styles.spacer} />
          )}

          {showBackButton ? (
            <View style={styles.headerCenter} pointerEvents="none">
              {title ? (
                <ThemedText
                  type="defaultSemiBold"
                  style={styles.headerTitleCenter}
                >
                  {title}
                </ThemedText>
              ) : null}
              {subtitle ? (
                <ThemedText
                  type="default"
                  lightColor="#6b6b6b"
                  style={styles.subtitle}
                >
                  {subtitle}
                </ThemedText>
              ) : null}
            </View>
          ) : (
            <View style={styles.headerTextWrap}>
              {title ? (
                <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
                  {title}
                </ThemedText>
              ) : null}
              {subtitle ? (
                <ThemedText
                  type="default"
                  lightColor="#6b6b6b"
                  style={styles.subtitle}
                >
                  {subtitle}
                </ThemedText>
              ) : null}
            </View>
          )}

          {rightNode ? (
            <View>{rightNode}</View>
          ) : (
            <View style={styles.spacer} />
          )}
        </View>
      ) : null}

      {children}

      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom }]}>{footer}</View> : null}
    </ThemedView>
    
    {/* Black safe area for phone navigation bar */}
    <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerRowCompact: {
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  spacer: { width: 36, height: 36 },
  headerTextWrap: { flex: 1, marginHorizontal: 12 },
  headerTitle: {
    fontSize: 22,
    color: "#1A1C1C",
    textAlign: "left",
    marginLeft: -40,
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerTitleCenter: {
    fontSize: 22,
    color: "#1A1C1C",
    textAlign: "center",
    marginLeft: 0,
  },
  subtitle: { marginTop: 4, textAlign: "left" },
  footer: { marginTop: "auto" },
  bottomSafeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
});
