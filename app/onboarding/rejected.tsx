import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";

export default function RejectedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;

  const roleTitle = role === "supplier" ? "Supplier" : role === "agent" ? "Agent" : "Retailer";

  return (
    <PageShell
      title={`${roleTitle} Application`}
      subtitle="Application Status"
      style={styles.shell}
    >
      <View style={styles.content}>
        <View style={styles.statusCard}>
          <MaterialIcons name="cancel" size={80} color="#b00020" />
          <ThemedText type="defaultSemiBold" style={styles.statusTitle}>
            Application Rejected
          </ThemedText>
          <ThemedText type="default" style={styles.statusMessage}>
            Unfortunately, your {roleTitle.toLowerCase()} application was not
            approved at this time.
          </ThemedText>
        </View>

        {reason ? (
          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <MaterialIcons name="info-outline" size={22} color="#b00020" />
              <ThemedText type="defaultSemiBold" style={styles.reasonTitle}>
                Reason for Rejection
              </ThemedText>
            </View>
            <ThemedText type="default" style={styles.reasonText}>
              {reason}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.optionsCard}>
          <ThemedText type="defaultSemiBold" style={styles.optionsTitle}>
            What can you do?
          </ThemedText>
          <View style={styles.optionItem}>
            <MaterialIcons name="refresh" size={20} color="#0a2f4a" />
            <ThemedText type="default" style={styles.optionText}>
              Review the requirements and apply again
            </ThemedText>
          </View>
          <View style={styles.optionItem}>
            <MaterialIcons name="contact-support" size={20} color="#0a2f4a" />
            <ThemedText type="default" style={styles.optionText}>
              Contact support if you have questions
            </ThemedText>
          </View>
        </View>

        <Pressable
          style={styles.continueButton}
          onPress={() => router.replace("/onboarding/role")}
        >
          <ThemedText type="defaultSemiBold" style={styles.continueText}>
            Start New Application
          </ThemedText>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/login")}
        >
          <ThemedText type="default" style={styles.backText}>
            Back to Login
          </ThemedText>
        </Pressable>
      </View>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  content: { flex: 1 },
  statusCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 16,
    backgroundColor: "#ffebee",
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 22,
    color: "#b00020",
    marginTop: 16,
    textAlign: "center",
  },
  statusMessage: {
    fontSize: 15,
    color: "#55656d",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 22,
  },
  reasonCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(176, 0, 32, 0.2)",
    marginBottom: 24,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reasonTitle: {
    fontSize: 16,
    color: "#b00020",
    marginLeft: 8,
  },
  reasonText: {
    fontSize: 14,
    color: "#55656d",
    lineHeight: 20,
  },
  optionsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.12)",
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 16,
    color: "#0a2f4a",
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  optionText: {
    marginLeft: 12,
    color: "#55656d",
    flex: 1,
  },
  continueButton: {
    backgroundColor: "#0a2f4a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  continueText: {
    color: "#fff",
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  backText: {
    color: "#0a7ea4",
    fontSize: 16,
  },
});
