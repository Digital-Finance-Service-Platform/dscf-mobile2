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
import { ThemedText } from "@/components/themed-text";
import { useRouter } from "expo-router";

export default function ForgotScreen() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      // Placeholder: wire real API call here if desired
      await new Promise((r) => setTimeout(r, 900));
      setSent(true);
    } catch (e) {
      // noop
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
            Forgot Password
          </ThemedText>

          <Text style={styles.infoText}>
            Enter your email address or phone number and we'll send instructions
            to reset your password.
          </Text>

          {sent ? (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.success}>
                If an account exists for that address, instructions have been
                sent.
              </Text>
              <Pressable
                onPress={() => router.replace("/login")}
                style={styles.backButton}
              >
                <Text style={styles.backText}>Back to Sign in</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                Email or phone
              </Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.inputText}
                  value={value}
                  onChangeText={setValue}
                  placeholder="you@email.com or +123456789"
                  placeholderTextColor="#9a9a9a"
                  autoCapitalize="none"
                />
              </View>

              <Pressable
                style={[
                  styles.loginButton,
                  loading ? styles.buttonDisabled : null,
                ]}
                onPress={handleSend}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Send reset link</Text>
                )}
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>
                  Remembered your password?{" "}
                </Text>
                <Pressable onPress={() => router.replace("/login")}>
                  <Text style={styles.signupLink}>Sign in</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { paddingBottom: 40 },
  headerWrap: { height: 220, position: "relative" },
  headerImage: { width: "100%", height: "160%" },
  logo: { width: 120, height: 92, position: "absolute", left: 20, top: 22 },
  formWrap: { padding: 20, marginTop: -30 },
  title: { fontSize: 28, marginBottom: 8, color: "#0a2f4a" },
  infoText: { color: "#6b6b6b", marginTop: 4 },
  fieldLabel: { color: "#6b6b6b", marginBottom: 6 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0a2f4a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginTop: 4,
  },
  inputText: { flex: 1, marginLeft: 0, padding: 0 },
  loginButton: {
    marginTop: 20,
    backgroundColor: "#0a2f4a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonDisabled: { opacity: 0.7 },
  loginText: { color: "#fff", fontWeight: "700" },
  backButton: { marginTop: 12, alignItems: "center" },
  backText: { color: "#0a7ea4", fontWeight: "600" },
  footerRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { color: "#6b6b6b" },
  signupLink: { color: "#0a7ea4", marginLeft: 6 },
  success: { color: "#246b3a" },
});
