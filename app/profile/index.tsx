import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { useSdk } from "@/lib/sdk/context";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, fetchUser, logout } = useSdk();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(true);
      fetchUser().finally(() => setLoading(false));
    }
  }, [user, fetchUser]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <PageShell title="Profile" showBackButton style={styles.shell}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a2f4a" />
        </View>
      </PageShell>
    );
  }

  const profile = user?.user_profile ?? {};
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  const primaryRole = roles[0]?.name ?? roles[0]?.code ?? "User";
  const roleCode = roles[0]?.code?.toUpperCase() ?? "";

  return (
    <PageShell title="Profile" showBackButton style={styles.shell}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={40} color="#fff" />
          </View>
          <ThemedText type="defaultSemiBold" style={styles.userName}>
            {profile.first_name ? `${profile.first_name} ${profile.last_name ?? ""}`.trim() : user?.email ?? user?.phone ?? "User"}
          </ThemedText>
          <ThemedText type="default" style={styles.userEmail}>
            {user?.email ?? user?.phone ?? "No contact info"}
          </ThemedText>
          <View style={styles.roleBadge}>
            <ThemedText type="defaultSemiBold" style={styles.roleText}>
              {primaryRole}
            </ThemedText>
          </View>
          {roles.length > 1 && (
            <View style={styles.rolesRow}>
              {roles.slice(1).map((r: any, i: number) => (
                <View key={i} style={[styles.roleBadge, { marginLeft: 6 }]}>
                  <ThemedText type="default" style={styles.roleSmallText}>
                    {r.name ?? r.code}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Contact Information
          </ThemedText>
          <InfoRow
            icon="phone"
            label="Phone"
            value={user?.phone ?? "Not provided"}
          />
          <InfoRow
            icon="mail"
            label="Email"
            value={user?.email ?? "Not provided"}
          />

        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <ActionItem
            icon="store"
            label="My Business"
            onPress={() => router.push("/profile/business" as any)}
          />
          {(primaryRole.toLowerCase() === "supplier" || roleCode === "USER") && (
            <>
              <ActionItem
                icon="inventory"
                label="My Products"
                onPress={() => router.push("/supplier/products" as any)}
              />
              <ActionItem
                icon="list-alt"
                label="My Listings"
                onPress={() => router.push("/supplier/listings" as any)}
              />
              <ActionItem
                icon="add-shopping-cart"
                label="Request Product"
                onPress={() => router.push("/supplier/request-product" as any)}
              />
            </>
          )}
          {(primaryRole.toLowerCase() === "agent" || roleCode === "USER") && (
            <ActionItem
              icon="people"
              label="My Retailers"
              onPress={() => router.push("/agent/retailers" as any)}
            />
          )}
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#b00020" />
          <ThemedText type="defaultSemiBold" style={styles.logoutText}>
            Sign Out
          </ThemedText>
        </Pressable>
      </ScrollView>
    </PageShell>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={18} color="#6b6b6b" />
      <ThemedText type="default" style={styles.infoLabel}>
        {label}
      </ThemedText>
      <ThemedText type="default" style={styles.infoValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function ActionItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionItem} onPress={onPress}>
      <MaterialIcons name={icon} size={20} color="#0a2f4a" />
      <ThemedText type="default" style={styles.actionLabel}>
        {label}
      </ThemedText>
      <MaterialIcons name="chevron-right" size={20} color="#6b6b6b" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  content: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  userCard: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0a2f4a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  userName: { fontSize: 20, color: "#0a2f4a", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "#6b6b6b", marginBottom: 8 },
  roleBadge: {
    backgroundColor: "rgba(10, 47, 74, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { color: "#0a2f4a", fontSize: 12 },
  rolesRow: { flexDirection: "row", marginTop: 6 },
  roleSmallText: { color: "#0a2f4a", fontSize: 10 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#0a2f4a",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 47, 74, 0.08)",
  },
  infoLabel: { marginLeft: 10, color: "#6b6b6b", flex: 1 },
  infoValue: { color: "#0a2f4a", fontWeight: "500" },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 47, 74, 0.08)",
  },
  actionLabel: { marginLeft: 10, color: "#0a2f4a", flex: 1, fontSize: 15 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#b00020",
  },
  logoutText: { marginLeft: 8, color: "#b00020", fontSize: 16 },
});
