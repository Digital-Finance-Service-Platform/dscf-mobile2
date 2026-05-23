import React from "react";
import { StyleSheet, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/themed-text";

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  compact?: boolean;
}

export function StatusBadge({ status, showIcon = true, compact = false }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "DELIVERED":
        return {
          backgroundColor: "#e9f7ec",
          textColor: "#1f7a39",
          icon: "check",
          iconColor: "#28a745",
        };
      case "SHIPPED":
        return {
          backgroundColor: "#eaf5ff",
          textColor: "#0b67c2",
          icon: "local-shipping",
          iconColor: "#0b67c2",
        };
      case "PROCESSING":
        return {
          backgroundColor: "#fff4ea",
          textColor: "#ff7a00",
          icon: "autorenew",
          iconColor: "#ff7a00",
        };
      default:
        return {
          backgroundColor: "#f0f0f0",
          textColor: "#666",
          icon: null,
          iconColor: "#666",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.backgroundColor }, compact && styles.compact]}>
      {showIcon && config.icon && (
        <View style={styles.statusIconWrap}>
          <MaterialIcons name={config.icon as any} size={12} color={config.iconColor} />
        </View>
      )}
      <ThemedText
        type="default"
        style={[styles.statusText, { color: config.textColor }, compact && styles.compactText]}
      >
        {status}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 80,
    justifyContent: "center",
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
  },
  statusIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  statusText: { fontWeight: "700", fontSize: 12 },
  compactText: { fontSize: 11 },
});