import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { supplierTheme } from "@/lib/supplier-theme";

type SupplierEmptyStateProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SupplierEmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: SupplierEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon} size={40} color={supplierTheme.textMuted} />
      </View>
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="default" style={styles.message}>
        {message}
      </ThemedText>
      {actionLabel && onAction ? (
        <Pressable style={styles.actionButton} onPress={onAction}>
          <ThemedText type="defaultSemiBold" style={styles.actionText}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 56,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: supplierTheme.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    color: supplierTheme.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: supplierTheme.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  actionButton: {
    marginTop: 24,
    backgroundColor: supplierTheme.primaryDark,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 15,
  },
});
