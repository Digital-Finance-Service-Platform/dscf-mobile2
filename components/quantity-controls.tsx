import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/themed-text";

interface QuantityControlsProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  minQuantity?: number;
  maxQuantity?: number;
  disabled?: boolean;
}

export function QuantityControls({
  quantity,
  onIncrease,
  onDecrease,
  minQuantity = 1,
  maxQuantity,
  disabled = false,
}: QuantityControlsProps) {
  const canDecrease = quantity > minQuantity && !disabled;
  const canIncrease = !maxQuantity || quantity < maxQuantity;

  return (
    <View style={styles.qtyControls}>
      <TouchableOpacity
        style={[styles.qtyBtn, !canDecrease && styles.qtyBtnDisabled]}
        onPress={canDecrease ? onDecrease : undefined}
        accessibilityLabel="Decrease quantity"
        disabled={!canDecrease}
      >
        <MaterialIcons
          name="remove"
          size={16}
          color={canDecrease ? "#5A413D" : "#ccc"}
        />
      </TouchableOpacity>

      <View style={styles.qtyValue}>
        <ThemedText type="defaultSemiBold">{quantity}</ThemedText>
      </View>

      <TouchableOpacity
        style={[styles.qtyBtn, !canIncrease && styles.qtyBtnDisabled]}
        onPress={canIncrease ? onIncrease : undefined}
        accessibilityLabel="Increase quantity"
        disabled={!canIncrease}
      >
        <MaterialIcons
          name="add"
          size={16}
          color={canIncrease ? "#5A413D" : "#ccc"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  qtyControls: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 6,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#8a1d1d1f",
  },
  qtyBtnDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  qtyValue: { minWidth: 28, alignItems: "center", justifyContent: "center" },
});