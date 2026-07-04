import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { marketConfirmAgentOrder, marketCreateOrder, marketResendAgentOrderOtp } from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";
import { useSdk } from "@/lib/sdk/context";

type CartItem = {
  id: string;
  title: string;
  category: string;
  price: number;
  quantity: number;
  image: any;
  listing_id?: number;
  product_id?: number;
  unit_id?: number;
  ordered_to_id?: number;
  raw?: any;
};

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useSdk();

  const retailerId = params.retailerId as string;
  const retailerName = params.retailerName as string;
  const retailerPhone = params.retailerPhone as string;
  const cartData = params.cartData as string;
  const total = parseFloat(params.total as string) || 0;

  const cart: CartItem[] = cartData ? JSON.parse(cartData) : [];

  const [step, setStep] = useState<"review" | "otp">("review");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build order payload following the agent-assisted ordering API contract
      const orderPayload: any = {
        order_type: "direct_listing",
        fulfillment_type: "self_pickup",
        agent_id: user?.id,
        retailer_id: parseInt(retailerId),
        order_items_attributes: cart.map((item) => ({
          listing_id: item.listing_id,
          quantity: item.quantity,
        })),
      };

      console.log(
        "[OrderConfirmation] Creating assisted order",
        JSON.stringify(orderPayload, null, 2),
      );

      // Create the order - OTP is automatically sent to retailer's phone
      const response = await marketCreateOrder(orderPayload);

      if (response?.success && response?.data) {
        const orders = Array.isArray(response.data)
          ? response.data
          : [response.data];
        const orderId = orders[0].id;

        setCreatedOrderId(orderId);
        console.log("[OrderConfirmation] Order created, OTP sent to retailer", orderId);

        // Move to OTP confirmation step
        setStep("otp");
        Alert.alert(
          "Order Created",
          `Order #${orderId} has been created. An OTP has been sent to ${retailerPhone}.\n\nFor demo purposes, the OTP is: 123456\n\nAsk the retailer to read you the code to confirm the order.`,
        );
      } else {
        const errorMsg =
          response?.errors ||
          response?.error ||
          response?.message ||
          "Failed to create order";
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    if (!createdOrderId) {
      setError("No order to confirm");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      console.log("[OrderConfirmation] Confirming order with OTP", {
        orderId: createdOrderId,
        otpLength: otp.length,
      });

      // Confirm the order with the OTP the retailer read to the agent
      await marketConfirmAgentOrder(createdOrderId, otp);

      console.log("[OrderConfirmation] Order confirmed successfully", createdOrderId);

      // Show success notification
      Alert.alert(
        "Order Confirmed",
        `Order #${createdOrderId} has been successfully confirmed for ${retailerName}.\n\nTotal: ${formatCurrency(total)}\n\nThe order is now active and will be processed.`,
        [
          {
            text: "View Orders",
            onPress: () => router.replace("/agent/retailers"),
          },
          {
            text: "Make Another Order",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to confirm order. Please try again.";
      setError(errorMsg);
      
      // If OTP is wrong or expired, offer to resend
      if (errorMsg.toLowerCase().includes("wrong") || 
          errorMsg.toLowerCase().includes("invalid") ||
          errorMsg.toLowerCase().includes("expired")) {
        Alert.alert(
          "Invalid OTP",
          "The OTP code is incorrect or expired. Would you like to resend a new code?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Resend OTP",
              onPress: handleResendOtp,
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!createdOrderId) {
      setError("No order to resend OTP for");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[OrderConfirmation] Resending OTP for order", createdOrderId);

      await marketResendAgentOrderOtp(createdOrderId);

      Alert.alert(
        "OTP Resent",
        `A new OTP has been sent to ${retailerPhone}.\n\nFor demo purposes, the OTP is still: 123456\n\nAsk the retailer to read you the new code.`,
      );
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <ThemedText type="defaultSemiBold" style={styles.cartItemTitle}>
          {item.title}
        </ThemedText>
        <ThemedText type="default" lightColor="#6b6b6b" style={{ fontSize: 13 }}>
          {item.category}
        </ThemedText>
      </View>
      <View style={styles.cartItemPricing}>
        <ThemedText type="default" lightColor="#6b6b6b">
          {item.quantity} × {formatCurrency(item.price)}
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={{ marginTop: 4 }}>
          {formatCurrency(item.price * item.quantity)}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <PageShell
      title={step === "review" ? "Review Order" : "Confirm with OTP"}
      subtitle={`Order for ${retailerName}`}
      showBackButton
      onBackPress={() => {
        if (step === "otp") {
          setStep("review");
        } else {
          router.back();
        }
      }}
      style={styles.shell}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {step === "review" ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.container}
          >
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialIcons name="store" size={20} color="#0a2f4a" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <ThemedText type="default" lightColor="#6b6b6b">
                    Retailer
                  </ThemedText>
                  <ThemedText type="defaultSemiBold">{retailerName}</ThemedText>
                </View>
              </View>
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <MaterialIcons name="phone" size={20} color="#0a2f4a" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <ThemedText type="default" lightColor="#6b6b6b">
                    Contact
                  </ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {retailerPhone}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <MaterialIcons name="person" size={20} color="#0a2f4a" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <ThemedText type="default" lightColor="#6b6b6b">
                    Agent
                  </ThemedText>
                  <ThemedText type="defaultSemiBold">
                    {user?.email || user?.phone || "Agent"}
                  </ThemedText>
                </View>
              </View>
            </View>

            <ThemedText
              type="defaultSemiBold"
              style={{ marginTop: 24, marginBottom: 12 }}
            >
              Order Items ({cart.length})
            </ThemedText>

            <View style={styles.cartList}>
              <FlatList
                data={cart}
                keyExtractor={(item) => item.id}
                renderItem={renderCartItem}
                scrollEnabled={false}
              />
            </View>

            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <ThemedText type="default">Subtotal</ThemedText>
                <ThemedText type="default">{formatCurrency(total)}</ThemedText>
              </View>
              <View style={[styles.totalRow, { marginTop: 8 }]}>
                <ThemedText type="default">Delivery Fee</ThemedText>
                <ThemedText type="default">{formatCurrency(0)}</ThemedText>
              </View>
              <View
                style={[
                  styles.totalRow,
                  {
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(10, 47, 74, 0.1)",
                  },
                ]}
              >
                <ThemedText type="subtitle">Total</ThemedText>
                <ThemedText type="subtitle">{formatCurrency(total)}</ThemedText>
              </View>
            </View>

            <Pressable
              style={[styles.continueButton, loading && { opacity: 0.6 }]}
              onPress={handleCreateOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                  Create Order & Send OTP
                </ThemedText>
              )}
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.container}
          >
            <View style={styles.otpContainer}>
              <MaterialIcons name="sms" size={48} color="#0a2f4a" />
              <ThemedText type="subtitle" style={{ marginTop: 16 }}>
                Enter Verification Code
              </ThemedText>
              <ThemedText
                type="default"
                lightColor="#6b6b6b"
                style={{ marginTop: 8, textAlign: "center" }}
              >
                A 6-digit OTP has been sent to {retailerPhone}.{"\n"}
                Ask the retailer for the code to confirm the order.
              </ThemedText>
            </View>

            <View style={styles.otpInputContainer}>
              <MaterialIcons name="vpn-key" size={20} color="#0a2f4a" />
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#9a9a9a"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={18} color="#b00020" />
                <ThemedText
                  type="default"
                  style={{ color: "#b00020", marginLeft: 8 }}
                >
                  {error}
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.summaryCard}>
              <ThemedText type="default" lightColor="#6b6b6b">
                Order Total
              </ThemedText>
              <ThemedText type="subtitle" style={{ marginTop: 4 }}>
                {formatCurrency(total)}
              </ThemedText>
              <ThemedText
                type="default"
                lightColor="#6b6b6b"
                style={{ marginTop: 8, fontSize: 13 }}
              >
                {cart.length} item(s) • {retailerName}
              </ThemedText>
            </View>

            <Pressable
              style={[
                styles.continueButton,
                (otp.length !== 6 || loading) && { opacity: 0.6 },
              ]}
              onPress={handleConfirmOrder}
              disabled={otp.length !== 6 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
                  Confirm Order
                </ThemedText>
              )}
            </Pressable>

            <Pressable style={styles.resendButton} onPress={handleResendOtp}>
              <ThemedText type="defaultSemiBold" style={{ color: "#0a2f4a" }}>
                Resend OTP
              </ThemedText>
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 47, 74, 0.05)",
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  cartItemTitle: {
    fontSize: 15,
  },
  cartItemPricing: {
    alignItems: "flex-end",
  },
  totalCard: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  continueButton: {
    marginTop: 24,
    backgroundColor: "#0a2f4a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  otpContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  otpInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0a2f4a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  otpInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#0a2f4a",
    letterSpacing: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(176, 0, 32, 0.05)",
    borderRadius: 8,
  },
  summaryCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(10, 47, 74, 0.05)",
    borderRadius: 12,
  },
  resendButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
});
