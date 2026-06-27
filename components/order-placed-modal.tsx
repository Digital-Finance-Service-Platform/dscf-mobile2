import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/themed-text";
import { formatCurrency } from "@/lib/formatters";

type Props = {
  visible: boolean;
  order: any | null;
  onClose: () => void;
  onViewOrder: (id: string) => void;
};

export default function OrderPlacedModal({ visible, order, onClose, onViewOrder }: Props) {
  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <MaterialIcons name="check-circle" size={56} color="#28a745" />

          <ThemedText type="title" style={styles.title}>
            Order placed
          </ThemedText>

          <ThemedText type="default" style={styles.message}>
            {String(order.id).includes(",") ? `Orders ${order.id} created successfully.` : `Order ${order.id} created successfully.`}
          </ThemedText>

          <View style={styles.metaRow}>
            <ThemedText type="default" lightColor="#6b6b6b">
              Total
            </ThemedText>
            <ThemedText type="defaultSemiBold">{formatCurrency(order.total_amount ?? order.total)}</ThemedText>
          </View>

          <View style={styles.metaRow}>
            <ThemedText type="default" lightColor="#6b6b6b">
              Expected
            </ThemedText>
            <ThemedText type="defaultSemiBold">{order.expected_delivery ?? new Date(order.created_at || order.date || Date.now()).toLocaleDateString()}</ThemedText>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={onClose}>
              <ThemedText type="default">Continue Shopping</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.primary]} onPress={() => onViewOrder(order.id)}>
              <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                View Order
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  title: { marginTop: 12, marginBottom: 8 },
  message: { marginBottom: 12, textAlign: "center" },
  metaRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 8,
  },
  buttons: { flexDirection: "row", marginTop: 18, width: "100%", justifyContent: "flex-end" },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginLeft: 8 },
  primary: { backgroundColor: "#8a1d1d" },
  secondary: { backgroundColor: "#f1f1f1" },
});
