import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { marketRegisterAgent } from "@/lib/api/clients";

export default function AgentRegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [faydaNumber, setFaydaNumber] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [nationalId, setNationalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid =
    name.trim() &&
    phone.trim() &&
    serviceArea.trim() &&
    faydaNumber.trim() &&
    gender &&
    nationalId.trim();

  const handleRegister = async () => {
    if (!isFormValid) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const fullPhone = phone.startsWith("+251") ? phone : `+251${phone}`;

      const payload = {
        name: name.trim(),
        phone: fullPhone,
        service_area: serviceArea.trim(),
        fayda_number: faydaNumber.trim(),
        gender: gender,
        national_id: nationalId.trim(),
      };

      await marketRegisterAgent(payload);

      // Redirect to agent's retailers page after successful registration
      router.replace("/agent/retailers");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Agent Registration"
      subtitle="Register as an agent"
      showBackButton
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
          <Text style={styles.fieldLabel}>Full Name *</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="person" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
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

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Service Area *</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="location-on" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={serviceArea}
              onChangeText={setServiceArea}
              placeholder="e.g., Bole, Addis Ababa"
              placeholderTextColor="#9a9a9a"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>FAYDA Number *</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="badge" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={faydaNumber}
              onChangeText={setFaydaNumber}
              placeholder="12-digit FAYDA number"
              placeholderTextColor="#9a9a9a"
              keyboardType="number-pad"
              maxLength={12}
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>National ID *</Text>
          <View style={styles.inputBox}>
            <MaterialIcons name="credit-card" size={18} color="#0a2f4a" />
            <TextInput
              style={styles.inputText}
              value={nationalId}
              onChangeText={setNationalId}
              placeholder="Enter national ID number"
              placeholderTextColor="#9a9a9a"
              keyboardType="number-pad"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Gender *</Text>
          <View style={styles.genderRow}>
            <Pressable
              style={[
                styles.genderButton,
                gender === "Male" && styles.genderButtonActive,
              ]}
              onPress={() => setGender("Male")}
            >
              <MaterialIcons
                name={gender === "Male" ? "radio-button-checked" : "radio-button-unchecked"}
                size={20}
                color={gender === "Male" ? "#0a2f4a" : "#6b6b6b"}
              />
              <Text
                style={[
                  styles.genderText,
                  gender === "Male" && styles.genderTextActive,
                ]}
              >
                Male
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.genderButton,
                gender === "Female" && styles.genderButtonActive,
              ]}
              onPress={() => setGender("Female")}
            >
              <MaterialIcons
                name={gender === "Female" ? "radio-button-checked" : "radio-button-unchecked"}
                size={20}
                color={gender === "Female" ? "#0a2f4a" : "#6b6b6b"}
              />
              <Text
                style={[
                  styles.genderText,
                  gender === "Female" && styles.genderTextActive,
                ]}
              >
                Female
              </Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[
              styles.registerButton,
              (!isFormValid || loading) && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerText}>Register as Agent</Text>
            )}
          </Pressable>
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
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#0a2f4a",
    backgroundColor: "#fff",
  },
  genderButtonActive: {
    backgroundColor: "rgba(10, 47, 74, 0.05)",
  },
  genderText: {
    marginLeft: 8,
    color: "#6b6b6b",
    fontSize: 15,
  },
  genderTextActive: {
    color: "#0a2f4a",
    fontWeight: "600",
  },
  error: {
    color: "#b00020",
    marginTop: 12,
    fontSize: 14,
  },
  registerButton: {
    marginTop: 24,
    backgroundColor: "#0a2f4a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonDisabled: { opacity: 0.6 },
  registerText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
