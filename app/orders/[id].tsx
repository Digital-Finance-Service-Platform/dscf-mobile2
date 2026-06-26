import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { PageShell } from "@/components/page-shell";
import { OrderItem } from "@/components/order-item";
import { OrderSummary } from "@/components/order-summary";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { useCart } from "@/components/cart-context";
import { ORDERS } from "@/data/orders";
import SimpleAlertModal from "@/components/simple-alert-modal";
import {
  marketGetOrder,
  marketRetailerConfirmOrder,
  marketCancelOrder,
} from "@/lib/api/clients";

export const options = { headerShown: false };

export default function OrderDetails() {
  const params = useLocalSearchParams();
  const { id } = params as { id: string };
  const router = useRouter();
  const { addItem } = useCart();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch order from backend
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        console.log("[OrderDetails] fetching order", id);
        const response = await marketGetOrder(id);
        if (response?.success && response?.data) {
          setOrder(response.data);
          console.log("[OrderDetails] order fetched", response.data.id);
        } else {
          throw new Error(response?.message || "Failed to fetch order");
        }
      } catch (err: any) {
        console.warn("[OrderDetails] fetch error", err?.message || err);
        // Fallback to demo data for development
        const demo = ORDERS.find((o) => o.id === id) ?? ORDERS[0];
        setOrder(demo);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading || !order) {
    return (
      <PageShell showBackButton>
        <ThemedText type="default" style={{ marginTop: 20 }}>
          Loading order details...
        </ThemedText>
      </PageShell>
    );
  }

  const tax = +(order.total * 0.08).toFixed(2);
  const total = +(order.total + tax).toFixed(2);

  const onReorder = () => {
    order.items?.forEach((it: any) =>
      addItem({
        id: `${it.id}-r`,
        title: it.product_name || it.title,
        price: it.unit_price || it.price,
        subtitle: "",
        image: it.images_urls?.[0] || it.image,
        raw: it,
        product_id: it.product_id,
        unit_id: it.unit_id,
        listing_id: it.listing_id,
        ordered_to_id: it.ordered_to_id,
      }),
    );
    router.push("/cart");
  };

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnClose, setAlertOnClose] = useState<(() => void) | null>(null);

  const confirmOrder = async () => {
    try {
      setIsConfirming(true);
      console.log("[OrderDetails] confirming order", order.id);
      const response = await marketRetailerConfirmOrder(order.id, { confirmed: true });
      
      if (response?.success && response?.data) {
        setOrder(response.data);
        setAlertTitle("Order confirmed");
        setAlertMessage(`Order ${order.id} has been confirmed.`);
        setAlertOnClose(() => () => setAlertVisible(false));
        setAlertVisible(true);
        console.log("[OrderDetails] order confirmed successfully", order.id);
      } else {
        throw new Error(response?.message || "Failed to confirm order");
      }
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
      const response = await marketCancelOrder(order.id, cancelReason);

      if (response?.success && response?.data) {
        setOrder(response.data);
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
      } else {
        throw new Error(response?.message || "Failed to cancel order");
      }
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
      <View style={styles.orderHeaderRow}>
        <View style={styles.orderIdWrap}>
          <MaterialIcons name="receipt" size={16} color="#8a1d1d" />
        </View>
        <ThemedText type="defaultSemiBold2" style={styles.orderIdText} numberOfLines={1} ellipsizeMode="tail">
          {order.id}
        </ThemedText>
      </View>

      <View style={styles.statusRow}>
        <StatusBadge status={order.status} />
        <ThemedText
          type="default"
          lightColor="#6b6b6b"
          style={{ marginLeft: 12 }}
        >
          {new Date(order.created_at).toLocaleDateString()}
        </ThemedText>
      </View>

      <FlatList
        data={order.items}
        keyExtractor={(i) => i.id}
        style={{ marginTop: 12 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <OrderItem
            id={item.id}
            title={item.product_name || item.title}
            price={item.unit_price || item.price}
            quantity={item.quantity}
            image={item.images_urls?.[0] || item.image}
          />
        )}
        ListFooterComponent={() => (
          <View>
            <OrderSummary
              subtotal={order.total}
              tax={tax}
              total={total}
              showShipping={false}
            />

            {order.status && order.status.toString().toLowerCase().includes("waiting_retailer") && (
              <View style={{ flexDirection: "row", marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.reorderBtn, { flex: 1, marginRight: 8, backgroundColor: "#0b67c2", opacity: isConfirming ? 0.6 : 1 }]}
                  onPress={confirmOrder}
                  disabled={isConfirming}
                >
                  <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                    {isConfirming ? "Confirming..." : "Confirm Order"}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reorderBtn, { flex: 1, marginLeft: 8, backgroundColor: "#8a1d1d", opacity: isCancelling ? 0.6 : 1 }]}
                  onPress={() => setShowCancelModal(true)}
                  disabled={isCancelling}
                >
                  <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                    Cancel Order
                  </ThemedText>
                </TouchableOpacity>
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
          okColor="#0b67c2"
          onClose={() => {
            if (alertOnClose) alertOnClose();
            setAlertVisible(false);
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
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
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
  orderHeaderRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
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
  orderIdText: { marginLeft: 12 },
});
