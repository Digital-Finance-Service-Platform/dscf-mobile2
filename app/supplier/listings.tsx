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
import {
    marketActivateListing,
    marketGetMyListings,
    marketPauseListing,
} from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";

export default function SupplierListingsScreen() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await marketGetMyListings();
      const data = Array.isArray(res?.data) ? res.data : res || [];
      setListings(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load listings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const handleToggleStatus = async (listing: any) => {
    setActionLoading(listing.id);
    try {
      if (listing.status === "active") {
        await marketPauseListing(listing.id);
      } else {
        await marketActivateListing(listing.id);
      }
      fetchListings();
    } catch (err: any) {
      setError(err?.message || "Failed to update listing");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#2e7d32";
      case "draft":
        return "#6b6b6b";
      case "paused":
        return "#f57c00";
      case "sold_out":
        return "#b00020";
      default:
        return "#6b6b6b";
    }
  };

  const renderListing = ({ item }: { item: any }) => {
    const product = item?.supplier_product?.product ?? item?.product ?? {};
    return (
      <View style={styles.listingCard}>
        <View style={styles.listingHeader}>
          <ThemedText type="defaultSemiBold" style={styles.productName}>
            {product?.name ?? "Unknown Product"}
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item?.status ?? "draft")}20` },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.statusText, { color: getStatusColor(item?.status ?? "draft") }]}
            >
              {item?.status ?? "draft"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <ThemedText type="default" style={styles.detailLabel}>
              Price
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.detailValue}>
              {item?.price ? formatCurrency(item.price) : "N/A"}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText type="default" style={styles.detailLabel}>
              Quantity
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.detailValue}>
              {item?.quantity ?? 0}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText type="default" style={styles.detailLabel}>
              MOQ
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.detailValue}>
              {item?.minimum_order_quantity ?? 0}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[
              styles.actionButton,
              actionLoading === item.id && styles.buttonDisabled,
            ]}
            onPress={() => handleToggleStatus(item)}
            disabled={actionLoading === item.id}
          >
            {actionLoading === item.id ? (
              <ActivityIndicator size="small" color="#0a2f4a" />
            ) : (
              <>
                <MaterialIcons
                  name={item?.status === "active" ? "pause" : "play-arrow"}
                  size={16}
                  color="#0a2f4a"
                />
                <ThemedText type="defaultSemiBold" style={styles.actionText}>
                  {item?.status === "active" ? "Pause" : "Activate"}
                </ThemedText>
              </>
            )}
          </Pressable>

          {item?.promoted && (
            <View style={styles.promotedBadge}>
              <MaterialIcons name="star" size={14} color="#f57c00" />
              <ThemedText type="default" style={styles.promotedText}>
                Promoted
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <PageShell title="My Listings" showBackButton style={styles.shell}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a2f4a" />
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell title="My Listings" showBackButton style={styles.shell}>
      {error ? (
        <View style={styles.errorContainer}>
          <ThemedText type="default" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable onPress={fetchListings} style={styles.retryButton}>
            <ThemedText type="defaultSemiBold" style={styles.retryText}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item?.id)}
          renderItem={renderListing}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="list-alt" size={48} color="#6b6b6b" />
              <ThemedText type="default" style={styles.emptyText}>
                No listings yet. Create your first listing from My Products.
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
  listingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  listingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productName: { color: "#0a2f4a", fontSize: 15, flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, textTransform: "capitalize" },
  detailsRow: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(10, 47, 74, 0.08)",
  },
  detailItem: { flex: 1, alignItems: "center" },
  detailLabel: { color: "#6b6b6b", fontSize: 11 },
  detailValue: { color: "#0a2f4a", fontSize: 14, marginTop: 2 },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0a2f4a",
  },
  actionText: { color: "#0a2f4a", marginLeft: 4, fontSize: 13 },
  buttonDisabled: { opacity: 0.6 },
  promotedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  promotedText: { color: "#f57c00", fontSize: 11, marginLeft: 4 },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: { color: "#b00020", textAlign: "center" },
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
