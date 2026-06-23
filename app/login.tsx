import { ThemedText } from "@/components/themed-text";
import { authLogin } from "@/lib/api/clients";
import { useSdk } from "@/lib/sdk/context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { refreshToken } = useSdk();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // attempt login; send `email_or_phone` (server expects this key)
      // Prepend +251 country code if not already present
      const fullPhone = emailOrPhone.startsWith("+251") ? emailOrPhone : `+251${emailOrPhone}`;
      const loginResult = await authLogin({ email_or_phone: fullPhone, password });
      await refreshToken();

      // Check review_status from login response (per mobile-integration-agent-retailer.md)
      const reviewStatus = loginResult?.data?.user?.review_status;

      // Detect user role from response
      const roles = loginResult?.data?.user?.roles ?? [];
      const permissions = loginResult?.data?.user?.permissions ?? [];
      
      const isSupplier = reviewStatus?.type === "supplier" || 
        roles.some((r: any) => r?.code?.toUpperCase() === "SUPPLIER" || r?.name?.toUpperCase() === "SUPPLIER") ||
        permissions.some((p: string) => p.includes("businesses."));
      
      const isRetailer = roles.some((r: any) => 
        r?.code?.toUpperCase() === "RETAILER" || r?.name?.toUpperCase() === "RETAILER"
      );

      // Suppliers go to supplier dashboard
      if (isSupplier && !isRetailer) {
        if (reviewStatus && (reviewStatus.status === "pending" || reviewStatus.status === "under_review")) {
          router.replace({
            pathname: "/onboarding/pending-approval" as any,
            params: { role: "supplier", status: reviewStatus.status },
          });
        } else {
          router.replace("/supplier/dashboard" as any);
        }
        return;
      }

      // Retailers go directly to home regardless of review status
      if (reviewStatus && !isRetailer) {
        const status = reviewStatus.status;
        if (status === "pending" || status === "under_review") {
          // User's marketplace account is pending review (agent only)
          const reviewType = reviewStatus.type || "user";
          router.replace({
            pathname: "/onboarding/pending-approval" as any,
            params: { role: reviewType, status },
          });
          return;
        }
        // For rejected/modify/verified/approved — proceed to home
      }

      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("[LoginScreen] authLogin error", err);
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerWrap}>
            <Image
              source={require("@/assets/images/new6.png")}
              style={styles.headerImage}
              contentFit="cover"
            />
          </View>

          <View style={styles.formWrap}>
            <ThemedText type="defaultSemiBold" style={styles.title}>
              Sign in
            </ThemedText>

            <Text style={styles.fieldLabel}>Phone number</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="phone" size={18} color="#0a2f4a" />
              <Text style={styles.phonePrefix}>+251</Text>
              <TextInput
                style={styles.inputText}
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="phone-pad"
                placeholder="9xx xxx xxx"
                placeholderTextColor="#9a9a9a"
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Password</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="lock-outline" size={18} color="#0a2f4a" />
              <TextInput
                style={styles.inputText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="enter password"
                placeholderTextColor="#9a9a9a"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={18}
                  color="#6b6b6b"
                />
              </Pressable>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.rowBetween}>
              <Pressable
                style={styles.rememberWrap}
                onPress={() => setRemember((v) => !v)}
              >
                <View
                  style={[styles.checkbox, remember && styles.checkboxChecked]}
                >
                  {remember ? (
                    <MaterialIcons name="check" size={14} color="#fff" />
                  ) : null}
                </View>
                <Text style={styles.rememberText}>Remember Me</Text>
              </Pressable>

              <Pressable onPress={() => router.push("/forgot")}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.loginButton,
                loading ? styles.buttonDisabled : null,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>Login</Text>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an Account? </Text>
              <Pressable onPress={() => router.push("/signup")}>
                <Text style={styles.signupLink}>Sign up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, paddingBottom: 0 },
  scroll: { flex: 1 },
  // responsive header: percentage height with a minHeight so small devices still show a good area
  headerWrap: { height: "35%", minHeight: 90, position: "relative" },
  // make the header image fill the header container
  headerImage: { width: "100%", height: "100%" },
  logo: {
    width: "68%",
    height: "60%",
    position: "absolute",
    alignSelf: "center",
    top: -10,
  },
  formWrap: { padding: 20, marginTop: 0, zIndex: 10, elevation: 4 },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
    marginBottom: 22,
    color: "#fff",
    marginTop: -65,
  },
  fieldLabel: {
    color: "#0a2f4a",
    marginBottom: 6,
    fontWeight: "500",
    fontSize: 17,
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
    marginTop: 4,
  },
  inputText: {
    flex: 1,
    marginLeft: 6,
    padding: 0,
    color: "#0a2f4a",
    fontWeight: "400",
  },
  phonePrefix: {
    color: "#0a2f4a",
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
  },
  loginButton: {
    marginTop: 70,
    backgroundColor: "#0a2f4a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700" },
  loginText: { color: "#fff", fontWeight: "700" },
  error: { color: "#b00020", marginTop: 12 },
  rowBetween: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rememberWrap: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#0a2f4a",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: { backgroundColor: "#0a2f4a", borderColor: "#0a2f4a" },
  rememberText: { marginLeft: 8, color: "#333" },
  forgotText: { color: "#8a1d1d" },
  footerRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 210,
  },
  footerText: { color: "#6b6b6b" },
  signupLink: { color: "#0a7ea4", marginLeft: 6 },
});
