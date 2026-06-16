import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { marketGetMyRetailers } from "@/lib/api/clients";
import { useSdk } from "@/lib/sdk/context";

export default function AgentRetailersScreen() {
  const { user } = useSdk();
  const [retailers, setRetailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRetailers();
  }, [user]);

  const fetchRetailers = async () => {
    try {
      // Get agent ID from user profile
      const agentId = user?.id;
      const res = await marketGetMyRetailers(agentId);
      const data = Array.isArray(res?.data) ? res.data : res || [];
      setRetailers(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load retailers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRetailers();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#2e7d32";
      case "inactive":
        return "#f57c00";
      case "suspended":
        return "#b00020";
      default:
        return "#6b6b6b";
    }
  };

  const renderRetailer = ({ item }: { item: any }) => {
    return (
      <View style={styles.retailerCard}>
        <View style={styles.retailerHeader}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="store" size={24} color="#fff" />
          </View>
          <View style={styles.retailerInfo}>
            <ThemedText type="defaultSemiBold" style={styles.retailerName}>
              {item?.name ?? "Unknown Store"}
            </ThemedText>
            <ThemedText type="default" style={styles.retailerPhone}>
              {item?.phone ?? "No phone"}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item?.status ?? "inactive")}20` },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.statusText, { color: getStatusColor(item?.status ?? "inactive") }]}
            >
              {item?.status ?? "inactive"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailsRow}>
          {item?.tin_number && (
            <View style={styles.detailItem}>
              <MaterialIcons name="badge" size={14} color="#6b6b6b" />
              <ThemedText type="default" style={styles.detailText}>
                TIN: {item.tin_number}
              </ThemedText>
            </View>
          )}
          {item?.location && (
            <View style={styles.detailItem}>
              <MaterialIcons name="location-on" size={14} color="#6b6b6b" />
              <ThemedText type="default" style={styles.detailText}>
                {item.location}
              </ThemedText>
            </View>
          )}
          {item?.created_at && (
            <View style={styles.detailItem}>
              <MaterialIcons name="calendar-today" size={14} color="#6b6b6b" />
              <ThemedText type="default" style={styles.detailText}>
                Since {new Date(item.created_at).toLocaleDateString()}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <PageShell title="My Retailers" showBackButton style={styles.shell}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a2f4a" />
          <ThemedText type="default" style={{ marginTop: 12, color: "#6b6b6b" }}>
            Loading retailers...
          </ThemedText>
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell title="My Retailers" showBackButton style={styles.shell}>
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#b00020" />
          <ThemedText type="default" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable onPress={fetchRetailers} style={styles.retryButton}>
            <ThemedText type="defaultSemiBold" style={styles.retryText}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={retailers}
          keyExtractor={(item) => String(item?.id)}
          renderItem={renderRetailer}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <ThemedText type="default" style={styles.headerCount}>
              {retailers.length} retailer(s) onboarded
            </ThemedText>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people" size={48} color="#6b6b6b" />
              <ThemedText type="default" style={styles.emptyText}>
                No retailers yet. Start onboarding retailers to see them here.
              </ThemedText>
            </View>
          }
        />
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  list: { padding: 16 },
  headerCount: {
    color: "#6b6b6b",
    fontSize: 14,
    marginBottom: 12,
  },
  retailerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  retailerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0a2f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  retailerInfo: { flex: 1, marginLeft: 12 },
  retailerName: { color: "#0a2f4a", fontSize: 15 },
  retailerPhone: { color: "#6b6b6b", fontSize: 13, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, textTransform: "capitalize" },
  detailsRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(10, 47, 74, 0.08)",
    gap: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: { color: "#6b6b6b", fontSize: 12, marginLeft: 6 },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: { color: "#b00020", textAlign: "center", marginTop: 12 },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#0a2f4a",
    borderRadius: 8,
  },
  retryText: { color: "#fff" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { color: "#6b6b6b", textAlign: "center", marginTop: 12 },
});
