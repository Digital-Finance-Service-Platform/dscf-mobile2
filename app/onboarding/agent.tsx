import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import { faydaVerify } from "@/lib/api/clients";

type FaydaData = {
  verified: boolean;
  full_name: string;
  gender: string;
  date_of_birth: string;
  fayda_number: string;
};

export default function OnboardingAgentScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [nationalId, setNationalId] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [faydaNumber, setFaydaNumber] = useState("");
  const [faydaData, setFaydaData] = useState<FaydaData | null>(null);
  const [faydaLoading, setFaydaLoading] = useState(false);
  const [faydaError, setFaydaError] = useState<string | null>(null);

  const missingRequired = useMemo(() => {
    return (
      !fullName.trim() ||
      !phone.trim() ||
      !gender ||
      !nationalId.trim() ||
      !serviceArea.trim()
    );
  }, [fullName, phone, gender, nationalId, serviceArea]);

  const handleVerifyFayda = async () => {
    if (!faydaNumber.trim() || faydaNumber.length !== 12) {
      setFaydaError("FAYDA number must be 12 digits");
      return;
    }
    setFaydaLoading(true);
    setFaydaError(null);
    try {
      const res = await faydaVerify(faydaNumber);
      const data = res?.data ?? res;
      setFaydaData(data);
      // Auto-fill name if returned and currently empty
      if (data?.full_name && !fullName) {
        setFullName(data.full_name);
      }
      if (data?.gender && !gender) {
        setGender(data.gender.toLowerCase() === "male" ? "male" : "female");
      }
    } catch (err: any) {
      setFaydaError(err?.message || "FAYDA verification failed");
    } finally {
      setFaydaLoading(false);
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: "/onboarding/otp" as any,
      params: {
        role: "agent",
        fullName,
        phone,
        gender,
        nationalId,
        serviceArea,
        faydaNumber: faydaData?.fayda_number || faydaNumber,
      },
    });
  };

  return (
    <PageShell
      title="Agent onboarding"
      subtitle="Tell us about yourself"
      showBackButton
      style={styles.shell}
      footer={
        <Pressable
          style={[styles.continueButton, missingRequired && styles.buttonOff]}
          onPress={handleContinue}
          disabled={missingRequired}
        >
          <ThemedText type="defaultSemiBold" style={styles.continueText}>
            Continue to verification
          </ThemedText>
        </Pressable>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.form}
      >
        <SectionTitle title="FAYDA Identity Verification" />

        <FieldLabel label="FAYDA Number (12 digits)" required />
        <View style={styles.faydaRow}>
          <TextInput
            style={[styles.input, styles.faydaInput]}
            value={faydaNumber}
            onChangeText={setFaydaNumber}
            placeholder="123456789012"
            placeholderTextColor="#8a8a8a"
            keyboardType="number-pad"
            maxLength={12}
          />
          <Pressable
            style={[styles.faydaButton, faydaLoading && styles.buttonDisabled]}
            onPress={handleVerifyFayda}
            disabled={faydaLoading || faydaNumber.length !== 12}
          >
            {faydaLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText type="defaultSemiBold" style={styles.faydaButtonText}>
                Verify
              </ThemedText>
            )}
          </Pressable>
        </View>

        {faydaError ? (
          <View style={styles.faydaErrorBox}>
            <MaterialIcons name="error-outline" size={16} color="#b00020" />
            <ThemedText type="default" style={styles.faydaErrorText}>
              {faydaError}
            </ThemedText>
          </View>
        ) : null}

        {faydaData?.verified ? (
          <View style={styles.faydaSuccessBox}>
            <MaterialIcons name="check-circle" size={18} color="#2e7d32" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <ThemedText type="defaultSemiBold" style={styles.faydaSuccessTitle}>
                Identity Verified
              </ThemedText>
              <ThemedText type="default" style={styles.faydaSuccessText}>
                {faydaData.full_name} | {faydaData.gender} | DOB: {faydaData.date_of_birth}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <SectionTitle title="Required" />

        <FieldLabel label="Full Name" required />
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Phone Number" required />
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+251 9xx xxx xxx"
          placeholderTextColor="#8a8a8a"
          keyboardType="phone-pad"
        />

        <FieldLabel label="Gender" required />
        <View style={styles.genderRow}>
          <Pressable
            style={[
              styles.genderButton,
              gender === "male" && styles.genderButtonActive,
            ]}
            onPress={() => setGender("male")}
          >
            <MaterialIcons
              name={gender === "male" ? "radio-button-checked" : "radio-button-unchecked"}
              size={20}
              color={gender === "male" ? "#0a2f4a" : "#6b6b6b"}
            />
            <ThemedText
              type="default"
              style={[
                styles.genderText,
                gender === "male" && styles.genderTextActive,
              ]}
            >
              Male
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.genderButton,
              gender === "female" && styles.genderButtonActive,
            ]}
            onPress={() => setGender("female")}
          >
            <MaterialIcons
              name={gender === "female" ? "radio-button-checked" : "radio-button-unchecked"}
              size={20}
              color={gender === "female" ? "#0a2f4a" : "#6b6b6b"}
            />
            <ThemedText
              type="default"
              style={[
                styles.genderText,
                gender === "female" && styles.genderTextActive,
              ]}
            >
              Female
            </ThemedText>
          </Pressable>
        </View>

        <FieldLabel label="National ID Number" required />
        <TextInput
          style={styles.input}
          value={nationalId}
          onChangeText={setNationalId}
          placeholder="Enter your national ID"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Service Location Area" required />
        <TextInput
          style={styles.input}
          value={serviceArea}
          onChangeText={setServiceArea}
          placeholder="e.g., Addis Ababa - Bole"
          placeholderTextColor="#8a8a8a"
        />

        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={18} color="#0a7ea4" />
          <ThemedText type="default" style={styles.infoText}>
            After approval, you'll receive a unique Agent ID to start assisting retailers
          </ThemedText>
        </View>
      </ScrollView>
    </PageShell>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionRow}>
      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
        {title}
      </ThemedText>
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <View style={styles.labelRow}>
      <ThemedText type="default" style={styles.label}>
        {label}
      </ThemedText>
      {required ? (
        <ThemedText type="default" style={styles.requiredMark}>
          Required
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  form: { paddingBottom: 40 },
  sectionRow: { marginTop: 10, marginBottom: 8 },
  sectionTitle: { color: "#0a2f4a", fontSize: 18 },
  labelRow: {
    marginTop: 12,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { color: "#0a2f4a" },
  requiredMark: { color: "#8a1d1d", fontSize: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    color: "#0a2f4a",
  },
  faydaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  faydaInput: { flex: 1 },
  faydaButton: {
    backgroundColor: "#0a2f4a",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  faydaButtonText: { color: "#fff", fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
  faydaErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#ffebee",
    borderRadius: 6,
  },
  faydaErrorText: { marginLeft: 6, color: "#b00020", fontSize: 13, flex: 1 },
  faydaSuccessBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 12,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
  },
  faydaSuccessTitle: { color: "#2e7d32", fontSize: 14 },
  faydaSuccessText: { color: "#55656d", fontSize: 12, marginTop: 2 },
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    backgroundColor: "#fff",
  },
  genderButtonActive: {
    borderColor: "#0a2f4a",
    borderWidth: 2,
    backgroundColor: "rgba(10, 47, 74, 0.05)",
  },
  genderText: {
    marginLeft: 8,
    color: "#6b6b6b",
  },
  genderTextActive: {
    color: "#0a2f4a",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    padding: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
  },
  infoText: {
    marginLeft: 8,
    color: "#0a7ea4",
    fontSize: 13,
    flex: 1,
  },
  continueButton: {
    marginTop: 20,
    backgroundColor: "#8a1d1d",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonOff: { opacity: 0.55 },
  continueText: { color: "#fff" },
});
