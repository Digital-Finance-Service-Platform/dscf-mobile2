import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  okLabel?: string;
  okColor?: string;
  onClose: () => void;
};

export default function SimpleAlertModal({
  visible,
  title,
  message,
  okLabel = "OK",
  okColor = "#0b67c2",
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ThemedText type="title">{title}</ThemedText>
          {message ? (
            <ThemedText type="default" lightColor="#6b6b6b" style={styles.message}>
              {message}
            </ThemedText>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.okBtn, { backgroundColor: okColor }]}
              onPress={onClose}
            >
              <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                {okLabel}
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
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  message: { marginTop: 12 },
  actions: { marginTop: 20, alignItems: "flex-end" },
  okBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
});
