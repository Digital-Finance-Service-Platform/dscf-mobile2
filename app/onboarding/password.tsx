import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import {
    authLogin,
    authSignup,
    marketRegisterSupplier,
    setAccessToken,
} from "@/lib/api/clients";
import {
    clearOnboardingData,
    getOnboardingData,
} from "@/lib/onboarding-storage";
import { useSdk } from "@/lib/sdk/context";

export default function PasswordCreationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { refreshToken } = useSdk();
  
  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = React.useMemo(() => {
    if (password.length < 6) return { label: "Too short", color: "#b00020" };
    if (password.length < 8) return { label: "Weak", color: "#f57c00" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { label: "Medium", color: "#fbc02d" };
    return { label: "Strong", color: "#2e7d32" };
  }, [password]);

  const handleContinue = async () => {
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Extract all collected onboarding data
      const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone;
      const fullName = Array.isArray(params.fullName) ? params.fullName[0] : params.fullName;
      const firstNameParam = Array.isArray(params.firstName) ? params.firstName[0] : params.firstName;
      const lastNameParam = Array.isArray(params.lastName) ? params.lastName[0] : params.lastName;
      const storeName = Array.isArray(params.storeName) ? params.storeName[0] : params.storeName;
      const businessName = Array.isArray(params.businessName) ? params.businessName[0] : params.businessName;
      const email = Array.isArray(params.email) ? params.email[0] : params.email;
      const tin = Array.isArray(params.tin) ? params.tin[0] : params.tin;
      const latitude = Array.isArray(params.latitude) ? params.latitude[0] : params.latitude;
      const longitude = Array.isArray(params.longitude) ? params.longitude[0] : params.longitude;
      const gender = Array.isArray(params.gender) ? params.gender[0] : params.gender;
      const nationalId = Array.isArray(params.nationalId) ? params.nationalId[0] : params.nationalId;
      const serviceArea = Array.isArray(params.serviceArea) ? params.serviceArea[0] : params.serviceArea;
      const contactName = Array.isArray(params.contactName) ? params.contactName[0] : params.contactName;
      const faydaNumber = Array.isArray(params.faydaNumber) ? params.faydaNumber[0] : params.faydaNumber;

      // Prepend +251 country code to phone if not already present
      const rawPhone = phone?.trim() || "";
      const fullPhone = rawPhone ? (rawPhone.startsWith("+251") ? rawPhone : `+251${rawPhone}`) : "";

      // Branch by role:
      // - Supplier: marketplace endpoint handles everything (not supported in authSignup)
      // - Agent/Retailer: atomic authSignup with agent/retailer blocks (per spec)

      if (role === "supplier") {
        // Retrieve stored onboarding data including documents
        const storedData = await getOnboardingData();
        
        // Supplier registration via marketplace endpoint only (creates its own user)
        const formData = new FormData();
        
        // Use stored data if available, otherwise fall back to params
        const supplierBusinessName = storedData?.businessName || businessName || fullName || "";
        const supplierContactName = storedData?.contactName || contactName || "";
        const supplierPhone = storedData?.phone || phone || "";
        const supplierEmail = storedData?.email || email || "";
        const supplierLocation = storedData?.latitude && storedData?.longitude
          ? `${storedData.latitude},${storedData.longitude}`
          : (serviceArea || `${latitude || ""},${longitude || ""}`);
        
        formData.append("business_name", supplierBusinessName);
        formData.append("contact_person_phone", fullPhone || "");
        formData.append("password", password);
        formData.append("password_confirmation", confirmPassword || password);
        formData.append("location", supplierLocation);
        
        if (supplierContactName) formData.append("contact_person_name", supplierContactName);
        if (supplierEmail) formData.append("email", supplierEmail);
        if (tin) formData.append("tin_number", tin);
        if (gender) formData.append("gender", gender);

        // Add documents from stored data
        if (storedData?.documents?.licenseFile) {
          const license = storedData.documents.licenseFile;
          formData.append("business_license", {
            uri: license.uri,
            name: license.name,
            type: license.mimeType || "application/octet-stream",
          } as any);
          console.log("[Password] Added business_license:", license.name);
        }

        if (storedData?.documents?.additionalDocs && storedData.documents.additionalDocs.length > 0) {
          storedData.documents.additionalDocs.forEach((doc) => {
            formData.append("additional_documents[]", {
              uri: doc.uri,
              name: doc.name,
              type: doc.mimeType || "application/octet-stream",
            } as any);
          });
          console.log("[Password] Added", storedData.documents.additionalDocs.length, "additional documents");
        }

        console.log("[Password] Submitting supplier registration with documents");
        const regResult = await marketRegisterSupplier(formData);

        // Clear stored onboarding data after successful registration
        await clearOnboardingData();

        // Extract tokens from response if returned
        const accessToken =
          regResult?.data?.access_token ?? regResult?.access_token ?? null;
        const refreshTokenVal =
          regResult?.data?.refresh_token ?? regResult?.refresh_token ?? null;

        if (accessToken) {
          await setAccessToken(accessToken, refreshTokenVal ?? undefined);
        } else {
          try {
            await authLogin({ email_or_phone: fullPhone, password });
          } catch { /* fallback */ }
        }
        await refreshToken();

        setLoading(false);
        router.replace({
          pathname: "/onboarding/pending-approval" as any,
          params: { role: "supplier", status: "pending" },
        });
      } else {
        // Agent/Retailer: atomic creation via authSignup
        const nameForSignup = fullName || [firstNameParam, lastNameParam].filter(Boolean).join(" ") || businessName || storeName || phone || "User";
        const firstName = firstNameParam || fullName?.split(/\s+/)[0] || nameForSignup.split(/\s+/)[0] || "";
        const lastName = lastNameParam || fullName?.split(/\s+/).slice(1).join(" ") || nameForSignup.split(/\s+/).slice(1).join(" ") || undefined;

        const userBlock: Record<string, any> = {
          email: email?.trim().toLowerCase() || undefined,
          phone: fullPhone || undefined,
          password,
          password_confirmation: confirmPassword || password,
          user_profile_attributes: {
            first_name: firstName,
            last_name: lastName,
            gender: gender || undefined,
          },
        };

        const signupPayload: Record<string, any> = { user: userBlock };

        if (role === "agent") {
          signupPayload.agent = {
            name: fullName || "",
            phone: fullPhone,
            service_area: serviceArea || "",
            fayda_number: faydaNumber || nationalId || "",
          };
        } else if (role === "retailer") {
          signupPayload.retailer = {
            name: nameForSignup,
            phone: fullPhone,
            tin_number: tin || "",
            location: `${latitude || ""},${longitude || ""}`,
          };
        }

        console.log("[Password] Signup payload:", JSON.stringify(signupPayload, null, 2));
        const signupResult = await authSignup(signupPayload);

        // Extract tokens and review_status from signup response
        const accessToken =
          signupResult?.data?.access_token ??
          signupResult?.access_token ??
          signupResult?.data?.token ??
          null;
        const refreshTokenVal =
          signupResult?.data?.refresh_token ??
          signupResult?.refresh_token ??
          null;
        const reviewStatus = signupResult?.data?.user?.review_status;

        if (accessToken) {
          await setAccessToken(accessToken, refreshTokenVal ?? undefined);
        } else {
          try {
            await authLogin({ email_or_phone: fullPhone, password });
          } catch { /* fallback */ }
        }
        await refreshToken();

        // Navigate based on role — retailers go directly to home
        if (role === "retailer") {
          setLoading(false);
          router.replace("/(tabs)");
        } else if (reviewStatus?.status === "pending" || reviewStatus?.status === "under_review") {
          setLoading(false);
          router.replace({
            pathname: "/onboarding/pending-approval" as any,
            params: { role, status: reviewStatus.status },
          });
        } else if (role === "agent") {
          setLoading(false);
          router.replace({
            pathname: "/onboarding/pending-approval" as any,
            params: { role: "agent", status: "pending" },
          });
        } else {
          setLoading(false);
          router.replace("/login");
        }
      }
    } catch (e: any) {
      setLoading(false);
      const msg = e?.message ?? "Registration failed";
      setError(msg);
      
      // Don't clear onboarding data on error, so user can retry
      console.error("[Password] Registration error:", msg);
    }
  };

  return (
    <PageShell
      title="Create password"
      subtitle="Secure your account with a strong password"
      showBackButton
      style={styles.shell}
    >
      <View style={styles.form}>
        <ThemedText type="default" style={styles.fieldLabel}>
          Password
        </ThemedText>
        <View style={styles.inputBox}>
          <MaterialIcons name="lock-outline" size={20} color="#0a2f4a" />
          <TextInput
            style={styles.inputText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Enter your password"
            placeholderTextColor="#9a9a9a"
          />
          <Pressable onPress={() => setShowPassword((v) => !v)}>
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color="#6b6b6b"
            />
          </Pressable>
        </View>

        {password ? (
          <View style={styles.strengthRow}>
            <View
              style={[
                styles.strengthBar,
                { backgroundColor: passwordStrength.color },
              ]}
            />
            <ThemedText
              type="default"
              style={[styles.strengthText, { color: passwordStrength.color }]}
            >
              {passwordStrength.label}
            </ThemedText>
          </View>
        ) : null}

        <ThemedText type="default" style={[styles.fieldLabel, { marginTop: 20 }]}>
          Confirm Password
        </ThemedText>
        <View style={styles.inputBox}>
          <MaterialIcons name="lock-outline" size={20} color="#0a2f4a" />
          <TextInput
            style={styles.inputText}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            placeholder="Re-enter your password"
            placeholderTextColor="#9a9a9a"
          />
          <Pressable onPress={() => setShowConfirm((v) => !v)}>
            <MaterialIcons
              name={showConfirm ? "visibility" : "visibility-off"}
              size={20}
              color="#6b6b6b"
            />
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={18} color="#b00020" />
            <ThemedText type="default" style={styles.errorText}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.requirementsBox}>
          <ThemedText type="default" style={styles.requirementsTitle}>
            Password requirements:
          </ThemedText>
          <RequirementItem
            text="At least 6 characters"
            met={password.length >= 6}
          />
          <RequirementItem
            text="Contains uppercase letter (recommended)"
            met={/[A-Z]/.test(password)}
            optional
          />
          <RequirementItem
            text="Contains number (recommended)"
            met={/[0-9]/.test(password)}
            optional
          />
        </View>

        <Pressable
          style={[
            styles.continueButton,
            (loading || password.length < 6) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={loading || password.length < 6}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="defaultSemiBold" style={styles.continueText}>
              Complete Registration
            </ThemedText>
          )}
        </Pressable>

        {error ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={18} color="#b00020" />
            <ThemedText type="default" style={styles.errorText}>
              {error}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </PageShell>
  );
}

function RequirementItem({
  text,
  met,
  optional,
}: {
  text: string;
  met: boolean;
  optional?: boolean;
}) {
  return (
    <View style={styles.requirementRow}>
      <MaterialIcons
        name={met ? "check-circle" : "radio-button-unchecked"}
        size={16}
        color={met ? "#2e7d32" : optional ? "#9a9a9a" : "#6b6b6b"}
      />
      <ThemedText
        type="default"
        style={[
          styles.requirementText,
          met && styles.requirementTextMet,
          optional && !met && styles.requirementTextOptional,
        ]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  form: { marginTop: 12 },
  fieldLabel: {
    color: "#0a2f4a",
    marginBottom: 8,
    fontWeight: "500",
    fontSize: 15,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(10, 47, 74, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  inputText: {
    flex: 1,
    marginLeft: 10,
    padding: 0,
    color: "#0a2f4a",
    fontSize: 15,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  strengthBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  strengthText: {
    fontSize: 13,
    fontWeight: "500",
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
  requirementsBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  requirementsTitle: {
    color: "#0a2f4a",
    fontWeight: "600",
    marginBottom: 12,
    fontSize: 14,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  requirementText: {
    marginLeft: 8,
    color: "#6b6b6b",
    fontSize: 13,
  },
  requirementTextMet: {
    color: "#2e7d32",
  },
  requirementTextOptional: {
    color: "#9a9a9a",
  },
  continueButton: {
    marginTop: 32,
    backgroundColor: "#0a2f4a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueText: {
    color: "#fff",
    fontSize: 16,
  },
});
