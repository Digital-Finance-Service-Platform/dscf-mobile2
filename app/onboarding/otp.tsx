import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { getOnboardingData } from "@/lib/onboarding-storage";

export default function OtpVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone;
  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  
  // Explicitly extract all onboarding data to pass through
  const fullName = Array.isArray(params.fullName) ? params.fullName[0] : params.fullName;
  const firstName = Array.isArray(params.firstName) ? params.firstName[0] : params.firstName;
  const lastName = Array.isArray(params.lastName) ? params.lastName[0] : params.lastName;
  const gender = Array.isArray(params.gender) ? params.gender[0] : params.gender;
  const nationalId = Array.isArray(params.nationalId) ? params.nationalId[0] : params.nationalId;
  const serviceArea = Array.isArray(params.serviceArea) ? params.serviceArea[0] : params.serviceArea;
  const faydaNumber = Array.isArray(params.faydaNumber) ? params.faydaNumber[0] : params.faydaNumber;
  // Retailer fields
  const storeName = Array.isArray(params.storeName) ? params.storeName[0] : params.storeName;
  const tin = Array.isArray(params.tin) ? params.tin[0] : params.tin;
  const latitude = Array.isArray(params.latitude) ? params.latitude[0] : params.latitude;
  const longitude = Array.isArray(params.longitude) ? params.longitude[0] : params.longitude;
  // Supplier fields
  const businessName = Array.isArray(params.businessName) ? params.businessName[0] : params.businessName;
  const contactName = Array.isArray(params.contactName) ? params.contactName[0] : params.contactName;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Mock: Auto-send OTP on mount
  useEffect(() => {
    console.log("[OTP] Mock OTP sent to:", phone);
    console.log("[OTP] Mock code is: 123456");
  }, [phone]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setError(null);
    setLoading(true);

    // Mock verification (accept any 6-digit code for now, or specifically 123456)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (otpCode !== "123456" && otpCode !== "000000") {
      setError("Invalid OTP code. Try 123456 or 000000");
      setLoading(false);
      return;
    }

    setLoading(false);
    
    // For supplier, retrieve stored data to pass through
    let supplierData: any = {};
    if (role === "supplier") {
      const storedData = await getOnboardingData();
      if (storedData) {
        supplierData = {
          businessName: storedData.businessName,
          contactName: storedData.contactName,
          email: storedData.email,
          latitude: storedData.latitude,
          longitude: storedData.longitude,
        };
      }
    }
    
    // Navigate to password creation with all onboarding data
    router.push({
      pathname: "/onboarding/password" as any,
      params: {
        role,
        phone,
        fullName,
        firstName,
        lastName,
        gender,
        nationalId,
        serviceArea,
        faydaNumber,
        storeName,
        tin,
        latitude,
        longitude,
        ...supplierData,
      },
    });
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(60);
    setError(null);
    console.log("[OTP] Mock OTP resent to:", phone);
    console.log("[OTP] Mock code is: 123456");
  };

  return (
    <PageShell
      title="Verify your phone"
      subtitle={`Enter the 6-digit code sent to ${phone}`}
      showBackButton
      style={styles.shell}
    >
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[styles.otpInput, digit && styles.otpInputFilled]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index)
            }
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={18} color="#b00020" />
          <ThemedText type="default" style={styles.errorText}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.hintBox}>
        <MaterialIcons name="info-outline" size={16} color="#6b6b6b" />
        <ThemedText type="default" style={styles.hintText}>
          For testing, use code: 123456 or 000000
        </ThemedText>
      </View>

      <Pressable
        style={[styles.verifyButton, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText type="defaultSemiBold" style={styles.verifyText}>
            Verify & Continue
          </ThemedText>
        )}
      </Pressable>

      <View style={styles.resendRow}>
        {canResend ? (
          <Pressable onPress={handleResend}>
            <ThemedText type="default" style={styles.resendLink}>
              Resend code
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedText type="default" style={styles.resendTimer}>
            Resend code in {resendTimer}s
          </ThemedText>
        )}
      </View>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 24,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: "rgba(10, 47, 74, 0.2)",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    color: "#0a2f4a",
    backgroundColor: "#fff",
  },
  otpInputFilled: {
    borderColor: "#0a2f4a",
    backgroundColor: "rgba(10, 47, 74, 0.05)",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#ffebee",
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    color: "#b00020",
    flex: 1,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  hintText: {
    marginLeft: 8,
    color: "#6b6b6b",
    fontSize: 13,
    flex: 1,
  },
  verifyButton: {
    marginTop: 32,
    backgroundColor: "#0a2f4a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyText: {
    color: "#fff",
    fontSize: 16,
  },
  resendRow: {
    marginTop: 20,
    alignItems: "center",
  },
  resendLink: {
    color: "#0a7ea4",
    fontSize: 15,
  },
  resendTimer: {
    color: "#6b6b6b",
    fontSize: 15,
  },
});
