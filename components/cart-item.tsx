import React from "react";
import { StyleSheet, View, TouchableOpacity, Image as RNImage } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/themed-text";
import { QuantityControls } from "./quantity-controls";

interface CartItemProps {
  id: string;
  title: string;
  subtitle?: string;
  price: number;
  quantity: number;
  image?: any;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  showQuantityControls?: boolean;
  showRemoveButton?: boolean;
}

export function CartItem({
  id,
  title,
  subtitle,
  price,
  quantity,
  image,
  onUpdateQuantity,
  onRemove,
  showQuantityControls = true,
  showRemoveButton = true,
}: CartItemProps) {
  return (
    <View style={styles.itemCard}>
      <RNImage
        source={image ?? require("@/assets/images/icon.png")}
        style={styles.thumb}
      />

      <View style={styles.itemBody}>
        <ThemedText type="subtitle" style={{ fontSize: 16 }}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText type="default2">{subtitle}</ThemedText>
        )}

        <View style={styles.itemFooter}>
          {showQuantityControls && (
            <QuantityControls
              quantity={quantity}
              onIncrease={() => onUpdateQuantity(id, quantity + 1)}
              onDecrease={() => onUpdateQuantity(id, quantity - 1)}
            />
          )}

          <View style={styles.priceWrap}>
            <ThemedText
              type="defaultSemiBold"
              lightColor="#8a1d1d"
              style={styles.priceText}
            >
              ${(price * quantity).toFixed(2)}
            </ThemedText>
          </View>
        </View>
      </View>

      {showRemoveButton && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(id)}
          accessibilityLabel="Remove item"
        >
          <MaterialIcons
            name="delete-outline"
            size={16}
            color="#5A413D"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: {
    width: 72,
    height: 72,
    resizeMode: "contain",
    borderRadius: 12,
    backgroundColor: "#f6f6f6",
  },
  itemBody: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "space-between",
  },
  itemFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  priceWrap: {
    marginRight: 8,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  priceText: { fontSize: 20 },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(138,29,29,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginLeft: 10,
    marginTop: -70,
  },
});