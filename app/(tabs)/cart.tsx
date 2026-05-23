import React from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { CartItem } from "@/components/cart-item";
import { OrderSummary } from "@/components/order-summary";
import { useCart } from "@/components/cart-context";

export default function CartScreen() {
  const { items, count, subtotal, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  return (
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
              <OrderSummary
                subtotal={subtotal}
                tax={tax}
                total={total}
              />

              <TouchableOpacity
                style={styles.checkoutBtn}
                accessibilityLabel="Proceed to checkout"
                onPress={() => router.push("/checkout")}
              >
                <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                  Proceed to Checkout →
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
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
  },
});
