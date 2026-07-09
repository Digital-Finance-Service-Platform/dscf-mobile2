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
import { marketGetMyProducts } from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";
import { supplierTheme } from "@/lib/supplier-theme";

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return supplierTheme.success;
    case "inactive":
      return supplierTheme.warning;
    case "discontinued":
      return supplierTheme.error;
    default:
      return supplierTheme.textMuted;
  }
}

export default function SupplierProductsScreen() {
  const router = useRouter();
  const supplierMenuItems = useSupplierMenuItems();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await marketGetMyProducts();
      const data = Array.isArray(res?.data) ? res.data : res || [];
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const renderProduct = ({ item }: { item: any }) => {
    const product = item?.product ?? {};
    const price = item?.price ?? item?.supplier_price;
    const qty = item?.quantity ?? item?.available_quantity ?? 0;
    const status = item?.status ?? "inactive";
    const statusColor = getStatusColor(status);

    return (
      <View style={styles.productCard}>
        <View style={styles.productTop}>
          <View style={styles.productIconWrap}>
            <MaterialIcons name="inventory-2" size={26} color={supplierTheme.primary} />
          </View>
          <View style={styles.productInfo}>
            <ThemedText type="defaultSemiBold" style={styles.productName} numberOfLines={2}>
              {product?.name ?? "Unknown Product"}
            </ThemedText>
            <ThemedText type="default" style={styles.productSku}>
              SKU: {product?.sku ?? "N/A"}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <ThemedText type="defaultSemiBold" style={[styles.statusText, { color: statusColor }]}>
              {status}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <ThemedText type="default" style={styles.metricLabel}>
              Price
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.metricValue}>
              {price ? formatCurrency(price) : "—"}
            </ThemedText>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <ThemedText type="default" style={styles.metricLabel}>
              Quantity
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.metricValue}>
              {qty}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <PageShell
        title="My Products"
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
      title="My Products"
      showBackButton
      useBackIcon
      headerVariant="retailer"
      menuItems={supplierMenuItems}
      style={styles.shell}
      rightNode={
        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/supplier/create-product" as any)}
        >
          <MaterialIcons name="add" size={22} color="#fff" />
        </Pressable>
      }
    >
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={40} color={supplierTheme.error} />
          <ThemedText type="default" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable onPress={fetchProducts} style={styles.retryButton}>
            <ThemedText type="defaultSemiBold" style={styles.retryText}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item?.id)}
          renderItem={renderProduct}
          contentContainerStyle={[
            styles.list,
            products.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            products.length > 0 ? (
              <View style={styles.summaryCard}>
                <ThemedText type="defaultSemiBold" style={styles.summaryTitle}>
                  Inventory Overview
                </ThemedText>
                <ThemedText type="default" style={styles.summaryText}>
                  {products.length} product{products.length === 1 ? "" : "s"} in your catalog
                </ThemedText>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <SupplierEmptyState
              icon="inventory"
              title="No products yet"
              message="Publish your first supplier product with price and quantity to start selling."
              actionLabel="Create Product"
              onAction={() => router.push("/supplier/create-product" as any)}
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
  summaryCard: {
    backgroundColor: supplierTheme.primaryDark,
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 4,
  },
  summaryText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
  },
  productCard: {
    backgroundColor: supplierTheme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: supplierTheme.border,
    ...supplierTheme.cardShadow,
  },
  productTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  productIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: supplierTheme.iconBg,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { flex: 1 },
  productName: { color: supplierTheme.primary, fontSize: 16 },
  productSku: { color: supplierTheme.textMuted, fontSize: 13, marginTop: 3 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, textTransform: "capitalize" },
  metricsRow: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: supplierTheme.border,
  },
  metric: { flex: 1, alignItems: "center" },
  metricDivider: {
    width: 1,
    backgroundColor: supplierTheme.border,
    marginVertical: 2,
  },
  metricLabel: { color: supplierTheme.textMuted, fontSize: 12 },
  metricValue: {
    color: supplierTheme.primary,
    fontSize: 16,
    marginTop: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: supplierTheme.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
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
