import React from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { PageShell } from "@/components/page-shell";
import { OrderItem } from "@/components/order-item";
import { OrderSummary } from "@/components/order-summary";
import { StatusBadge } from "@/components/status-badge";
import { ThemedText } from "@/components/themed-text";
import { useCart } from "@/components/cart-context";
import { ORDERS } from "@/data/orders";

export const options = { headerShown: false };

export default function OrderDetails() {
  const params = useLocalSearchParams();
  const { id } = params as { id: string };
  const router = useRouter();
  const { addItem } = useCart();

  const order = ORDERS.find((o) => o.id === id) ?? ORDERS[0];

  const tax = +(order.total * 0.08).toFixed(2);
  const total = +(order.total + tax).toFixed(2);

  const onReorder = () => {
    order.items.forEach((it: any) =>
      addItem({
        id: it.id + "-r",
        title: it.title,
        price: it.price,
        subtitle: "",
        image: it.image,
      }),
    );
    router.push("/cart");
  };

  return (
    <PageShell title={`Order #${order.id}`} showBackButton>
      <View style={styles.statusRow}>
        <StatusBadge status={order.status} />
        <ThemedText
          type="default"
          lightColor="#6b6b6b"
          style={{ marginLeft: 12 }}
        >
          {order.date}
        </ThemedText>
      </View>

      <FlatList
        data={order.items}
        keyExtractor={(i) => i.id}
        style={{ marginTop: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <OrderItem
            id={item.id}
            title={item.title}
            price={item.price}
            quantity={1}
            image={item.image}
          />
        )}
      />

      <OrderSummary
        subtotal={order.total}
        tax={tax}
        total={total}
        showShipping={false}
      />

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
});
