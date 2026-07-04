import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

import { useCart } from "@/components/cart-context";
import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { marketCreateOrder } from "@/lib/api/clients";
import { useSdk } from "@/lib/sdk/context";

export const options = { headerShown: false };

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as {
    addressId?: string;
    name?: string;
    phone?: string;
    region?: string;
    subCity?: string;
    address?: string;
  };
  const { items, subtotal, clear } = useCart();
  const { user } = useSdk();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      console.log("[PaymentScreen] loaded with params", {
        items: items.length,
        subtotal,
        params,
      });
    } catch (e) {}
  }, []);

  const getRawListingId = (item: any) =>
    item.listing_id ??
    item.listingId ??
    item.listing?.id ??
    item.raw?.listing_id ??
    item.raw?.listing?.id ??
    item.raw?.id;

  const placeOrder = async () => {
    try {
      console.log("[PaymentScreen] placeOrder pressed", {
        items: items.length,
        subtotal,
      });
    } catch (e) {}

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
      console.log("[PaymentScreen] Creating order via backend...", {
        itemCount: items.length,
        subtotal,
        userId: user.id,
        addressId: params.addressId,
      });

      // Build base order payload
      const orderPayload: any = {
        order_type: "direct_listing",
        status: "pending",
        fulfillment_type: "delivery",
        payment_method: "cash",
        user_id: user.id,
        ordered_by_id: user.id,
      };

      // Add dropoff_address_id only for delivery
      if (params.addressId) {
        orderPayload.dropoff_address_id = parseInt(String(params.addressId));
      }

      // Build order_items_attributes from entire cart
      orderPayload.order_items_attributes = items.map((cartItem: any) => {
        const itemListingId = getRawListingId(cartItem);
        return {
          quantity: cartItem.quantity ?? cartItem.raw?.quantity ?? 1,
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
        "[PaymentScreen] orderPayload",
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
          "[PaymentScreen] Order(s) created successfully",
          orders.map((o: any) => o.id),
        );

        // Clear cart after successful order creation
        clear();

        // Navigate to first order (or show split summary if multiple)
        if (orders.length === 1) {
          router.push(`/orders/${orders[0].id}`);
        } else {
          // Multi-aggregator split — navigate to first and optionally show notification
          console.log(
            `[PaymentScreen] Cart split into ${orders.length} orders across aggregators`,
          );
          router.push(`/orders/${orders[0].id}`);
          Alert.alert(
            "Orders Created",
            `Your cart was split into ${orders.length} orders across different suppliers.`,
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
      console.warn("[PaymentScreen] Failed to place order", err?.message || err);
      const errorMsg =
        err?.message || "Could not place order. Please try again.";
      Alert.alert("Order Failed", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell title="Payment" showBackButton>
      <View style={styles.center}>
        <ThemedText type="title">Payment Step</ThemedText>
        <ThemedText
          type="default"
          lightColor="#6b6b6b"
          style={{ marginTop: 8, textAlign: "center", paddingHorizontal: 24 }}
        >
          Verify details and place your order using Cash on Delivery.
        </ThemedText>

        <TouchableOpacity
          style={[styles.placeBtn, isLoading && { opacity: 0.6 }]}
          onPress={placeOrder}
          disabled={isLoading}
          accessibilityLabel="Place order"
        >
          <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
            {isLoading ? "Placing Order..." : "Place Order (Cash on Delivery)"}
          </ThemedText>
        </TouchableOpacity>
      </View>
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
  headerTitle: { fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeBtn: {
    marginTop: 20,
    backgroundColor: "#8a1d1d",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
});
