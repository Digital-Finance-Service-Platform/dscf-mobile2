import { ThemedText } from "@/components/themed-text";
import { formatCurrency } from "@/lib/formatters";
import React from "react";
import { Image as RNImage, StyleSheet, View } from "react-native";

interface OrderItemProps {
  id: string;
  title: string;
  price: number;
  quantity?: number;
  image?: any;
  showQuantity?: boolean;
}

export function OrderItem({
  id,
  title,
  price,
  quantity = 1,
  image,
  showQuantity = true,
}: OrderItemProps) {
  return (
    <View style={styles.itemRow}>
      <RNImage
        source={image ?? require("@/assets/images/logo1.png")}
        style={styles.thumb}
      />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        {showQuantity && (
          <ThemedText type="default" lightColor="#6b6b6b">
            Quantity: {quantity}
          </ThemedText>
        )}
      </View>
      <ThemedText type="defaultSemiBold" lightColor="#8a1d1d">
        {formatCurrency(price * quantity)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#f6f6f6",
  },
});
