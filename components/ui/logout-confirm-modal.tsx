import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Platform,
} from "react-native";

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function LogoutConfirmModal({
  visible,
  title = "Sign out",
  message = "Are you sure you want to sign out of your account?",
  onConfirm,
  onCancel,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }),
      ]).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
      scale.setValue(0.96);
    }
  }, [visible, opacity, scale]);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent={true}
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.backdrop, { opacity }]} />
      <View style={styles.center} pointerEvents={visible ? "auto" : "none"}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonsRow}>
            <Pressable
              style={[styles.btn, styles.cancelBtn]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.dangerBtn]}
              onPress={() => {
                // allow async confirm
                try {
                  console.log("LogoutConfirmModal: Logout button pressed");
                } catch (e) {}
                const res = onConfirm();
                if (res && typeof (res as any).then === "function")
                  (res as any).catch(() => {});
              }}
            >
              <Text style={styles.dangerText}>Logout</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Platform.OS === "ios" ? "#fff" : "#fff",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#800000", marginBottom: 8 },
  message: { fontSize: 14, color: "#374151", marginBottom: 18 },
  buttonsRow: { flexDirection: "row", justifyContent: "flex-end" },
  btn: {
    minWidth: 96,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  cancelBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelText: { color: "#374151", fontWeight: "600" },
  dangerBtn: { backgroundColor: "#800000" },
  dangerText: { color: "#fff", fontWeight: "700" },
});
