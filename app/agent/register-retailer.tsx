import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { marketRegisterRetailer } from "@/lib/api/clients";

export default function AgentRegisterRetailerScreen() {
  const router = useRouter();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid =
    name.trim() &&
    phone.trim() &&
    tinNumber.trim() &&
    location.trim() &&
    password &&
    passwordConfirmation &&
    password === passwordConfirmation;

  const handleSendOtp = () => {
    if (!isFormValid) {
      setError("Please fill in all required fields correctly");
      return;
    }

    setError(null);
    // Mock OTP send - in production, this would call an OTP service
    Alert.alert(
      "OTP Sent",
      `A verification code has been sent to +251${phone}. For demo purposes, use: 123456`,
      [
        {
          text: "OK",
          onPress: () => setStep("otp"),
        },
      ]
    );
  };

  const handleRegister = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    // Mock OTP verification - in production, this would verify with backend
    if (otp !== "123456") {
      setError("Invalid OTP. Please try again.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const fullPhone = phone.startsWith("+251") ? phone : `+251${phone}`;

      const payload = {
        name: name.trim(),
        phone: fullPhone,
        tin_number: tinNumber.trim(),
        location: location.trim(),
        password: password,
        password_confirmation: passwordConfirmation,
      };

      await marketRegisterRetailer(payload);

      Alert.alert("Success", "Retailer registered successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/agent/retailers"),
        },
      ]);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Register Retailer"
      subtitle={step === "form" ? "Onboard a new retailer" : "Verify phone number"}
      showBackButton
      onBackPress={() => {
        if (step === "otp") {
          setStep("form");
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          {step === "form" ? (
            <>
              <Text style={styles.fieldLabel}>Retailer Name *</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="store" size={18} color="#0a2f4a" />
                <TextInput
                  style={styles.inputText}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter retailer/shop name"
                  placeholderTextColor="#9a9a9a"
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Phone Number *</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="phone" size={18} color="#0a2f4a" />
                <Text style={styles.phonePrefix}>+251</Text>
                <TextInput
                  style={styles.inputText}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="9xx xxx xxx"
                  placeholderTextColor="#9a9a9a"
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>TIN Number *</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="badge" size={18} color="#0a2f4a" />
                <TextInput
                  style={styles.inputText}
                  value={tinNumber}
                  onChangeText={setTinNumber}
                  placeholder="Enter TIN number"
                  placeholderTextColor="#9a9a9a"
                  keyboardType="number-pad"
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Location *</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="location-on" size={18} color="#0a2f4a" />
                <TextInput
                  style={styles.inputText}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g., Kirkos, Addis Ababa"
                  placeholderTextColor="#9a9a9a"
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Password *</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock-outline" size={18} color="#0a2f4a" />
                <TextInput
                  style={styles.inputText}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#9a9a9a"
                  secureTextEntry
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Confirm Password *</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock-outline" size={18} color="#0a2f4a" />
                <TextInput
                  style={styles.inputText}
                  value={passwordConfirmation}
                  onChangeText={setPasswordConfirmation}
                  placeholder="Re-enter password"
                  placeholderTextColor="#9a9a9a"
                  secureTextEntry
                />
              </View>

              {password && passwordConfirmation && password !== passwordConfirmation && (
                <Text style={styles.error}>Passwords do not match</Text>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[
                  styles.continueButton,
                  (!isFormValid || loading) && styles.buttonDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={!isFormValid || loading}
              >
                <Text style={styles.continueText}>Send OTP</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.otpContainer}>
                <MaterialIcons name="sms" size={48} color="#0a2f4a" />
                <Text style={styles.otpTitle}>Enter Verification Code</Text>
                <Text style={styles.otpSubtitle}>
                  We've sent a 6-digit code to +251{phone}
                </Text>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 20 }]}>OTP Code *</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="vpn-key" size={18} color="#0a2f4a" />
                <TextInput
                  style={styles.inputText}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#9a9a9a"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[
                  styles.continueButton,
                  (otp.length !== 6 || loading) && styles.buttonDisabled,
                ]}
                onPress={handleRegister}
                disabled={otp.length !== 6 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.continueText}>Register Retailer</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.resendButton}
                onPress={handleSendOtp}
              >
                <Text style={styles.resendText}>Resend OTP</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  form: { paddingBottom: 40 },
  fieldLabel: {
    color: "#0a2f4a",
    marginBottom: 6,
    fontWeight: "500",
    fontSize: 15,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0a2f4a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  inputText: {
    flex: 1,
    marginLeft: 8,
    padding: 0,
    color: "#0a2f4a",
    fontWeight: "400",
  },
  phonePrefix: {
    color: "#0a2f4a",
    fontWeight: "600",
    marginLeft: 6,
    marginRight: 4,
  },
  error: {
    color: "#b00020",
    marginTop: 12,
    fontSize: 14,
  },
  continueButton: {
    marginTop: 24,
    backgroundColor: "#0a2f4a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonDisabled: { opacity: 0.6 },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  otpContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0a2f4a",
    marginTop: 16,
  },
  otpSubtitle: {
    fontSize: 14,
    color: "#6b6b6b",
    marginTop: 8,
    textAlign: "center",
  },
  resendButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  resendText: {
    color: "#0a7ea4",
    fontWeight: "600",
    fontSize: 15,
  },
});
