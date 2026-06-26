import React, { useState, useEffect } from "react";
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
import { useSdk } from "@/lib/sdk/context";
import { coreGetAddresses, coreCreateAddress, coreUpdateAddress } from "@/lib/api/clients";

export const options = { headerShown: false };

export default function CheckoutScreen() {
  const router = useRouter();
  const { subtotal } = useCart();
  const { user } = useSdk();

  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [subCity, setSubCity] = useState("");
  const [address, setAddress] = useState("");
  const [addressId, setAddressId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-populate name & phone from authenticated user profile
  useEffect(() => {
    if (user) {
      const profile = user.user_profile || {};
      const fullName = (profile.first_name ? `${profile.first_name} ${profile.last_name ?? ""}` : user.email || user.phone || "").trim();
      if (fullName) setName(fullName);
      
      if (user.phone) {
        // Strip prefix $+251$ as the UI has its own "+251" country prefix display box
        const cleanedPhone = user.phone.startsWith("+251") ? user.phone.replace("+251", "") : user.phone;
        setPhone(cleanedPhone);
      }
    }
  }, [user]);

  // Fetch and pre-populate shipping/default address
  useEffect(() => {
    async function loadShippingAddress() {
      try {
        const response = await coreGetAddresses();
        const addressList = response?.data || response;
        if (Array.isArray(addressList)) {
          const shippingAddr = addressList.find((addr: any) => addr.address_type === "shipping") || addressList[0];
          if (shippingAddr) {
            setAddressId(shippingAddr.id);
            if (shippingAddr.city) setRegion(shippingAddr.city);
            if (shippingAddr.sub_city) setSubCity(shippingAddr.sub_city);

            const parts = [];
            if (shippingAddr.house_numbers) parts.push(`H.No ${shippingAddr.house_numbers}`);
            if (shippingAddr.woreda) parts.push(`Woreda ${shippingAddr.woreda}`);
            if (shippingAddr.kebele) parts.push(`Kebele ${shippingAddr.kebele}`);

            if (parts.length > 0) {
              setAddress(parts.join(", "));
            } else if (user?.user_profile?.address) {
              setAddress(user.user_profile.address);
            }
          } else if (user?.user_profile?.address) {
            setAddress(user.user_profile.address);
          }
        }
      } catch (err) {
        console.warn("[Checkout] Failed to load shipping address:", err);
      }
    }

    loadShippingAddress();
  }, [user]);

  const handleContinue = async () => {
    setIsSaving(true);
    let resolvedAddressId = addressId;

    try {
      const addressPayload = {
        address_type: "shipping",
        country: "Ethiopia",
        city: region || "Addis Ababa",
        sub_city: subCity || "",
        house_numbers: address || "",
      };

      if (addressId) {
        // Update existing address
        await coreUpdateAddress(addressId, addressPayload);
        console.log("[Checkout] Address updated successfully", addressId);
      } else if (region || subCity || address) {
        // Create new address if any address field is filled
        const res = await coreCreateAddress(addressPayload);
        if (res?.success && res?.data) {
          resolvedAddressId = res.data.id;
          setAddressId(res.data.id);
          console.log("[Checkout] Address created successfully", res.data.id);
        }
      }
    } catch (err) {
      console.warn("[Checkout] Failed to save address:", err);
    } finally {
      setIsSaving(false);
      router.push({
        pathname: "/checkout/payment",
        params: {
          addressId: resolvedAddressId || "",
          name,
          phone,
          region,
          subCity,
          address,
        },
      });
    }
  };

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
            style={[styles.continueBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleContinue}
            disabled={isSaving}
            accessibilityLabel="Continue to payment"
          >
            <ThemedText type="defaultSemiBold" style={{ color: "#fff" }}>
              {isSaving ? "Saving details..." : "Continue to Payment →"}
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
