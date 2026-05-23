import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { OrderSummary } from "@/components/order-summary";
import { useCart } from "@/components/cart-context";

export const options = { headerShown: false };

export default function CheckoutScreen() {
  const router = useRouter();
  const { subtotal } = useCart();

  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [subCity, setSubCity] = useState("");
  const [address, setAddress] = useState("");

  return (
    <PageShell
      title="Secure Checkout"
      showBackButton
      footer={
        <>
          <OrderSummary
            subtotal={subtotal}
            tax={tax}
            total={total}
            compact={true}
          />

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.push("/checkout/payment")}
            accessibilityLabel="Continue to payment"
          >
            <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
              Continue to Payment →
            </ThemedText>
          </TouchableOpacity>
        </>
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, marginBottom: -126 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View style={styles.stepRow}>
            <ThemedText type="default" style={styles.stepLabel}>
              STEP 01
            </ThemedText>
            <ThemedText type="title" style={styles.stepTitle}>
              Shipping
            </ThemedText>

            <View style={styles.progressWrap}>
              <View style={[styles.progressDot, styles.progressActive]} />
              <View style={styles.progressDot} />
              <View style={styles.progressDot} />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="location-on" size={18} color="#8a1d1d" />
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                Delivery Details
              </ThemedText>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Enter recipient's name"
              placeholderTextColor="#5A413D80"
              value={name}
              onChangeText={setName}
            />

            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <View style={styles.countryBox}>
                <ThemedText type="input">+251</ThemedText>
              </View>
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                placeholder="Phone Number"
                placeholderTextColor="#5A413D80"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Region / City"
                placeholderTextColor="#5A413D80"
                value={region}
                onChangeText={setRegion}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Sub City"
                placeholderTextColor="#5A413D80"
                value={subCity}
                onChangeText={setSubCity}
              />
            </View>

            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Street Address"
              placeholderTextColor="#5A413D80"
              value={address}
              onChangeText={setAddress}
            />

            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={18} color="#6b6b6b" />
              <ThemedText
                type="default"
                lightColor="#6b6b6b"
                style={{ marginLeft: 10 }}
              >
                This address will be saved to your profile for future
                transactions.
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepRow: { marginTop: 12, marginBottom: 8 },
  stepLabel: { color: "#8a1d1d", fontWeight: "700", marginBottom: 6 },
  stepTitle: { fontSize: 28, marginBottom: 6 },
  progressWrap: {
    position: "absolute",
    right: 0,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 28,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#e6e6e6",
    marginLeft: 6,
  },
  progressActive: { backgroundColor: "#8a1d1d" },
  card: {
    marginTop: 12,
    backgroundColor: "#F4F3F2",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  cardTitle: { marginLeft: 8 },
  input: {
    backgroundColor: "#E3E2E1",
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 6,
    fontWeight: "600",
    color: "#5A413D",
  },
  countryBox: {
    width: 72,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  infoBox: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  footer: { position: "absolute", left: 16, right: 16, bottom: 16 },
  continueBtn: {
    backgroundColor: "#8a1d1d",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});
