import React, { useEffect, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { useCart } from "@/components/cart-context";
import { useSdk } from "@/lib/sdk/context";
import { marketCreateOrder } from "@/lib/api/clients";

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

  const getRawUnitId = (item: any) =>
    item.unit_id ??
    item.unitId ??
    item.raw?.unit_id ??
    item.raw?.unit?.id ??
    item.raw?.product?.unit_id ??
    item.raw?.product?.unit?.id;

  const isDirectListingItem = (item: any) => Boolean(getRawListingId(item));

  const getOrderRecipientId = (item: any) =>
    item.ordered_to_id ??
    item.orderedToId ??
    item.ordered_to ??
    item.raw?.ordered_to_id ??
    item.raw?.ordered_to ??
    item.raw?.supplier_id ??
    item.raw?.seller_id ??
    item.raw?.supplier?.id ??
    item.raw?.seller?.id ??
    item.raw?.supplier_product?.supplier_id ??
    item.raw?.supplier_product?.supplier?.id ??
    item.raw?.product?.supplier_id ??
    item.raw?.product?.supplier?.id ??
    item.raw?.user_id;

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

      const firstItem: any = items[0];
      const listingId = getRawListingId(firstItem);
      const isDirectListing =
        items.length === 1 && isDirectListingItem(firstItem);

      const orderBase: any = {
        user_id: user.id,
        ordered_by_id: user.id,
        status: "pending",
        fulfillment_type: "delivery", // since they went through checkout!
        payment_method: "cash",
      };

      if (params.addressId) {
        orderBase.dropoff_address_id = parseInt(String(params.addressId));
      }

      const it = firstItem as any;
      let orderRecipientId = getOrderRecipientId(it);

      // Check if it's an aggregator listing
      const isAggregator =
        it.raw?.aggregator_id !== undefined ||
        it.raw?.aggregator !== undefined;

      // If it's an aggregator item but missing an explicit recipient, set a default placeholder
      if (isAggregator && !orderRecipientId) {
        orderRecipientId =
          it.raw?.aggregator_id ?? it.raw?.aggregator?.id ?? 1;
      }

      if (!isDirectListing && !isAggregator) {
        throw new Error(
          "Unable to create order: only direct marketplace listings or aggregator listings are supported.",
        );
      }

      const orderPayload: any = isAggregator
        ? {
            ...orderBase,
            order_type: "direct_listing",
            ordered_to_id:
              it.raw?.aggregator_id ??
              it.raw?.aggregator?.id ??
              orderRecipientId,
            order_items_attributes: items.map((cartItem: any) => {
              const itemListingId = getRawListingId(cartItem);
              return {
                quantity: cartItem.quantity ?? cartItem.raw?.quantity ?? 1,
                source_id: parseInt(String(itemListingId)) || itemListingId,
                source_type: "Dscf::Marketplace::AggregatorListing",
              };
            }),
          }
        : {
            ...orderBase,
            listing_id: parseInt(String(listingId)) || listingId,
            ordered_to_id: orderRecipientId,
            order_type: "direct_listing",
            order_items_attributes: items.map((cartItem: any) => ({
              quantity: cartItem.quantity ?? cartItem.raw?.quantity ?? 1,
            })),
          };

      console.log(
        "[PaymentScreen] orderPayload",
        JSON.stringify(orderPayload, null, 2),
      );
      // Call backend to create order
      const response = await marketCreateOrder(orderPayload);

      if (response?.success && response?.data) {
        const createdOrder = response.data;
        console.log(
          "[PaymentScreen] Order created successfully",
          createdOrder.id,
        );

        // Clear cart after successful order creation
        clear();

        // Navigate to the created order's detail page
        router.push(`/orders/${createdOrder.id}`);
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
