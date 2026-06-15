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

export default function PasswordCreationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
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

    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Pass all data including password to signup screen
    const signupData = {
      ...params,
      password,
      confirmPassword,
    };

    setLoading(false);

    // Navigate to signup to complete registration
    router.push({
      pathname: "/signup",
      params: signupData,
    });
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
              Continue to Sign Up
            </ThemedText>
          )}
        </Pressable>
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
