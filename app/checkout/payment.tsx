import React from "react";
import { StyleSheet, View } from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";

export const options = { headerShown: false };

export default function PaymentScreen() {
  return (
    <PageShell title="Payment" showBackButton>
      <View style={styles.center}>
        <ThemedText type="title">Payment step</ThemedText>
        <ThemedText
          type="default"
          lightColor="#6b6b6b"
          style={{ marginTop: 8 }}
        >
          Placeholder screen — implement payment gateway here.
        </ThemedText>
      </View>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  headerTitle: { fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
