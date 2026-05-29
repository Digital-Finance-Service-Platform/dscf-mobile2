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
  ScrollView,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type MenuItem = {
  key?: string;
  label: string;
  onPress: () => void;
  subtitle?: string;
  icon?: string;
};

export default function MenuModal({
  visible,
  items,
  onClose,
}: {
  visible: boolean;
  items: MenuItem[];
  onClose: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 6,
        }),
      ]).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }).start();
      translateX.setValue(-280);
    }
  }, [visible, opacity, translateX]);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <MaterialIcons name="account-circle" size={56} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Hello</Text>
            <Text style={styles.userEmail}>Welcome to Marketplace</Text>
          </View>
        </View>

        <ScrollView
          style={styles.menuList}
          contentContainerStyle={{ paddingVertical: 8 }}
        >
          {items.map((it, idx) => (
            <Pressable
              key={it.key ?? `${idx}-${it.label}`}
              style={({ pressed }) => [
                styles.item,
                pressed ? styles.itemPressed : null,
              ]}
              onPress={() => {
                try {
                  it.onPress();
                } catch (e) {
                  // ignore
                }
              }}
            >
              <View style={styles.itemLeft}>
                {it.icon ? (
                  <MaterialIcons
                    name={it.icon as any}
                    size={22}
                    color="#800000"
                  />
                ) : null}
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemLabel}>{it.label}</Text>
                {it.subtitle ? (
                  <Text style={styles.itemSubtitle}>{it.subtitle}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 48 : 28,
    paddingHorizontal: 16,
    paddingBottom: 18,
    backgroundColor: "#800000",
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userInfo: { flex: 1 },
  userName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  userEmail: { color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 4 },
  menuList: { backgroundColor: "#fff" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  itemPressed: { backgroundColor: "#f3f4f6" },
  itemLeft: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  itemBody: { flex: 1 },
 
  itemSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  itemLabel: { fontSize: 15, color: "#0a2f4a", fontWeight: "600" },
});
