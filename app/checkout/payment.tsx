import React, { useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { useCart } from "@/components/cart-context";
import { addOrder } from "@/data/orders";

export const options = { headerShown: false };

export default function PaymentScreen() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();

  useEffect(() => {
    try {
      console.log("[PaymentScreen] loaded", { items: items.length, subtotal });
    } catch (e) {}
  }, []);

  const placeOrder = () => {
    try {
      console.log("[PaymentScreen] placeOrder pressed", { items: items.length, subtotal });
    } catch (e) {}
    if (!items || items.length === 0) {
      Alert.alert("Cart is empty", "Add items to your cart before placing an order.");
      return;
    }

    const newOrder = {
      id: `ORD-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      status: "VALIDATING",
      items: items.map((it: any) => ({
        id: it.id,
        title: it.title,
        price: it.price,
        quantity: it.quantity ?? 1,
        image: it.image,
      })),
      total: subtotal,
    };

    try {
      addOrder(newOrder);
      clear();
      // Navigate to the created order's detail page
      router.push(`/orders/${newOrder.id}`);
    } catch (err) {
      console.warn("Failed to create local order", err);
      Alert.alert("Error", "Could not place order. Please try again.");
    }
  };

  return (
    <PageShell title="Payment" showBackButton>
      <View style={styles.center}>
        <ThemedText type="title">Payment step</ThemedText>
        <ThemedText type="default" lightColor="#6b6b6b" style={{ marginTop: 8 }}>
          Placeholder screen — implement payment gateway here.
        </ThemedText>

        <TouchableOpacity style={styles.placeBtn} onPress={placeOrder} accessibilityLabel="Place order">
          <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
            Place Order
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
});
