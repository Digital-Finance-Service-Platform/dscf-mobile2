import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";

type RoleKey = "retailer" | "supplier" | "agent";

type RoleCard = {
  key: RoleKey;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

const ROLE_CARDS: RoleCard[] = [
  {
    key: "retailer",
    title: "Retailer",
    description: "Browse products, request quotations, and place orders.",
    icon: "storefront",
  },
  {
    key: "supplier",
    title: "Supplier",
    description: "List products and fulfill orders from retailers.",
    icon: "inventory-2",
  },
  {
    key: "agent",
    title: "Agent",
    description: "Assist retailers with orders and track commissions.",
    icon: "support-agent",
  },
];

export default function OnboardingRoleScreen() {
  const router = useRouter();

  const handleSelect = (role: RoleKey) => {
    if (role === "retailer") {
      router.push("/onboarding/retailor");
      return;
    }

    if (role === "supplier") {
      router.push("/onboarding/supplier" as any);
      return;
    }

    if (role === "agent") {
      router.push("/onboarding/agent");
      return;
    }
  };

  return (
    <PageShell
      title="Get started"
      subtitle="Choose how you will use KeGebeya"
      style={styles.shell}
    >
      <View style={styles.list}>
        {ROLE_CARDS.map((role) => (
          <Pressable
            key={role.key}
            style={styles.card}
            onPress={() => handleSelect(role.key)}
          >
            <View style={styles.iconWrap}>
              <MaterialIcons name={role.icon} size={22} color="#0a2f4a" />
            </View>
            <View style={styles.cardText}>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                {role.title}
              </ThemedText>
              <ThemedText type="default" style={styles.cardSubtitle}>
                {role.description}
              </ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#8a1d1d" />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.signInRow} onPress={() => router.push("/login")}>
        <ThemedText type="default" style={styles.signInText}>
          Already have an account? Sign in
        </ThemedText>
      </Pressable>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  list: { gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.12)",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 47, 74, 0.08)",
    marginRight: 12,
  },
  cardText: { flex: 1 },
  cardTitle: { color: "#0a2f4a", fontSize: 18 },
  cardSubtitle: { color: "#55656d" },
  signInRow: { marginTop: 18, alignItems: "center" },
  signInText: { color: "#0a7ea4" },
});
