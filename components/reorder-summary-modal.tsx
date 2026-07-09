import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type Props = {
  visible: boolean;
  added: number;
  skipped: number;
  adjusted: number;
  onClose: () => void;
  onViewCart?: () => void;
};

export default function ReorderSummaryModal({
  visible,
  added,
  skipped,
  adjusted,
  onClose,
  onViewCart,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <MaterialIcons name="shopping-cart-checkout" size={24} color="#8a1d1d" />
            </View>
            <ThemedText type="title" style={styles.title}>
              Reorder Summary
            </ThemedText>
          </View>

          <View style={styles.list}>
            {added > 0 && (
              <View style={styles.row}>
                <View style={[styles.bulletIcon, { backgroundColor: "#e9f7ec" }]}>
                  <MaterialIcons name="check" size={16} color="#1f7a39" />
                </View>
                <ThemedText type="defaultSemiBold" style={styles.rowText}>
                  {added} item{added > 1 ? "s" : ""} added to cart
                </ThemedText>
              </View>
            )}

            {skipped > 0 && (
              <View style={styles.row}>
                <View style={[styles.bulletIcon, { backgroundColor: "#ffeaea" }]}>
                  <MaterialIcons name="error-outline" size={16} color="#d93025" />
                </View>
                <ThemedText type="defaultSemiBold" style={styles.rowText}>
                  {skipped} item{skipped > 1 ? "s" : ""} unavailable
                </ThemedText>
              </View>
            )}

            {adjusted > 0 && (
              <View style={styles.row}>
                <View style={[styles.bulletIcon, { backgroundColor: "#fff4ea" }]}>
                  <MaterialIcons name="info-outline" size={16} color="#ff7a00" />
                </View>
                <ThemedText type="defaultSemiBold" style={styles.rowText}>
                  {adjusted} price change{adjusted > 1 ? "s" : ""}
                </ThemedText>
              </View>
            )}
            
            {added === 0 && skipped === 0 && adjusted === 0 && (
               <View style={styles.row}>
                 <View style={[styles.bulletIcon, { backgroundColor: "#f4f4f5" }]}>
                   <MaterialIcons name="info-outline" size={16} color="#6b6b6b" />
                 </View>
                 <ThemedText type="defaultSemiBold" style={styles.rowText}>
                   No items could be reordered.
                 </ThemedText>
               </View>
            )}
          </View>

          <View style={styles.actions}>
            {onViewCart && added > 0 ? (
              <>
                <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onClose}>
                  <ThemedText type="defaultSemiBold" style={{ color: "#333" }}>
                    Close
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onViewCart}>
                  <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                    View Cart
                  </ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[styles.btn, styles.btnPrimary, { flex: 1 }]} onPress={onClose}>
                <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                  Okay
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fce97f", // Using the precise background color mentioned in user preferences
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    textAlign: "center",
  },
  list: {
    backgroundColor: "#f7f8fb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  bulletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutline: {
    backgroundColor: "#f4f4f5",
  },
  btnPrimary: {
    backgroundColor: "#8a1d1d",
  },
});
