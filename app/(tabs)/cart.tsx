import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

import { useCart } from "@/components/cart-context";
import { CartItem } from "@/components/cart-item";
import OrderPlacedModal from "@/components/order-placed-modal";
import { OrderSummary } from "@/components/order-summary";
import { PageShell } from "@/components/page-shell";
import SimpleAlertModal from "@/components/simple-alert-modal";
import { ThemedText } from "@/components/themed-text";
import { marketCreateOrder } from "@/lib/api/clients";
import { useSdk } from "@/lib/sdk/context";

export default function CartScreen() {
  const { items, count, subtotal, updateQuantity, removeItem, clear } =
    useCart();
  const router = useRouter();
  const { user } = useSdk();
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [showPlacedModal, setShowPlacedModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      console.log("[CartScreen] loaded", { count, subtotal });
    } catch (e) {}
  }, [count, subtotal]);

  const total = subtotal;

  const getRawListingId = (item: any) =>
    item.listing_id ??
    item.listingId ??
    item.listing?.id ??
    item.raw?.listing_id ??
    item.raw?.listing?.id ??
    item.raw?.source_id ??
    item.raw?.id;

  const placeOrder = async () => {
    if (!items || items.length === 0) {
      Alert.alert(
        "Cart is empty",
        "Add items to your cart before placing an order.",
      );
      return;
    }

    if (!user?.id) {
      Alert.alert(
        "Unable to place order",
        "User information is not available. Please sign in again.",
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log("[Cart] Creating order via backend...", {
        itemCount: items.length,
        subtotal,
        userId: user.id,
      });

      // Build order payload following the one-request requirement
      const orderPayload: any = {
        order_type: "direct_listing",
        status: "pending",
        fulfillment_type: "self_pickup",
        payment_method: "cash",
        user_id: user.id,
        ordered_by_id: user.id,
      };

      // Build order_items_attributes from entire cart
      orderPayload.order_items_attributes = items.map((item: any) => {
        const itemListingId = getRawListingId(item);
        return {
          quantity: item.quantity ?? item.raw?.quantity ?? 1,
          source_id: parseInt(String(itemListingId)) || itemListingId,
          source_type: "Dscf::Marketplace::AggregatorListing",
        };
      });

      // Optional: set ordered_to_id to the aggregator (backend derives it if omitted)
      const firstItem: any = items[0];
      const aggregatorId =
        firstItem.raw?.aggregator_id ?? firstItem.raw?.aggregator?.id;
      if (aggregatorId) {
        orderPayload.ordered_to_id = aggregatorId;
      }

      console.log(
        "[Cart] orderPayload",
        JSON.stringify(orderPayload, null, 2),
      );

      // ONE request per checkout — all cart items in one payload
      const response = await marketCreateOrder(orderPayload);

      if (response?.success && response?.data) {
        // Handle single order OR array of orders (multi-aggregator split)
        const orders = Array.isArray(response.data)
          ? response.data
          : [response.data];

        console.log(
          "[Cart] Order(s) created successfully",
          orders.map((o: any) => o.id),
        );

        const combinedOrder = {
          id: orders.map((o) => o.id).join(","),
          total_amount: total,
          expected_delivery:
            orders[0]?.expected_delivery || new Date().toLocaleDateString(),
          created_at: orders[0]?.created_at || new Date().toISOString(),
        };

        // Clear cart after successful order creation
        setTimeout(() => clear(), 100);

        // Store order and show success modal
        setPlacedOrder(combinedOrder);
        setShowPlacedModal(true);

        // Notify user if cart was split across aggregators
        if (orders.length > 1) {
          console.log(
            `[Cart] Cart split into ${orders.length} orders across aggregators`,
          );
        }
      } else {
        const errorMsg =
          response?.errors ||
          response?.error ||
          response?.message ||
          "Failed to create order";
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.warn("[Cart] Failed to place order", err?.message || err);
      const errorMsg =
        err?.message || "Could not place order. Please try again.";
      setAlertMessage(errorMsg);
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <PageShell
        title="Your Cart"
        compactHeader
        rightNode={
          <View style={styles.countPill}>
            <ThemedText type="defaultSemiBold">{count} items</ThemedText>
          </View>
        }
      >
        {items.length === 0 ? (
          <ThemedText type="default" style={{ marginTop: 12 }}>
            Your cart is empty.
          </ThemedText>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            style={{ marginTop: 12 }}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <CartItem
                id={item.id}
                title={item.title}
                subtitle={item.subtitle}
                price={item.price}
                quantity={item.quantity}
                image={item.image}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            )}
            ListFooterComponent={() => (
              <View style={styles.summaryContainer}>
                <OrderSummary subtotal={subtotal} total={total} />

                <TouchableOpacity
                  style={styles.checkoutBtn}
                  accessibilityLabel="Place Order"
                  onPress={placeOrder}
                >
                  <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                    Order Now
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </PageShell>

      <OrderPlacedModal
        visible={showPlacedModal}
        order={placedOrder}
        onClose={() => {
          setShowPlacedModal(false);
          router.push("/(tabs)");
        }}
        onViewOrder={(id: string) => {
          setShowPlacedModal(false);
          // Pass the literal ID (e.g. 90,91,92) directly without router-level encoding conflicts
          router.push(`/orders/${encodeURIComponent(id)}`);
        }}
      />

      <SimpleAlertModal
        visible={alertVisible}
        title="Order Failed"
        message={alertMessage}
        okColor="#8a1d1d"
        onClose={() => setAlertVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countPill: {
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 10,
    paddingVertical: -10,
    borderRadius: 14,
  },
  summaryContainer: {
    marginTop: 16,
    marginBottom: -80,
  },
  checkoutBtn: {
    marginTop: 12,
    backgroundColor: "#8a1d1d",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 55,
  },
});
