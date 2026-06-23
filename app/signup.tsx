import { ThemedText } from "@/components/themed-text";
import { authSignup } from "@/lib/api/clients";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  View
} from "react-native";

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Extract role and collected data from params
  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  const password = Array.isArray(params.password) ? params.password[0] : params.password;
  const confirmPassword = Array.isArray(params.confirmPassword) ? params.confirmPassword[0] : params.confirmPassword;
  
  // Pre-fill from onboarding flow if available
  const initialPhone = Array.isArray(params.phone) ? params.phone[0] : params.phone;
  const initialFirstName = 
    (Array.isArray(params.firstName) ? params.firstName[0] : params.firstName) || "";
  const initialLastName = 
    (Array.isArray(params.lastName) ? params.lastName[0] : params.lastName) || "";

  // Onboarding data for agent/retailer blocks
  const onboardingTin = Array.isArray(params.tin) ? params.tin[0] : params.tin;
  const onboardingLatitude = Array.isArray(params.latitude) ? params.latitude[0] : params.latitude;
  const onboardingLongitude = Array.isArray(params.longitude) ? params.longitude[0] : params.longitude;
  const onboardingServiceArea = Array.isArray(params.serviceArea) ? params.serviceArea[0] : params.serviceArea;
  const onboardingFaydaNumber = Array.isArray(params.faydaNumber) ? params.faydaNumber[0] : params.faydaNumber;
  const onboardingNationalId = Array.isArray(params.nationalId) ? params.nationalId[0] : params.nationalId;
  const onboardingGender = Array.isArray(params.gender) ? params.gender[0] : params.gender;

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(initialPhone || "");
  const [pass, setPass] = useState(password || "");
  const [confirm, setConfirm] = useState(confirmPassword || "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !pass) {
      setError("Please complete all fields");
      return;
    }
    if (pass !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = phone.trim() ? (phone.startsWith("+251") ? phone.trim() : `+251${phone.trim()}`) : undefined;

      const signupPayload: Record<string, any> = {
        user: {
          email: email.trim().toLowerCase(),
          phone: fullPhone,
          password: pass,
          password_confirmation: confirm || pass,
          user_profile_attributes: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            gender: onboardingGender || undefined,
          },
        },
      };

      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

      // Attach agent block if onboarding as agent (per mobile-integration-agent-retailer.md)
      if (role === "agent") {
        signupPayload.agent = {
          name: displayName,
          phone: fullPhone,
          service_area: onboardingServiceArea || "",
          fayda_number: onboardingFaydaNumber || onboardingNationalId || "",
        };
      }

      // Attach retailer block if onboarding as retailer
      if (role === "retailer" || role === "retailor") {
        signupPayload.retailer = {
          name: displayName,
          phone: fullPhone,
          tin_number: onboardingTin || "",
          location: onboardingLatitude && onboardingLongitude
            ? `${onboardingLatitude},${onboardingLongitude}`
            : onboardingServiceArea || "",
        };
      }

      const signupResult = await authSignup(signupPayload);

      // Role-specific post-signup navigation — retailers go directly to login
      if (role === "retailer" || role === "retailor") {
        // Retailers can login immediately
        router.replace("/login");
      } else if (role === "supplier" || role === "agent") {
        // Suppliers and agents need approval
        router.replace({
          pathname: "/onboarding/pending-approval" as any,
          params: { role, status: "pending" },
        });
      } else {
        // Default to login
        router.replace("/login");
      }
    } catch (e) {
      const msg = (e as any)?.message ?? "Sign up failed";
      setError(msg);
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
            Sign up
          </ThemedText>

          <Text style={styles.fieldLabel}>First Name</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="person-outline" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="enter your first name"
              placeholderTextColor="#9a9a9a"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 5 }]}>Last Name</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="person-outline" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={lastName}
              onChangeText={setLastName}
              placeholder="enter your last name"
              placeholderTextColor="#9a9a9a"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 5 }]}>Email</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="mail-outline" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={email}
              onChangeText={setEmail}
              placeholder="demo@email.com"
              placeholderTextColor="#9a9a9a"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 5 }]}>Phone</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="phone-android" size={18} color="#0a2f4a" />
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

          <Text style={[styles.fieldLabel, { marginTop: 5 }]}>Password</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="lock-outline" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={pass}
              onChangeText={setPass}
              secureTextEntry={!showPassword}
              placeholder="enter your password"
              placeholderTextColor="#9a9a9a"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)}>
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={18}
                color="#6b6b6b"
              />
            </Pressable>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 5 }]}>
            Confirm Password
          </Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="lock-outline" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showConfirm}
              placeholder="re-enter your password"
              placeholderTextColor="#9a9a9a"
            />
            <Pressable onPress={() => setShowConfirm((v) => !v)}>
              <MaterialIcons
                name={showConfirm ? "visibility" : "visibility-off"}
                size={18}
                color="#6b6b6b"
              />
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[
              styles.signupButton,
              loading ? styles.buttonDisabled : null,
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupText}>Sign Up</Text>
            )}
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an Account? </Text>
            <Pressable onPress={() => router.replace("/login")}>
              <Text style={styles.signinLink}>Sign in</Text>
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
  container: { flexGrow: 1, paddingBottom: 40 },
  // make header responsive using percentage height and a minHeight
  headerWrap: { height: "35%", minHeight: 260, position: "relative" },
  // image fills the header container
  headerImage: { width: "100%", height: "100%" },
  logo: {
    width: "70%",
    height: "60%",
    position: "absolute",
    alignSelf: "center",
    top: -15,
  },
  formWrap: { padding: 20, marginTop: -10 },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: -50,
    color: "#fff",
  },
  phonePrefix: {
    color: "#0a2f4a",
    fontWeight: "600",
    marginLeft: 6,
    marginRight: 4,
  },
  fieldLabel: {
    color: "#0a2f4a",
    marginBottom: 1,
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
  inputText: { flex: 1, marginLeft: 10, padding: 0, color: "#0a2f4a" },
  signupButton: {
    marginTop: 20,
    backgroundColor: "#0a2f4a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonDisabled: { opacity: 0.7 },
  signupText: { color: "#fff", fontWeight: "700" },
  error: { color: "#b00020", marginTop: 12 },
  footerRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: { color: "#6b6b6b" },
  signinLink: { color: "#0a7ea4", marginLeft: 6 },
});
