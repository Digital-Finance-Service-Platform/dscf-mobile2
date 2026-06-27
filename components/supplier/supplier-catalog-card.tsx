import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { supplierTheme } from "@/lib/supplier-theme";

type SupplierCatalogCardProps = {
  name: string;
  sku?: string;
  meta?: string;
  onPress: () => void;
};

export function SupplierCatalogCard({
  name,
  sku,
  meta,
  onPress,
}: SupplierCatalogCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons name="inventory-2" size={24} color={supplierTheme.primary} />
      </View>
      <View style={styles.info}>
        <ThemedText type="defaultSemiBold" style={styles.name} numberOfLines={2}>
          {name}
        </ThemedText>
        {sku ? (
          <ThemedText type="default" style={styles.sku}>
            SKU: {sku}
          </ThemedText>
        ) : null}
        {meta ? (
          <ThemedText type="default" style={styles.meta} numberOfLines={1}>
            {meta}
          </ThemedText>
        ) : null}
      </View>
      <MaterialIcons name="chevron-right" size={22} color={supplierTheme.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: supplierTheme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: supplierTheme.border,
    ...supplierTheme.cardShadow,
  },
  cardPressed: {
    opacity: 0.94,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: supplierTheme.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  info: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    color: supplierTheme.primary,
    fontSize: 16,
  },
  sku: {
    color: supplierTheme.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  meta: {
    color: supplierTheme.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
});
