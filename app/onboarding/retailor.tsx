import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";

type UploadAsset = DocumentPicker.DocumentPickerAsset;

export default function OnboardingRetailorScreen() {
  const router = useRouter();

  const [shopName, setShopName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [licenseFile, setLicenseFile] = useState<UploadAsset | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [email, setEmail] = useState("");
  const [logoFile, setLogoFile] = useState<UploadAsset | null>(null);
  const [description, setDescription] = useState("");
  const [tin, setTin] = useState("");

  const missingRequired = useMemo(() => {
    return (
      !shopName.trim() ||
      !contactName.trim() ||
      !phone.trim() ||
      !category.trim() ||
      !city.trim() ||
      !licenseFile ||
      !termsAccepted
    );
  }, [
    shopName,
    contactName,
    phone,
    category,
    city,
    licenseFile,
    termsAccepted,
  ]);

  const handlePickFile = async (
    onPick: (asset: UploadAsset | null) => void,
    options?: DocumentPicker.DocumentPickerOptions
  ) => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      ...options,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0] ?? null;
    onPick(asset);
  };

  return (
    <PageShell
      title="Retailor onboarding"
      subtitle="Tell us about your business"
      showBackButton
      style={styles.shell}
      footer={
        <Pressable
          style={[styles.continueButton, missingRequired && styles.buttonOff]}
          onPress={() =>
            router.push({
              pathname: "/onboarding/dropoff",
              params: { role: "retailor" },
            })
          }
          disabled={missingRequired}
        >
          <ThemedText type="defaultSemiBold" style={styles.continueText}>
            Continue to dropoff
          </ThemedText>
        </Pressable>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.form}
      >
        <SectionTitle title="Required" />

        <FieldLabel label="Shop Name" required />
        <TextInput
          style={styles.input}
          value={shopName}
          onChangeText={setShopName}
          placeholder="Enter shop name"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Contact Person Name" required />
        <TextInput
          style={styles.input}
          value={contactName}
          onChangeText={setContactName}
          placeholder="Enter contact name"
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

        <FieldLabel label="Product Category" required />
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="e.g. Groceries"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="City" required />
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="Enter city"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Business License Upload" required />
        <UploadRow
          label={licenseFile?.name ?? "Upload business license"}
          onPress={() =>
            handlePickFile(setLicenseFile, {
              type: ["application/pdf", "image/*"],
            })
          }
          filled={Boolean(licenseFile)}
        />

        <Pressable
          style={styles.termsRow}
          onPress={() => setTermsAccepted((prev) => !prev)}
        >
          <View
            style={[
              styles.checkbox,
              termsAccepted && styles.checkboxChecked,
            ]}
          >
            {termsAccepted ? (
              <MaterialIcons name="check" size={14} color="#fff" />
            ) : null}
          </View>
          <ThemedText type="default" style={styles.termsText}>
            I accept the terms and conditions
          </ThemedText>
        </Pressable>

        <SectionTitle title="Optional" />

        <FieldLabel label="Email" />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#8a8a8a"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <FieldLabel label="Logo" />
        <UploadRow
          label={logoFile?.name ?? "Upload logo"}
          onPress={() =>
            handlePickFile(setLogoFile, {
              type: ["image/*"],
            })
          }
          filled={Boolean(logoFile)}
        />

        <FieldLabel label="Description" />
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Tell customers about your business"
          placeholderTextColor="#8a8a8a"
          multiline
        />

        <FieldLabel label="TIN" />
        <TextInput
          style={styles.input}
          value={tin}
          onChangeText={setTin}
          placeholder="Enter TIN"
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

function UploadRow({
  label,
  onPress,
  filled,
}: {
  label: string;
  onPress: () => void;
  filled?: boolean;
}) {
  return (
    <Pressable style={styles.uploadRow} onPress={onPress}>
      <View style={styles.uploadLeft}>
        <MaterialIcons
          name={filled ? "task-alt" : "upload-file"}
          size={20}
          color={filled ? "#2e7d32" : "#6b6b6b"}
        />
        <ThemedText type="default" style={styles.uploadText}>
          {label}
        </ThemedText>
      </View>
      <MaterialIcons name="chevron-right" size={22} color="#8a1d1d" />
    </Pressable>
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
  textarea: { minHeight: 96, textAlignVertical: "top" },
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
  },
  uploadLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  uploadText: { marginLeft: 8, color: "#55656d" },
  termsRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },
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
  termsText: { marginLeft: 8, color: "#333" },
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
