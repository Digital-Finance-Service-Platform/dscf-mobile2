import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Text,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/themed-text";
import { authSignup } from "@/lib/api/clients";
import { useRouter } from "expo-router";

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete all fields");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const parts = name.trim().split(/\s+/);
      const firstName = parts.shift() || "";
      const lastName = parts.join(" ") || undefined;

      await authSignup({
        user: {
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
          password_confirmation: confirm || password,
          user_profile_attributes: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      router.replace("/login");
    } catch (e) {
      const msg = (e as any)?.message ?? "Sign up failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerWrap}>
          <Image
            source={require("@/assets/images/new5.png")}
            style={styles.headerImage}
            contentFit="cover"
          />
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.formWrap}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            Sign up
          </ThemedText>

          <Text style={styles.fieldLabel}>Full Name</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="person-outline" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={name}
              onChangeText={setName}
              placeholder="enter your full name"
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
            <TextInput
              style={styles.inputText}
              value={phone}
              onChangeText={setPhone}
              placeholder="+251912345678"
              placeholderTextColor="#9a9a9a"
              keyboardType="phone-pad"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 5 }]}>Password</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="lock-outline" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={password}
              onChangeText={setPassword}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, paddingBottom: 0 },
  // make header responsive using percentage height and a minHeight
  headerWrap: { height: "42%", minHeight: 310, position: "relative" },
  // image fills the header container
  headerImage: { width: "100%", height: "100%" },
  logo: {
    width: "70%",
    height: "60%",
    position: "absolute",
    alignSelf: "center",
    top: -15,
  },
  formWrap: { padding: 20, marginTop: -30 },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
    marginBottom: 10,
    color: "#0a2f4a",
    marginTop: -50,
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
