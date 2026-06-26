import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import {
    marketDeleteSupplierProduct,
    marketGetMyProducts,
    marketUpdateSupplierProduct,
} from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";
import { useSdk } from "@/lib/sdk/context";

export default function SupplierDashboardScreen() {
  const router = useRouter();
  const { user } = useSdk();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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

  const handleToggleStatus = async (product: any) => {
    setActionLoading(product.id);
    try {
      const newStatus = product?.status === "active" ? "inactive" : "active";
      await marketUpdateSupplierProduct(product.id, {
        supplier_product: { status: newStatus },
      });
      fetchProducts();
    } catch (err: any) {
      setError(err?.message || "Failed to update product");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (product: any) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product?.product?.name || "this product"}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setActionLoading(product.id);
            try {
              await marketDeleteSupplierProduct(product.id);
              fetchProducts();
            } catch (err: any) {
              setError(err?.message || "Failed to delete product");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#2e7d32";
      case "inactive":
        return "#f57c00";
      case "pending":
        return "#1976d2";
      case "approved":
        return "#2e7d32";
      case "rejected":
        return "#b00020";
      default:
        return "#6b6b6b";
    }
  };

  const stats = {
    total: products.length,
    active: products.filter((p) => p?.status === "active").length,
    pending: products.filter((p) => p?.status === "pending" || p?.approval_status === "pending").length,
  };

  const renderStatCard = (label: string, value: number, icon: string, color: string) => (
    <View key={label} style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialIcons name={icon as any} size={28} color={color} style={styles.statIcon} />
      <ThemedText type="defaultSemiBold" style={[styles.statValue, { color }]}>
        {value}
      </ThemedText>
      <ThemedText type="default" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );

  const renderProduct = ({ item }: { item: any }) => {
    const product = item?.product ?? {};
    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
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
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <ThemedText type="default" style={styles.detailLabel}>
              Available
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.detailValue}>
              {item?.available_quantity ?? 0}
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
          {item?.approval_status && (
            <View style={styles.detailItem}>
              <ThemedText type="default" style={styles.detailLabel}>
                Approval
              </ThemedText>
              <ThemedText
                type="defaultSemiBold"
                style={[styles.detailValue, { color: getStatusColor(item.approval_status) }]}
              >
                {item.approval_status}
              </ThemedText>
            </View>
          )}
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

          <Pressable
            style={[styles.deleteButton]}
            onPress={() => handleDelete(item)}
            disabled={actionLoading === item.id}
          >
            <MaterialIcons name="delete" size={16} color="#b00020" />
            <ThemedText type="defaultSemiBold" style={styles.deleteText}>
              Delete
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <PageShell title="Supplier Dashboard" showBackButton style={styles.shell}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a2f4a" />
        </View>
      </PageShell>
    );
  }

  const userName = user?.user_profile
    ? `${user.user_profile.first_name ?? ""} ${user.user_profile.last_name ?? ""}`.trim()
    : user?.phone ?? user?.email ?? "Supplier";

  return (
    <PageShell
      title="Supplier Dashboard"
      showBackButton
      style={styles.shell}
      rightNode={
        <Pressable 
          onPress={() => router.push("/supplier/create-product" as any)}
          style={styles.headerAddBtn}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
        </Pressable>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <ThemedText type="defaultSemiBold" style={styles.welcomeTitle}>
              Welcome back,{"\n"}{userName}
            </ThemedText>
            <ThemedText type="default" style={styles.welcomeSubtitle}>
              Manage your products and inventory
            </ThemedText>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            {renderStatCard("Total", stats.total, "inventory", "#00274d")}
            {renderStatCard("Active", stats.active, "check-circle", "#2e7d32")}
            {renderStatCard("Pending", stats.pending, "hourglass-empty", "#1976d2")}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Pressable
              style={styles.quickActionButton}
              onPress={() => router.push("/supplier/products" as any)}
            >
              <MaterialIcons name="list-alt" size={20} color="#00274d" />
              <ThemedText type="defaultSemiBold" style={styles.quickActionText}>
                Products
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.quickActionButton}
              onPress={() => router.push("/supplier/listings" as any)}
            >
              <MaterialIcons name="storefront" size={20} color="#00274d" />
              <ThemedText type="defaultSemiBold" style={styles.quickActionText}>
                Listings
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.quickActionButton}
              onPress={() => router.push("/supplier/orders" as any)}
            >
              <MaterialIcons name="shopping-bag" size={20} color="#00274d" />
              <ThemedText type="defaultSemiBold" style={styles.quickActionText}>
                Orders
              </ThemedText>
            </Pressable>
          </View>

          {/* Recent Products */}
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Recent Products
            </ThemedText>
            <Pressable onPress={() => router.push("/supplier/products" as any)}>
              <ThemedText type="defaultSemiBold" style={styles.seeAllText}>
                See All
              </ThemedText>
            </Pressable>
          </View>

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
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="archive" size={64} color="#6b6b6b" style={styles.emptyIcon} />
              <ThemedText type="default" style={styles.emptyText}>
                No products yet. Request a product to get started.
              </ThemedText>
              <Pressable
                style={styles.addProductButton}
                onPress={() => router.push("/supplier/create-product" as any)}
              >
                <ThemedText type="defaultSemiBold" style={styles.addProductText}>
                  Request Product
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.productsList}>
              {products.slice(0, 5).map((item) => (
                <View key={String(item?.id)}>{renderProduct({ item })}</View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 40, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 20 },
  headerAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00274d",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#00274d",
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: "#6b6b6b",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderLeftWidth: 4,
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b6b6b",
    marginTop: 2,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAECF0",
    gap: 4,
  },
  quickActionText: {
    color: "#00274d",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#00274d",
    fontWeight: "700",
  },
  seeAllText: {
    color: "#1976d2",
    fontSize: 13,
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
  productHeader: {
    flexDirection: "row",
  },
  productImage: {
    width: 60,
    height: 60,
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
  productName: { color: "#0a2f4a", fontSize: 14, fontWeight: "600" },
  productSku: { color: "#6b6b6b", fontSize: 11, marginTop: 2 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  price: { color: "#0a2f4a", fontWeight: "700", fontSize: 14 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: { fontSize: 10, textTransform: "capitalize", fontWeight: "600" },
  detailsRow: {
    flexDirection: "row",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(10, 47, 74, 0.06)",
  },
  detailItem: { flex: 1, alignItems: "center" },
  detailLabel: { color: "#6b6b6b", fontSize: 10 },
  detailValue: { color: "#0a2f4a", fontSize: 13, marginTop: 2, fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0a2f4a",
  },
  actionText: { color: "#0a2f4a", marginLeft: 4, fontSize: 12, fontWeight: "600" },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b00020",
  },
  deleteText: { color: "#b00020", marginLeft: 4, fontSize: 12, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
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
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    color: "#6b6b6b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  addProductButton: {
    backgroundColor: "#00274d",
    paddingVertical: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  addProductText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
