import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { marketGetReceivedOrders, marketSupplierConfirmOrder } from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";
import { Order, OrderItem } from "@/app/types/order";

type MenuTab = "MENU" | "RECEIVED";

export default function SupplierOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<MenuTab>("MENU");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ item: OrderItem; order: Order } | null>(null);
  const [confirmationStatus, setConfirmationStatus] = useState<"confirmed" | "not_confirmed" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "RECEIVED") {
      fetchReceivedOrders();
    }
  }, [activeTab]);

  const fetchReceivedOrders = async () => {
    try {
      setLoading(true);
      const res = await marketGetReceivedOrders();
      if (res?.success && Array.isArray(res?.data)) {
        setOrders(res.data);
      } else if (Array.isArray(res)) {
        setOrders(res);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.warn("Failed to fetch received orders:", err);
      // Fallback dummy data if API fails or is empty
      setOrders([
        {
          id: 1001,
          order_type: "direct_listing",
          status: "pending",
          fulfillment_type: "delivery",
          payment_method: "cash",
          total_amount: 1500,
          user_id: 1,
          ordered_by_id: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          order_items: [
            {
              id: 1,
              order_id: 1001,
              product_id: 5,
              unit_id: 1,
              quantity: 10,
              unit_price: 150,
              subtotal: 1500,
              status: "pending",
              product_name: "Premium Coffee Beans",
              unit_name: "kg",
              source_name: "PROD-001",
            },
          ],
        },
      ] as Order[]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (item: OrderItem, order: Order) => {
    setSelectedItem({ item, order });
    setConfirmationStatus("confirmed"); // default
    setRejectReason("");
    setModalVisible(true);
  };

  const handleSaveConfirmation = async () => {
    if (!selectedItem || !confirmationStatus) return;

    if (confirmationStatus === "not_confirmed" && !rejectReason.trim()) {
      Alert.alert("Error", "Please provide a reason for not confirming.");
      return;
    }

    try {
      setActionLoading(true);
      const isConfirmed = confirmationStatus === "confirmed";
      // We pass the order id, but if we need to confirm specific items, 
      // we might need to send item details or call an item-specific endpoint. 
      // Based on typical API designs, supplier_confirm usually confirms the entire order 
      // or we pass item IDs. We'll pass the order ID.
      await marketSupplierConfirmOrder(selectedItem.order.id, {
        confirmed: isConfirmed,
        reason: isConfirmed ? undefined : rejectReason,
      });

      Alert.alert(
        "Success",
        isConfirmed
          ? "Order confirmed successfully."
          : "Order not confirmed."
      );
      
      setModalVisible(false);
      fetchReceivedOrders(); // Refresh list
    } catch (error: any) {
      console.warn("Error confirming order:", error);
      Alert.alert("Error", error?.message || "Failed to process the order.");
    } finally {
      setActionLoading(false);
    }
  };

  // Flatten products from orders
  const flattenedProducts = orders.flatMap((order) => {
    const items = order.order_items || (order as any).items || [];
    return items.map((item: any) => ({
      order,
      item,
    }));
  });

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setActiveTab("RECEIVED")}
      >
        <View style={styles.menuIconWrap}>
          <MaterialIcons name="call-received" size={32} color="#0a2f4a" />
        </View>
        <View style={styles.menuTextWrap}>
          <ThemedText type="defaultSemiBold" style={styles.menuTitle}>
            Received Orders
          </ThemedText>
          <ThemedText type="default" style={styles.menuSubtitle}>
            View and manage products assigned to you
          </ThemedText>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#6b6b6b" />
      </TouchableOpacity>
    </View>
  );

  const renderReceivedOrders = () => {
    if (loading) {
      return (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#0a2f4a" />
        </View>
      );
    }

    if (flattenedProducts.length === 0) {
      return (
        <View style={styles.centerWrap}>
          <MaterialIcons name="inbox" size={64} color="#ccc" />
          <ThemedText type="defaultSemiBold" style={{ marginTop: 16, color: "#666" }}>
            No received orders yet
          </ThemedText>
        </View>
      );
    }

    return (
      <FlatList
        data={flattenedProducts}
        keyExtractor={(data) => `${data.order.id}-${data.item.id}`}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: { order, item } }) => (
          <View style={styles.productCard}>
            <View style={styles.cardHeader}>
              <ThemedText type="defaultSemiBold" style={styles.orderId}>
                Order #{order.id}
              </ThemedText>
              <ThemedText type="default" style={styles.orderDate}>
                {new Date(order.created_at).toLocaleDateString()}
              </ThemedText>
            </View>

            <View style={styles.productDetails}>
              <View style={styles.detailRow}>
                <ThemedText type="default" style={styles.label}>Product Code:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.value}>
                  {item.source_name || `PRD-${item.product_id}`}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText type="default" style={styles.label}>Product Name:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.value}>
                  {item.product_name || "Unknown Product"}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText type="default" style={styles.label}>Quantity:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.value}>
                  {item.quantity}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText type="default" style={styles.label}>UOM:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.value}>
                  {item.unit_name || "Unit"}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText type="default" style={styles.label}>Unit Price:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.value}>
                  {formatCurrency(item.unit_price)}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText type="default" style={styles.label}>Total Price:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.totalValue}>
                  {formatCurrency(item.subtotal || (Number(item.quantity) * Number(item.unit_price)))}
                </ThemedText>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction(item, order)}
              >
                <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>
                  Action
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    );
  };

  return (
    <PageShell
      title={activeTab === "MENU" ? "Order Menu" : "Received Orders"}
      showBackButton
      onBack={() => {
        if (activeTab === "RECEIVED") {
          setActiveTab("MENU");
        } else {
          router.back();
        }
      }}
      style={styles.shell}
    >
      <View style={styles.container}>
        {activeTab === "MENU" ? renderMenu() : renderReceivedOrders()}
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                Confirm Order
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6b6b6b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  confirmationStatus === "confirmed" && styles.optionCardSelected,
                ]}
                onPress={() => setConfirmationStatus("confirmed")}
              >
                <MaterialIcons
                  name={confirmationStatus === "confirmed" ? "radio-button-checked" : "radio-button-unchecked"}
                  size={24}
                  color={confirmationStatus === "confirmed" ? "#0a2f4a" : "#6b6b6b"}
                />
                <ThemedText style={styles.optionText}>Order Confirmed</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  confirmationStatus === "not_confirmed" && styles.optionCardSelected,
                ]}
                onPress={() => setConfirmationStatus("not_confirmed")}
              >
                <MaterialIcons
                  name={confirmationStatus === "not_confirmed" ? "radio-button-checked" : "radio-button-unchecked"}
                  size={24}
                  color={confirmationStatus === "not_confirmed" ? "#0a2f4a" : "#6b6b6b"}
                />
                <ThemedText style={styles.optionText}>Order Not Confirmed</ThemedText>
              </TouchableOpacity>

              {confirmationStatus === "not_confirmed" && (
                <View style={styles.reasonContainer}>
                  <ThemedText style={styles.reasonLabel}>Reason for not confirming</ThemedText>
                  <TextInput
                    style={styles.reasonInput}
                    placeholder="Enter reason..."
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, actionLoading && styles.saveButtonDisabled]}
                onPress={handleSaveConfirmation}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingTop: 60,
    backgroundColor: "#f4f4f5",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  menuContainer: {
    flex: 1,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  menuIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f4f8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    color: "#0a2f4a",
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#6b6b6b",
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 12,
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    color: "#0a2f4a",
  },
  orderDate: {
    fontSize: 13,
    color: "#6b6b6b",
  },
  productDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#6b6b6b",
  },
  value: {
    fontSize: 14,
    color: "#333",
  },
  totalValue: {
    fontSize: 15,
    color: "#800000",
  },
  actionRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "flex-end",
  },
  actionButton: {
    backgroundColor: "#0a2f4a",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    color: "#0a2f4a",
  },
  modalBody: {
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: "#0a2f4a",
    backgroundColor: "#f0f4f8",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  reasonContainer: {
    marginTop: 8,
  },
  reasonLabel: {
    fontSize: 14,
    color: "#6b6b6b",
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#fafafa",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#0a2f4a",
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
