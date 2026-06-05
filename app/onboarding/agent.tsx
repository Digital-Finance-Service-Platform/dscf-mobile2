import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";

export default function OnboardingAgentScreen() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [fayda, setFayda] = useState("");

  const missingRequired = !code.trim() || !name.trim() || !phone.trim() || !serviceArea.trim() || !fayda.trim();

  const handleContinue = () => {
    if (missingRequired) {
      alert("Please fill in all required fields");
      return;
    }
    router.push({
      pathname: "/signup",
      params: {
        role: "agent",
        code,
        name,
        phone,
        serviceArea,
        fayda,
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
            Continue to sign up
          </ThemedText>
        </Pressable>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.form}
      >
        <SectionTitle title="Required" />

        <FieldLabel label="Agent Code" required />
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="e.g., AGT-A1B2C3D4"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Full Name" required />
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
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

        <FieldLabel label="Service Area" required />
        <TextInput
          style={styles.input}
          value={serviceArea}
          onChangeText={setServiceArea}
          placeholder="e.g., Addis Ababa"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Fayda Number" required />
        <TextInput
          style={styles.input}
          value={fayda}
          onChangeText={setFayda}
          placeholder="e.g., 123456789012345678"
          placeholderTextColor="#8a8a8a"
        />
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
