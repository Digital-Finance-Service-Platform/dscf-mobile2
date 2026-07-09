import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { supplierTheme } from "@/lib/supplier-theme";

type SupplierNavCardProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string | number;
};

export function SupplierNavCard({
  icon,
  title,
  subtitle,
  onPress,
  badge,
}: SupplierNavCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon} size={28} color={supplierTheme.primary} />
      </View>
      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {title}
          </ThemedText>
          {badge != null && badge !== 0 ? (
            <View style={styles.badge}>
              <ThemedText type="defaultSemiBold" style={styles.badgeText}>
                {badge}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText type="default" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={supplierTheme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: supplierTheme.card,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: supplierTheme.border,
    ...supplierTheme.cardShadow,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: supplierTheme.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    color: supplierTheme.primary,
  },
  subtitle: {
    fontSize: 14,
    color: supplierTheme.textMuted,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: supplierTheme.accent,
    borderRadius: 999,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
  },
});
