import React, { useState, useMemo } from "react";
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
import { useRouter } from "expo-router";
import { ORDERS } from "@/data/orders";
import { formatCurrency } from "@/lib/formatters";

export const options = { headerShown: false };

type OrderFilter = "ALL" | "DELIVERED" | "PROCESSING" | "SHIPPED";

export default function OrdersScreen() {
  const { addItem } = useCart();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<OrderFilter>("ALL");

  const FILTERS = [
    { key: "ALL", label: "All Orders" },
    { key: "DELIVERED", label: "Delivered" },
    { key: "PROCESSING", label: "Processing" },
    { key: "SHIPPED", label: "Shipped" },
  ];

  const filteredOrders = useMemo(() => {
    if (filter === "ALL") return ORDERS;
    return ORDERS.filter((order) => order.status === filter);
  }, [filter]);

  const onDetails = (order: any) => {
    router.push(`/orders/${order.id}`);
  };

  const onTrack = (order: any) => {
    // Track order logic
  };

  const onReorder = (order: any) => {
    order.items.forEach((item: any) => {
      addItem({
        id: item.id,
        title: item.title,
        price: item.price,
        subtitle: item.category,
        image: item.image,
      });
    });
    // navigate to cart so the user can review their reordered items
    router.push("/cart");
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
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <ThemedText type="defaultSemiBold" style={styles.orderTitle}>
                  Order #{item.id}
                </ThemedText>
                <ThemedText
                  type="default"
                  lightColor="#6b6b6b"
                  style={{ marginTop: 6 }}
                >
                  {item.date} • {item.items.length} Item
                  {item.items.length > 1 ? "s" : ""}
                </ThemedText>
              </View>

              <StatusBadge status={item.status} />
            </View>

            <View style={styles.productsPill}>
              <View style={styles.thumbRow}>
                {item.items.slice(0, 3).map((it, i) => (
                  <RNImage
                    key={it.id}
                    source={it.image}
                    style={[
                      styles.thumbSmall,
                      { marginLeft: i === 0 ? 0 : -10 },
                    ]}
                  />
                ))}
                {item.items.length > 3 && (
                  <View
                    style={[
                      styles.thumbSmall,
                      styles.moreThumb,
                      { marginLeft: -10 },
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">
                      +{item.items.length - 3}
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
                  {item.items.map((it) => it.title).join(", ")}
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
                  {formatCurrency(item.total)}
                </ThemedText>
              </View>

              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => onDetails(item)}
                >
                  <ThemedText type="default">Details</ThemedText>
                </TouchableOpacity>

                {item.status === "PROCESSING" ? (
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
        )}
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
    alignItems: "center",
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
