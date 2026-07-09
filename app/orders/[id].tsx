import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/components/cart-context";
import { OrderItem } from "@/components/order-item";
import { OrderSummary } from "@/components/order-summary";
import { PageShell } from "@/components/page-shell";
import ReorderSummaryModal from "@/components/reorder-summary-modal";
import SimpleAlertModal from "@/components/simple-alert-modal";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import {
    marketCancelOrder,
    marketGetOrder,
    marketRetailerConfirmOrder,
} from "@/lib/api/clients";
import {
    isAwaitingRetailerConfirmation,
    shouldUseRetailerConfirmEndpoint,
} from "@/lib/order-status";

export const options = { headerShown: false };

export default function OrderDetails() {
  const params = useLocalSearchParams();
  const rawId = Array.isArray(params.id) ? params.id.join(",") : String(params.id || "");
  const idStr = decodeURIComponent(rawId);
  const router = useRouter();
  const { addItem } = useCart();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnClose, setAlertOnClose] = useState<(() => void) | null>(null);

  const [reorderStats, setReorderStats] = useState({ added: 0, skipped: 0, adjusted: 0 });
  const [reorderModalVisible, setReorderModalVisible] = useState(false);
  const [waitingForSupplier, setWaitingForSupplier] = useState(false);

  const loadOrder = async () => {
    console.log("[OrderDetails] fetching order", idStr);
    if (idStr && idStr.includes(",")) {
      const ids = idStr.split(",").map((s) => s.trim());
      const responses = await Promise.all(ids.map((i) => marketGetOrder(i)));

      const combinedOrder = {
        ...responses[0]?.data,
        id: idStr,
        status: responses[0]?.data?.status || "pending",
        created_at: responses[0]?.data?.created_at || new Date().toISOString(),
        total_amount: responses.reduce(
          (sum, res) => sum + Number(res?.data?.total_amount || res?.data?.total || 0),
          0
        ),
        order_items: responses.flatMap(
          (res) => res?.data?.order_items || res?.data?.items || []
        ),
      };
      setOrder(combinedOrder);
      console.log("[OrderDetails] combined order fetched");
      return combinedOrder;
    }

    const response = await marketGetOrder(idStr);
    if (response?.success && response?.data) {
      setOrder(response.data);
      console.log("[OrderDetails] order fetched", response.data.id);
      return response.data;
    }

    throw new Error(response?.message || "Failed to fetch order");
  };

  // Fetch order from backend
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        await loadOrder();
      } catch (err: any) {
        console.warn("[OrderDetails] fetch error", err?.message || err);
        setError(err?.message || "Failed to load order details. Please try again.");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [idStr]);

  // Proactively check if order is waiting for supplier confirmation
  useEffect(() => {
    if (!order || !isAwaitingRetailerConfirmation(order.status)) {
      setWaitingForSupplier(false);
      return;
    }

    const items = order.order_items || order.items || [];
    const hasPendingItems = items.some((item: any) => {
      const status = String(item.status || "").toLowerCase();
      return status === "pending" || status === "processing";
    });

    setWaitingForSupplier(hasPendingItems);
  }, [order]);

  if (loading || !order) {
    return (
      <PageShell showBackButton>
        <ThemedText type="default" style={{ marginTop: 20 }}>
          {loading ? "Loading order details..." : error || "Order not found"}
        </ThemedText>
      </PageShell>
    );
  }

  const orderItems = order.order_items ?? order.items ?? [];

  // Calculate subtotal from items in case the API's total is missing or incorrect
  const calculatedSubtotal = orderItems.reduce(
    (sum: number, item: any) => sum + (Number(item.unit_price || item.price || 0) * Number(item.quantity || 1)),
    0
  );
  
  const orderTotal = calculatedSubtotal;
  const total = orderTotal;

  const onReorder = () => {
    let added = 0;
    let skipped = 0;
    let adjusted = 0;

    orderItems.forEach((it: any) => {
      // simulate availability check (80% available)
      const available = Math.random() < 0.8;
      if (!available) {
        skipped += 1;
        return;
      }

      // simulate price adjustment within +/-10%
      const price = it.unit_price || it.price || 0;
      const change = (Math.random() * 0.2 - 0.1);
      const newPrice = Math.round((price * (1 + change)) * 100) / 100;

      addItem({
        id: `${it.id}-r`,
        title: it.product_name || it.title,
        price: newPrice,
        subtitle: "",
        image: it.images_urls?.[0] || it.image,
        raw: {
          ...it,
          listing_id: it.listing_id || it.source_id,
          aggregator_id: it.ordered_to_id,
        },
        product_id: it.product_id,
        unit_id: it.unit_id,
        listing_id: it.listing_id || it.source_id,
        ordered_to_id: it.ordered_to_id,
      });

      if (newPrice !== price) adjusted += 1;
      added += 1;
    });
    
    setReorderStats({ added, skipped, adjusted });
    setReorderModalVisible(true);
  };
  const confirmOrder = async () => {
    try {
      setIsConfirming(true);
      console.log("[OrderDetails] confirming order", order.id);

      const ids = String(order.id).split(",").map((i) => i.trim());
      const responses = await Promise.all(
        ids.map((id) => marketRetailerConfirmOrder(id, { confirmed: true }))
      );

      const failed = responses.find((response) => !response?.success);
      if (failed) {
        throw new Error(failed?.message || "Failed to confirm order");
      }

      const refreshedOrder = await loadOrder();
      const updatedStatus =
        refreshedOrder?.status || responses[0]?.data?.status || "confirmed";

      setOrder((prev: any) => ({ ...prev, status: updatedStatus }));
      setAlertTitle("Order confirmed");
      setAlertMessage(`Order ${order.id} has been confirmed.`);
      setAlertOnClose(() => () => {
        setAlertVisible(false);
        router.push("/orders");
      });
      setAlertVisible(true);
      console.log("[OrderDetails] order confirmed successfully", order.id, updatedStatus);
    } catch (err: any) {
      console.warn("[OrderDetails] confirm error", err?.message || err);
      setAlertTitle("Confirmation Failed");
      setAlertMessage(err?.message || "Could not confirm order. Please try again.");
      setAlertOnClose(() => () => setAlertVisible(false));
      setAlertVisible(true);
    } finally {
      setIsConfirming(false);
    }
  };

  const submitCancellation = async () => {
    if (!cancelReason || cancelReason.trim().length === 0) {
      setAlertTitle("Please provide a reason");
      setAlertMessage("Cancellation reason is required.");
      setAlertOnClose(() => null);
      setAlertVisible(true);
      return;
    }

    try {
      setIsCancelling(true);
      console.log("[OrderDetails] cancelling order", order.id, cancelReason);
      
      const ids = String(order.id).split(",").map((i) => i.trim());
      const useRetailerConfirm = shouldUseRetailerConfirmEndpoint(order.status);

      const responses = await Promise.all(
        ids.map((id) =>
          useRetailerConfirm
            ? marketRetailerConfirmOrder(id, { confirmed: false, reason: cancelReason })
            : marketCancelOrder(id, cancelReason)
        )
      );

      const failed = responses.find((response) => !response?.success);
      if (failed) {
        throw new Error(failed?.message || "Failed to cancel order");
      }

      const refreshedOrder = await loadOrder();
      const updatedStatus =
        refreshedOrder?.status || responses[0]?.data?.status || "cancelled";

      setOrder((prev: any) => ({ ...prev, status: updatedStatus }));
      setShowCancelModal(false);
      setCancelReason("");
      setAlertTitle("Order cancelled");
      setAlertMessage(`Order ${order.id} was cancelled.`);
      setAlertOnClose(() => () => {
        setAlertVisible(false);
        router.push("/orders");
      });
      setAlertVisible(true);
      console.log("[OrderDetails] order cancelled successfully", order.id);
    } catch (err: any) {
      console.warn("[OrderDetails] cancel error", err?.message || err);
      setAlertTitle("Cancellation Failed");
      setAlertMessage(err?.message || "Could not cancel order. Please try again.");
      setAlertOnClose(() => () => setAlertVisible(false));
      setAlertVisible(true);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <PageShell showBackButton>
      <View style={[styles.orderHeaderRow, { width: '100%', paddingRight: 40, marginTop: -20 }]}>
        <View style={styles.orderIdWrap}>
          <MaterialIcons name="receipt" size={16} color="#8a1d1d" />
        </View>
        <ThemedText type="defaultSemiBold" style={styles.orderIdText} numberOfLines={1} ellipsizeMode="tail">
          {String(order.id).includes(",") ? `Orders ${order.id}` : `Order #${order.id}`}
        </ThemedText>
      </View>

      <View style={styles.statusSection}>
        <StatusBadge status={order.status} />

        <View style={styles.statusMetaRow}>
          <ThemedText type="default" lightColor="#6b6b6b" style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString()}
          </ThemedText>

          {(order.expected_delivery_date || isAwaitingRetailerConfirmation(order.status)) && (
            <View style={styles.deliveryBlock}>
              <ThemedText type="default" style={styles.deliveryLabel}>
                Expected Delivery
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.deliveryValue}>
                {order.expected_delivery_date
                  ? new Date(order.expected_delivery_date).toLocaleDateString()
                  : "TBD upon confirmation"}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={orderItems}
        keyExtractor={(i, index) => String(i.id || index)}
        style={{ marginTop: 12 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <OrderItem
            id={item.id}
            title={item.product_name || item.title || "Unknown Product"}
            price={item.unit_price || item.price || 0}
            quantity={item.quantity || 1}
            image={item.images_urls?.[0] || item.image}
          />
        )}
        ListFooterComponent={() => (
          <View>
            <OrderSummary
              subtotal={orderTotal}
              total={total}
              showShipping={false}
            />

            {isAwaitingRetailerConfirmation(order.status) && (
              <View style={{ marginTop: 16 }}>
                {waitingForSupplier && (
                  <View style={styles.waitingForSupplierBanner}>
                    <MaterialIcons name="hourglass-empty" size={18} color="#ff7a00" />
                    <ThemedText type="default" style={styles.waitingForSupplierText}>
                      Waiting for supplier confirmation
                    </ThemedText>
                  </View>
                )}
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        flex: 1,
                        marginRight: 6,
                        backgroundColor: "#1f7a39",
                        opacity: isConfirming || waitingForSupplier ? 0.6 : 1,
                      },
                    ]}
                    onPress={confirmOrder}
                    disabled={isConfirming || waitingForSupplier}
                  >
                    <MaterialIcons name="check-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <ThemedText type="defaultSemiBold" style={{ color: "#fff", fontSize: 13 }}>
                      {isConfirming ? "Confirming..." : waitingForSupplier ? "Waiting..." : "Confirm Order"}
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtnOutline, { flex: 1, marginLeft: 6, opacity: isCancelling ? 0.6 : 1 }]}
                    onPress={() => setShowCancelModal(true)}
                    disabled={isCancelling}
                  >
                    <MaterialIcons name="cancel" size={16} color="#8a1d1d" style={{ marginRight: 6 }} />
                    <ThemedText type="defaultSemiBold" style={{ color: "#8a1d1d", fontSize: 13 }}>
                      Cancel Order
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.reorderBtn}
              onPress={onReorder}
              accessibilityLabel="Reorder"
            >
              <MaterialIcons
                name="replay"
                size={16}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                Reorder
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="title">Cancel Order</ThemedText>
            <ThemedText type="default" lightColor="#6b6b6b" style={{ marginTop: 8 }}>
              Please provide a short reason for cancelling this order.
            </ThemedText>

            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              style={styles.modalInput}
              placeholder="Type reason"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#f1f1f1" }]}
                onPress={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                <ThemedText type="default">Close</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#8a1d1d", opacity: isCancelling ? 0.6 : 1 }]}
                onPress={submitCancellation}
                disabled={isCancelling}
              >
                <ThemedText type="default" style={{ color: "#fff" }}>
                  {isCancelling ? "Cancelling..." : "Submit"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
        <SimpleAlertModal
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          okLabel="OK"
          okColor="#0b67c2"
          icon="check-circle"
          iconColor="#0b67c2"
          onClose={() => {
            if (alertOnClose) alertOnClose();
            setAlertVisible(false);
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
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  headerTitle: { fontSize: 18 },
  statusSection: { marginTop: 12, gap: 8 },
  statusMetaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  orderDate: { flex: 1 },
  deliveryBlock: { flexShrink: 0, alignItems: "flex-end" },
  deliveryLabel: { fontSize: 11, color: "#6b6b6b" },
  deliveryValue: { fontSize: 13, color: "#333", textAlign: "right" },
  reorderBtn: {
    marginTop: 12,
    backgroundColor: "#8a1d1d",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelBtnOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#8a1d1d",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalInput: {
    marginTop: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 8,
    textAlignVertical: "top",
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginLeft: 8 },
  orderHeaderRow: { flexDirection: "row", alignItems: "center" },
  orderIdWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  orderIdText: { marginLeft: 12, flexShrink: 1, fontSize: 18 },
  waitingForSupplierBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff4ea",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ff7a00",
  },
  waitingForSupplierText: {
    marginLeft: 8,
    color: "#ff7a00",
    fontSize: 13,
    fontWeight: "600",
  },
});
