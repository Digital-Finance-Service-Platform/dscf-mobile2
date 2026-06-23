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
import { ThemedText } from "@/components/themed-text";
import { marketGetMyProducts } from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";

export default function SupplierProductsScreen() {
  const router = useRouter();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#2e7d32";
      case "inactive":
        return "#f57c00";
      case "discontinued":
        return "#b00020";
      default:
        return "#6b6b6b";
    }
  };

  const renderProduct = ({ item }: { item: any }) => {
    const product = item?.product ?? {};
    return (
      <View style={styles.productCard}>
        <View style={styles.productImage}>
          {product?.thumbnail_url ? (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="image" size={32} color="#6b6b6b" />
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="inventory" size={32} color="#6b6b6b" />
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <ThemedText type="defaultSemiBold" style={styles.productName}>
            {product?.name ?? "Unknown Product"}
          </ThemedText>
          <ThemedText type="default" style={styles.productSku}>
            SKU: {product?.sku ?? "N/A"}
          </ThemedText>
          <View style={styles.priceRow}>
            <ThemedText type="default" style={styles.price}>
              {item?.supplier_price ? formatCurrency(item.supplier_price) : "No price"}
            </ThemedText>
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
          <ThemedText type="default" style={styles.quantity}>
            Qty: {item?.available_quantity ?? 0} | MOQ: {item?.minimum_order_quantity ?? 0}
          </ThemedText>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <PageShell title="My Products" showBackButton style={styles.shell}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a2f4a" />
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="My Products"
      showBackButton
      style={styles.shell}
      rightNode={
        <Pressable onPress={() => router.push("/supplier/create-product" as any)}>
          <MaterialIcons name="add-circle" size={24} color="#0a2f4a" />
        </Pressable>
      }
    >
      {error ? (
        <View style={styles.errorContainer}>
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
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={48} color="#6b6b6b" />
              <ThemedText type="default" style={styles.emptyText}>
                No products yet. Request a product to get started.
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
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { flex: 1, marginLeft: 12 },
  productName: { color: "#0a2f4a", fontSize: 15 },
  productSku: { color: "#6b6b6b", fontSize: 12, marginTop: 2 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  price: { color: "#0a2f4a", fontWeight: "600", fontSize: 14 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, textTransform: "capitalize" },
  quantity: { color: "#6b6b6b", fontSize: 12, marginTop: 4 },
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
