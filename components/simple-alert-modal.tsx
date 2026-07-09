import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  okLabel?: string;
  okColor?: string;
  icon?: string;
  iconColor?: string;
  onClose: () => void;
};

export default function SimpleAlertModal({
  visible,
  title,
  message,
  okLabel = "Okay",
  okColor = "#8a1d1d", // Primary brand color
  icon = "info-outline",
  iconColor = "#8a1d1d",
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
              <MaterialIcons name={icon as any} size={28} color={iconColor} />
            </View>
            <ThemedText type="title" style={styles.title}>{title}</ThemedText>
          </View>
          
          {message ? (
            <View style={styles.messageWrap}>
              <ThemedText type="default" lightColor="#444" style={styles.message}>
                {message}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.okBtn, { backgroundColor: okColor }]}
              onPress={onClose}
            >
              <ThemedText type="defaultSemiBold" style={{ color: "#fff", fontSize: 16 }}>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
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
    marginBottom: 16,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    color: "#1a1a1a",
  },
  messageWrap: {
    backgroundColor: "#f7f8fb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  message: {
    textAlign: "center",
    lineHeight: 22,
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
  },
  okBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
