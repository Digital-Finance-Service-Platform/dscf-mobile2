import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Image as RNImage,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/themed-text";
import { FilterChips } from "@/components/filter-chips";
import { StatusBadge } from "@/components/status-badge";
import { PageShell } from "@/components/page-shell";
import { useCart } from "@/components/cart-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ORDERS } from "@/data/orders";
import { formatCurrency } from "@/lib/formatters";
import { marketGetMyOrders } from "@/lib/api/clients";
import ReorderSummaryModal from "@/components/reorder-summary-modal";
import { normalizeOrderStatus } from "@/lib/order-status";

export const options = { headerShown: false };

type OrderFilter = "ALL" | "DELIVERED" | "PROCESSING" | "SHIPPED" | "PENDING" | "CANCELLED";

export default function OrdersScreen() {
  const { addItem } = useCart();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<OrderFilter>("ALL");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [reorderStats, setReorderStats] = useState({ added: 0, skipped: 0, adjusted: 0 });
  const [reorderModalVisible, setReorderModalVisible] = useState(false);

  // Fetch orders from backend on focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchOrders = async () => {
        try {
          setLoading(true);
          console.log("[OrdersScreen] fetching my orders");
          const response = await marketGetMyOrders();
          if (response?.success && Array.isArray(response?.data)) {
            // Group orders that were created within 2 minutes of each other
            const groupedOrders: any[] = [];
            
            // Sort by created_at descending first so newest are first
            const sortedData = [...response.data].sort((a, b) => 
              new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime()
            );

            sortedData.forEach((order) => {
              const orderTime = new Date(order.created_at || order.date || 0).getTime();
              
              // Find an existing group where this order belongs
              // Must have the same status and be within 2 minutes (120,000 ms)
              const groupIndex = groupedOrders.findIndex(g => 
                g.status === order.status &&
                Math.abs(new Date(g.created_at || g.date || 0).getTime() - orderTime) < 120000
              );

              if (groupIndex >= 0) {
                // Add to existing group
                const g = groupedOrders[groupIndex];
                
                // To keep IDs in chronological order (oldest first like 90,91,92), we prepend the older order ID
                g.id = `${order.id},${g.id}`;
                
                // Combine items
                const gItems = g.items || g.order_items || [];
                const oItems = order.items || order.order_items || [];
                g.items = [...oItems, ...gItems]; // prepend items of older order
                g.order_items = g.items; 
                
                // Add total amount
                g.total_amount = Number(g.total_amount || g.total || 0) + Number(order.total_amount || order.total || 0);
                g.total = g.total_amount;
              } else {
                // Create new group
                groupedOrders.push({ ...order }); // clone to avoid mutating original
              }
            });

            setOrders(groupedOrders);
            console.log("[OrdersScreen] orders fetched and grouped", groupedOrders.length);
          } else {
            throw new Error(response?.message || "Failed to fetch orders");
          }
        } catch (err: any) {
          console.warn("[OrdersScreen] fetch error", err?.message || err);
          // Fallback to demo data for development
          setOrders(ORDERS);
        } finally {
          setLoading(false);
        }
      };

      fetchOrders();
    }, [])
  );

  const FILTERS = [
    { key: "ALL", label: "All Orders" },
    { key: "PENDING", label: "Pending" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "SHIPPED", label: "Shipped" },
    { key: "DELIVERED", label: "Delivered" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  const filteredOrders = useMemo(() => {
    if (filter === "ALL") return orders;
    return orders.filter((order) => {
      const s = normalizeOrderStatus(order.status).toUpperCase();
      if (filter === "PENDING" && (s === "PENDING" || s === "WAITING_RETAILER" || s === "WAITING_RETAILER_CONFIRMATION")) {
        return true;
      }
      if (filter === "CANCELLED" && (s === "CANCELLED" || s === "CANCELED")) {
        return true;
      }
      return s === filter;
    });
  }, [filter, orders]);

  const onDetails = (order: any) => {
    router.push(`/orders/${encodeURIComponent(order.id)}`);
  };

  const onTrack = (order: any) => {
    // Track order logic
  };

  const onReorder = (order: any) => {
    let added = 0;
    let skipped = 0;
    let adjusted = 0;

    const items = order.items || order.order_items || [];
    items.forEach((item: any) => {
      // simulate availability check (80% available)
      const available = Math.random() < 0.8;
      if (!available) {
        skipped += 1;
        return;
      }

      // simulate price adjustment within +/-10%
      const price = item.price || item.unit_price || 0;
      const change = (Math.random() * 0.2 - 0.1);
      const newPrice = Math.round((price * (1 + change)) * 100) / 100;

      addItem({
        id: item.id,
        title: item.title || item.product_name,
        price: newPrice,
        subtitle: item.category || "",
        image: item.image || item.images_urls?.[0],
        raw: {
          ...item,
          listing_id: item.listing_id || item.source_id,
          aggregator_id: item.ordered_to_id,
        },
        product_id: item.product_id,
        unit_id: item.unit_id,
        listing_id: item.listing_id || item.source_id,
        ordered_to_id: item.ordered_to_id,
      });

      if (newPrice !== price) adjusted += 1;
      added += 1;
    });

    setReorderStats({ added, skipped, adjusted });
    setReorderModalVisible(true);
  };

  const handleFilterChange = (key: string) => {
    setFilter(key as OrderFilter);
  };

  return (
    <PageShell style={styles.shell}>
      <View style={styles.topHeader}>
        <ThemedText type="title" style={styles.topTitle}>
          Order History
        </ThemedText>
        <ThemedText
          type="default"
          lightColor="#6b6b6b"
          style={styles.topSubtitle}
        >
          Track, review, and reorder your past purchases.
        </ThemedText>
      </View>

      <FilterChips
        filters={FILTERS}
        active={filter}
        onSelect={handleFilterChange}
        style={styles.filterRow}
      />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <MaterialIcons name="inbox" size={48} color="#ccc" />
            <ThemedText type="default" lightColor="#999" style={{ marginTop: 12 }}>
              {loading ? "Loading orders..." : "No orders yet"}
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => {
          const itemsList = item.items || item.order_items || [];
          const orderDate = new Date(item.created_at || item.date).toLocaleDateString();
          
          // Calculate subtotal from items in case the API's total is missing or wrong
          const calculatedSubtotal = itemsList.reduce(
            (sum: number, it: any) => sum + (Number(it.unit_price || it.price || 0) * Number(it.quantity || 1)),
            0
          );
          const orderTotal = calculatedSubtotal > 0 ? calculatedSubtotal : Number(item.total_amount ?? item.total);
          const totalWithTax = +(orderTotal * 1.08).toFixed(2);

          return (
            <View style={styles.orderCard}>
              <View style={[styles.orderHeader, { width: '100%' }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <ThemedText type="defaultSemiBold" style={styles.orderTitle} numberOfLines={1} ellipsizeMode="tail">
                    {String(item.id).includes(",") ? `Orders ${item.id}` : `Order #${item.id}`}
                  </ThemedText>
                  <ThemedText
                    type="default"
                    lightColor="#6b6b6b"
                    style={{ marginTop: 6 }}
                  >
                    {orderDate} • {itemsList.length} Item
                    {itemsList.length > 1 ? "s" : ""}
                  </ThemedText>
                </View>

                <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                  <StatusBadge status={item.status} />
                </View>
              </View>

              <View style={styles.productsPill}>
                <View style={styles.thumbRow}>
                  {itemsList.slice(0, 3).map((it: any, i: number) => {
                    const imageUri = it.image || it.images_urls?.[0];
                    return (
                      <RNImage
                        key={it.id}
                        source={imageUri}
                        style={[
                          styles.thumbSmall,
                          { marginLeft: i === 0 ? 0 : -10 },
                        ]}
                      />
                    );
                  })}
                  {itemsList.length > 3 && (
                    <View
                      style={[
                        styles.thumbSmall,
                        styles.moreThumb,
                        { marginLeft: -10 },
                      ]}
                    >
                      <ThemedText type="defaultSemiBold">
                        +{itemsList.length - 3}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.productLabel}>
                  <ThemedText
                    type="default"
                    numberOfLines={1}
                    style={{ color: "#333" }}
                  >
                    {itemsList.map((it: any) => it.title || it.product_name).join(", ")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <View>
                  <ThemedText type="default" lightColor="#6b6b6b">
                    Total Amount
                  </ThemedText>
                  <ThemedText
                    type="title"
                    style={{ marginTop: 6, fontSize: 18, color: "#800000" }}
                  >
                    {formatCurrency(totalWithTax)}
                  </ThemedText>
                </View>

                <View style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => onDetails(item)}
                  >
                    <ThemedText type="default">Details</ThemedText>
                  </TouchableOpacity>

                  {item.status === "CONFIRMED" ? (
                    <TouchableOpacity
                      style={[styles.detailsBtn, { marginLeft: 8 }]}
                      onPress={() => onTrack(item)}
                    >
                      <ThemedText type="default">Track</ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.reorderBtn, { marginLeft: 8 }]}
                      onPress={() => onReorder(item)}
                    >
                      <MaterialIcons
                        name="replay"
                        size={16}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <ThemedText
                        type="defaultSemiBold"
                        style={{ color: "#fff" }}
                      >
                        Reorder
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
      
      <ReorderSummaryModal
        visible={reorderModalVisible}
        added={reorderStats.added}
        skipped={reorderStats.skipped}
        adjusted={reorderStats.adjusted}
        onClose={() => setReorderModalVisible(false)}
        onViewCart={() => {
          setReorderModalVisible(false);
          router.push("/cart");
        }}
      />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { backgroundColor: "#f4f4f5" },
  topHeader: {
    marginBottom: 16,
  },
  topTitle: {
    marginBottom: 8,
  },
  topSubtitle: {
    lineHeight: 24,
  },
  filterRow: {
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderTitle: {
    fontSize: 18,
    color: "#8a1d1d",
  },
  productsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f8fb",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginTop: 14,
  },
  thumbRow: { flexDirection: "row", alignItems: "center" },
  thumbSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fff",
    backgroundColor: "#fff",
    marginRight: -12,
    overflow: "hidden",
  },
  moreThumb: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9e9ea",
  },
  productLabel: { flex: 1, marginLeft: 12 },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  buttonsRow: { flexDirection: "row", alignItems: "center" },
  detailsBtn: {
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: "#8a1d1d",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  outlineBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chip: {
    backgroundColor: "#F4F6FB",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 10,
  },
  chipActive: { backgroundColor: "#D9E2FF" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  statusInner: { flexDirection: "row", alignItems: "center" },
  statusBadgeDelivered: { backgroundColor: "#e9f7ec" },
  statusInnerDelivered: { flexDirection: "row", alignItems: "center" },
  statusCheckWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  statusDeliveredText: { color: "#1f7a39", fontWeight: "700", fontSize: 12 },
  statusBadgeProcessing: { backgroundColor: "#fff4ea" },
  statusInnerProcessing: { flexDirection: "row", alignItems: "center" },
  statusIconWrapProcessing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  statusProcessingText: { color: "#ff7a00", fontWeight: "700", fontSize: 12 },
  statusBadgeShipped: { backgroundColor: "#eaf5ff" },
  statusInnerShipped: { flexDirection: "row", alignItems: "center" },
  statusIconWrapShipped: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  statusShippedText: { color: "#0b67c2", fontWeight: "700", fontSize: 12 },
});
