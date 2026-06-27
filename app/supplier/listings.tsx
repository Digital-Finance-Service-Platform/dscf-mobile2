import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
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
import { SupplierEmptyState } from "@/components/supplier/supplier-empty-state";
import { ThemedText } from "@/components/themed-text";
import { useSupplierMenuItems } from "@/hooks/use-supplier-menu";
import {
  marketActivateListing,
  marketGetMyListings,
  marketPauseListing,
} from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";
import { supplierTheme } from "@/lib/supplier-theme";

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return supplierTheme.success;
    case "draft":
      return supplierTheme.textMuted;
    case "paused":
      return supplierTheme.warning;
    case "sold_out":
      return supplierTheme.error;
    default:
      return supplierTheme.textMuted;
  }
}

export default function SupplierListingsScreen() {
  const router = useRouter();
  const supplierMenuItems = useSupplierMenuItems();
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

  const renderListing = ({ item }: { item: any }) => {
    const product = item?.supplier_product?.product ?? item?.product ?? {};
    const status = item?.status ?? "draft";
    const statusColor = getStatusColor(status);

    return (
      <View style={styles.listingCard}>
        <View style={styles.listingHeader}>
          <View style={styles.listingIconWrap}>
            <MaterialIcons name="storefront" size={22} color={supplierTheme.primary} />
          </View>
          <View style={styles.listingTitleWrap}>
            <ThemedText type="defaultSemiBold" style={styles.productName} numberOfLines={2}>
              {product?.name ?? item?.name ?? "Unknown Product"}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
              <ThemedText
                type="defaultSemiBold"
                style={[styles.statusText, { color: statusColor }]}
              >
                {status}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="payments" size={16} color={supplierTheme.textMuted} />
            <ThemedText type="default" style={styles.detailLabel}>
              Price
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.detailValue}>
              {item?.price ? formatCurrency(item.price) : "N/A"}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="inventory" size={16} color={supplierTheme.textMuted} />
            <ThemedText type="default" style={styles.detailLabel}>
              Qty
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.detailValue}>
              {item?.quantity ?? 0}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="shopping-bag" size={16} color={supplierTheme.textMuted} />
            <ThemedText type="default" style={styles.detailLabel}>
              MOQ
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.detailValue}>
              {item?.min_order_quantity ?? item?.minimum_order_quantity ?? 0}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionButton, actionLoading === item.id && styles.buttonDisabled]}
            onPress={() => handleToggleStatus(item)}
            disabled={actionLoading === item.id}
          >
            {actionLoading === item.id ? (
              <ActivityIndicator size="small" color={supplierTheme.primary} />
            ) : (
              <>
                <MaterialIcons
                  name={status === "active" ? "pause" : "play-arrow"}
                  size={18}
                  color={supplierTheme.primary}
                />
                <ThemedText type="defaultSemiBold" style={styles.actionText}>
                  {status === "active" ? "Pause" : "Activate"}
                </ThemedText>
              </>
            )}
          </Pressable>
          {item?.promoted ? (
            <View style={styles.promotedBadge}>
              <MaterialIcons name="star" size={14} color={supplierTheme.warning} />
              <ThemedText type="default" style={styles.promotedText}>
                Promoted
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <PageShell
        title="My Listings"
        showBackButton
        useBackIcon
        headerVariant="retailer"
        menuItems={supplierMenuItems}
        style={styles.shell}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={supplierTheme.primary} />
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="My Listings"
      showBackButton
      useBackIcon
      headerVariant="retailer"
      menuItems={supplierMenuItems}
      style={styles.shell}
    >
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={40} color={supplierTheme.error} />
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
          contentContainerStyle={[
            styles.list,
            listings.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <SupplierEmptyState
              icon="list-alt"
              title="No listings yet"
              message="Create your first listing from My Products by publishing price and quantity."
              actionLabel="Go to My Products"
              onAction={() => router.push("/supplier/products" as any)}
            />
          }
        />
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60, backgroundColor: supplierTheme.background },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  list: { paddingBottom: 24, gap: 12 },
  listEmpty: { flexGrow: 1 },
  listingCard: {
    backgroundColor: supplierTheme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: supplierTheme.border,
    ...supplierTheme.cardShadow,
  },
  listingHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  listingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: supplierTheme.iconBg,
    alignItems: "center",
    justifyContent: "center",
  },
  listingTitleWrap: { flex: 1, gap: 8 },
  productName: { color: supplierTheme.primary, fontSize: 16 },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, textTransform: "capitalize" },
  detailsRow: {
    flexDirection: "row",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: supplierTheme.border,
  },
  detailItem: { flex: 1, alignItems: "center", gap: 4 },
  detailLabel: { color: supplierTheme.textMuted, fontSize: 11 },
  detailValue: { color: supplierTheme.primary, fontSize: 15 },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: supplierTheme.primary,
    backgroundColor: supplierTheme.card,
    gap: 6,
  },
  actionText: { color: supplierTheme.primary, fontSize: 14 },
  buttonDisabled: { opacity: 0.6 },
  promotedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  promotedText: { color: supplierTheme.warning, fontSize: 11, fontWeight: "600" },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
    gap: 12,
  },
  errorText: { color: supplierTheme.error, textAlign: "center" },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: supplierTheme.primary,
    borderRadius: 12,
  },
  retryText: { color: "#fff" },
});
