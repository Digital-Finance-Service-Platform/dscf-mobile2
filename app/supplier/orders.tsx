import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageShell } from "@/components/page-shell";
import { SupplierEmptyState } from "@/components/supplier/supplier-empty-state";
import { SupplierNavCard } from "@/components/supplier/supplier-nav-card";
import { ThemedText } from "@/components/themed-text";
import { Order, OrderItem } from "@/app/types/order";
import { useSupplierMenuItems } from "@/hooks/use-supplier-menu";
import { marketGetReceivedOrders, marketSupplierConfirmOrder } from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";
import { supplierTheme } from "@/lib/supplier-theme";

type MenuTab = "MENU" | "RECEIVED";

export default function SupplierOrdersScreen() {
  const supplierMenuItems = useSupplierMenuItems();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<MenuTab>("MENU");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ item: OrderItem; order: Order } | null>(
    null,
  );
  const [confirmationStatus, setConfirmationStatus] = useState<"confirmed" | "not_confirmed" | null>(
    null,
  );
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
      setError(null);
      const res = await marketGetReceivedOrders();
      if (res?.success && Array.isArray(res?.data)) {
        setOrders(res.data);
      } else if (Array.isArray(res)) {
        setOrders(res);
      } else if (Array.isArray(res?.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load received orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (item: OrderItem, order: Order) => {
    setSelectedItem({ item, order });
    setConfirmationStatus("confirmed");
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
      await marketSupplierConfirmOrder(selectedItem.order.id, {
        confirmed: isConfirmed,
        reason: isConfirmed ? undefined : rejectReason,
      });

      Alert.alert(
        "Success",
        isConfirmed ? "Order confirmed successfully." : "Order not confirmed.",
      );

      setModalVisible(false);
      fetchReceivedOrders();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to process the order.");
    } finally {
      setActionLoading(false);
    }
  };

  const flattenedProducts = orders.flatMap((order) => {
    const items = order.order_items || (order as any).items || [];
    return items.map((item: OrderItem) => ({ order, item }));
  });

  const handleBackPress = () => {
    if (activeTab === "RECEIVED") {
      setActiveTab("MENU");
      return;
    }
  };

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <ThemedText type="default" style={styles.menuIntro}>
        Manage incoming orders assigned to your supplier account.
      </ThemedText>
      <SupplierNavCard
        icon="call-received"
        title="Received Orders"
        subtitle="View and manage products assigned to you"
        badge={flattenedProducts.length || undefined}
        onPress={() => setActiveTab("RECEIVED")}
      />
    </View>
  );

  const renderReceivedOrders = () => {
    if (loading) {
      return (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={supplierTheme.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerWrap}>
          <MaterialIcons name="error-outline" size={40} color={supplierTheme.error} />
          <ThemedText type="default" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable onPress={fetchReceivedOrders} style={styles.retryButton}>
            <ThemedText type="defaultSemiBold" style={styles.retryText}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    if (flattenedProducts.length === 0) {
      return (
        <SupplierEmptyState
          icon="inbox"
          title="No received orders"
          message="When retailers place orders with your products, they will appear here."
        />
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
              <View style={styles.orderIdWrap}>
                <MaterialIcons name="receipt-long" size={18} color={supplierTheme.primary} />
                <ThemedText type="defaultSemiBold" style={styles.orderId}>
                  Order #{order.id}
                </ThemedText>
              </View>
              <ThemedText type="default" style={styles.orderDate}>
                {new Date(order.created_at).toLocaleDateString()}
              </ThemedText>
            </View>

            <View style={styles.productDetails}>
              <DetailRow
                icon="tag"
                label="Product Code"
                value={item.source_name || `PRD-${item.product_id}`}
              />
              <DetailRow
                icon="inventory"
                label="Product Name"
                value={item.product_name || "Unknown Product"}
              />
              <DetailRow icon="format-list-numbered" label="Quantity" value={String(item.quantity)} />
              <DetailRow icon="straighten" label="UOM" value={item.unit_name || "Unit"} />
              <DetailRow
                icon="payments"
                label="Unit Price"
                value={formatCurrency(item.unit_price ?? 0)}
              />
              <DetailRow
                icon="account-balance-wallet"
                label="Total Price"
                value={formatCurrency(
                  item.subtotal || Number(item.quantity) * Number(item.unit_price ?? 0),
                )}
                highlight
              />
            </View>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.actionButton}
                onPress={() => handleAction(item, order)}
              >
                <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>
                  Action
                </ThemedText>
              </Pressable>
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
      useBackIcon={activeTab === "RECEIVED"}
      onBackPress={activeTab === "RECEIVED" ? handleBackPress : undefined}
      headerVariant="retailer"
      menuItems={supplierMenuItems}
      style={styles.shell}
    >
      <View style={styles.container}>
        {activeTab === "MENU" ? renderMenu() : renderReceivedOrders()}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                Confirm Order
              </ThemedText>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={supplierTheme.textMuted} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Pressable
                style={[
                  styles.optionCard,
                  confirmationStatus === "confirmed" && styles.optionCardSelected,
                ]}
                onPress={() => setConfirmationStatus("confirmed")}
              >
                <MaterialIcons
                  name={
                    confirmationStatus === "confirmed"
                      ? "radio-button-checked"
                      : "radio-button-unchecked"
                  }
                  size={24}
                  color={
                    confirmationStatus === "confirmed"
                      ? supplierTheme.primary
                      : supplierTheme.textMuted
                  }
                />
                <ThemedText style={styles.optionText}>Order Confirmed</ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.optionCard,
                  confirmationStatus === "not_confirmed" && styles.optionCardSelected,
                ]}
                onPress={() => setConfirmationStatus("not_confirmed")}
              >
                <MaterialIcons
                  name={
                    confirmationStatus === "not_confirmed"
                      ? "radio-button-checked"
                      : "radio-button-unchecked"
                  }
                  size={24}
                  color={
                    confirmationStatus === "not_confirmed"
                      ? supplierTheme.primary
                      : supplierTheme.textMuted
                  }
                />
                <ThemedText style={styles.optionText}>Order Not Confirmed</ThemedText>
              </Pressable>

              {confirmationStatus === "not_confirmed" ? (
                <View style={styles.reasonContainer}>
                  <ThemedText style={styles.reasonLabel}>Reason for not confirming</ThemedText>
                  <TextInput
                    style={styles.reasonInput}
                    placeholder="Enter reason..."
                    placeholderTextColor="#8a8a8a"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.modalFooter}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.saveButton, actionLoading && styles.saveButtonDisabled]}
                onPress={handleSaveConfirmation}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </PageShell>
  );
}

function DetailRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.detailRow, highlight && styles.totalRow]}>
      <View style={styles.detailItem}>
        <MaterialIcons
          name={icon}
          size={14}
          color={highlight ? supplierTheme.accent : supplierTheme.textMuted}
        />
        <ThemedText type="default" style={[styles.label, highlight && styles.totalLabel]}>
          {label}
        </ThemedText>
      </View>
      <ThemedText
        type="defaultSemiBold"
        style={[styles.value, highlight && styles.totalValue]}
      >
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingTop: 60,
    backgroundColor: supplierTheme.background,
  },
  container: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  menuContainer: {
    flex: 1,
    gap: 16,
  },
  menuIntro: {
    color: supplierTheme.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  productCard: {
    backgroundColor: supplierTheme.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: supplierTheme.border,
    ...supplierTheme.cardShadow,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: supplierTheme.border,
    paddingBottom: 14,
    marginBottom: 14,
  },
  orderIdWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderId: {
    fontSize: 17,
    color: supplierTheme.primary,
    fontWeight: "600",
  },
  orderDate: {
    fontSize: 13,
    color: supplierTheme.textMuted,
  },
  productDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: supplierTheme.textMuted,
  },
  value: {
    fontSize: 14,
    color: supplierTheme.text,
    fontWeight: "500",
    textAlign: "right",
    flexShrink: 1,
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 0, 0, 0.12)",
  },
  totalLabel: {
    color: supplierTheme.accent,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 17,
    color: supplierTheme.accent,
    fontWeight: "700",
  },
  actionRow: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: supplierTheme.border,
    alignItems: "flex-end",
  },
  actionButton: {
    backgroundColor: supplierTheme.primaryDark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: { color: supplierTheme.error, textAlign: "center" },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: supplierTheme.primary,
    borderRadius: 12,
  },
  retryText: { color: "#fff" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: supplierTheme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 320,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    color: supplierTheme.primary,
    fontWeight: "700",
  },
  modalBody: {
    marginBottom: 28,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: supplierTheme.border,
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: supplierTheme.primary,
    backgroundColor: supplierTheme.iconBg,
  },
  optionText: {
    fontSize: 16,
    color: supplierTheme.text,
    marginLeft: 12,
  },
  reasonContainer: {
    marginTop: 12,
  },
  reasonLabel: {
    fontSize: 14,
    color: supplierTheme.textMuted,
    marginBottom: 8,
    fontWeight: "500",
  },
  reasonInput: {
    borderWidth: 1.5,
    borderColor: supplierTheme.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: supplierTheme.text,
    backgroundColor: supplierTheme.background,
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
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: supplierTheme.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: supplierTheme.textMuted,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: supplierTheme.primaryDark,
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
