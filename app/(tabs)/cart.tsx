import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { CartItem } from "@/components/cart-item";
import { OrderSummary } from "@/components/order-summary";
import { useCart } from "@/components/cart-context";
import { addOrder } from "@/data/orders";
import OrderPlacedModal from "@/components/order-placed-modal";
import { marketCreateOrder } from "@/lib/api/clients";
import { useSdk } from "@/lib/sdk/context";
import SimpleAlertModal from "@/components/simple-alert-modal";

export default function CartScreen() {
  const { items, count, subtotal, updateQuantity, removeItem, clear } =
    useCart();
  const router = useRouter();
  const [showPlacedModal, setShowPlacedModal] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      console.log("[CartScreen] loaded", { count, subtotal });
    } catch (e) {}
  }, [count, subtotal]);

  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const { user } = useSdk();

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

      const firstItem: any = items[0];
      const listingId = getRawListingId(firstItem);
      const isDirectListing = items.length === 1 && isDirectListingItem(firstItem);

      console.log("[Cart] firstItem metadata", {
        firstItem,
        listingId,
        isDirectListing,
      });

      const orderBase: any = {
        user_id: user.id,
        ordered_by_id: user.id,
        status: "pending",
        fulfillment_type: "self_pickup",
        payment_method: "cash",
        dropoff_address_id: 13, // Default mock address based on instructions
      };

      const it = firstItem as any;
      let orderRecipientId = getOrderRecipientId(it);

      // Check if it's an aggregator listing
      const isAggregator = it.raw?.aggregator_id !== undefined || it.raw?.aggregator !== undefined;

      // If it's an aggregator item but missing an explicit recipient, set a default placeholder
      // (the backend will typically override or map this internally based on the source_type)
      if (isAggregator && !orderRecipientId) {
        orderRecipientId = it.raw?.aggregator_id ?? it.raw?.aggregator?.id ?? 1; // Default to 1 if entirely missing
      }

      if (!isDirectListing && !isAggregator) {
        throw new Error(
          "Unable to create order: only direct marketplace listings or aggregator listings are supported.",
        );
      }

      const orderPayload: any = isAggregator 
        ? {
            ...orderBase,
            order_type: "direct_listing", // Must be direct_listing, backend routes based on source_type
            ordered_to_id: it.raw?.aggregator_id ?? it.raw?.aggregator?.id ?? orderRecipientId,
            order_items_attributes: items.map((cartItem: any) => {
              const itemListingId = getRawListingId(cartItem);
              return {
                quantity: cartItem.quantity ?? cartItem.raw?.quantity ?? 1,
                source_id: parseInt(String(itemListingId)) || itemListingId,
                source_type: "Dscf::Marketplace::AggregatorListing"
              };
            })
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

      console.log("[Cart] orderPayload", JSON.stringify(orderPayload, null, 2));
      // Call backend to create order
      const response = await marketCreateOrder(orderPayload);

      if (response?.success && response?.data) {
        const createdOrder = response.data;
        console.log("[Cart] Order created successfully", createdOrder.id);

        // Clear cart after successful order creation
        clear();

        // Store order and show success modal
        setPlacedOrder(createdOrder);
        setShowPlacedModal(true);
      } else {
        const errorMsg =
          response?.errors || response?.error || response?.message || "Failed to create order";
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
                <OrderSummary subtotal={subtotal} tax={tax} total={total} />

                <TouchableOpacity
                  style={[styles.checkoutBtn, isLoading && { opacity: 0.6 }]}
                  accessibilityLabel="Order Now"
                  onPress={placeOrder}
                  disabled={isLoading}
                >
                  <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                    {isLoading ? "Processing..." : "Order Now"}
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
        onClose={() => setShowPlacedModal(false)}
        onViewOrder={(id: string) => {
          setShowPlacedModal(false);
          router.push(`/orders/${id}`);
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
