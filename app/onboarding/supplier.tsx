import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from "react-native";

import { OpenStreetMapView } from "@/components/openstreetmap-view";
import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";

type UploadAsset = DocumentPicker.DocumentPickerAsset;

type Coordinate = {
  latitude: number;
  longitude: number;
};

const DEFAULT_REGION = {
  latitude: 9.0054,
  longitude: 38.7636,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function OnboardingSupplierScreen() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);

  // Required fields
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState<Coordinate | null>(null);
  const [licenseFile, setLicenseFile] = useState<UploadAsset | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Optional fields
  const [email, setEmail] = useState("");
  const [additionalDocs, setAdditionalDocs] = useState<UploadAsset[]>([]);

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const missingRequired = useMemo(() => {
    return (
      !businessName.trim() ||
      !contactName.trim() ||
      !phone.trim() ||
      !pin ||
      !licenseFile ||
      !termsAccepted
    );
  }, [businessName, contactName, phone, pin, licenseFile, termsAccepted]);

  const handleMapPress = (coordinate: Coordinate) => {
    setPin(coordinate);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasLocationPermission(false);
        return;
      }
      setHasLocationPermission(true);
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coordinate = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setPin(coordinate);
      setUserLocation(coordinate);
    } catch (error) {
      console.error("Location error:", error);
    } finally {
      setIsLocating(false);
    }
  };

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

  const handlePickAdditionalDocs = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
      type: ["application/pdf", "image/*"],
    });

    if (result.canceled) {
      return;
    }

    setAdditionalDocs([...additionalDocs, ...(result.assets ?? [])]);
  };

  const handleContinue = () => {
    router.push({
      pathname: "/onboarding/otp" as any,
      params: {
        role: "supplier",
        businessName,
        contactName,
        phone,
        latitude: pin?.latitude,
        longitude: pin?.longitude,
        email,
        licenseFileName: licenseFile?.name,
        additionalDocsCount: additionalDocs.length,
      },
    });
  };

  return (
    <PageShell
      title="Supplier onboarding"
      subtitle="Complete your KYC verification"
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
        <SectionTitle title="Required" />

        <FieldLabel label="Business Name" required />
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Enter business name"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Contact Person Name" required />
        <TextInput
          style={styles.input}
          value={contactName}
          onChangeText={setContactName}
          placeholder="Enter contact person name"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Phone Number" required />
        <View style={styles.phoneInputRow}>
          <ThemedText type="default" style={styles.phonePrefix}>+251</ThemedText>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            value={phone}
            onChangeText={setPhone}
            placeholder="9xx xxx xxx"
            placeholderTextColor="#8a8a8a"
            keyboardType="phone-pad"
          />
        </View>

        <FieldLabel label="Shop Location on Map" required />
        <ThemedText type="default" style={styles.mapHint}>
          Tap the map to place a pin at your business location
        </ThemedText>

        <View style={styles.mapContainer}>
          <OpenStreetMapView
            initialRegion={DEFAULT_REGION}
            onPress={handleMapPress}
            marker={pin}
            style={styles.map}
            showsUserLocation={hasLocationPermission}
            userLocation={userLocation}
          />
        </View>

        <Pressable
          style={[styles.locationButton, isLocating && styles.buttonDisabled]}
          onPress={handleUseCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator color="#0a2f4a" />
          ) : (
            <MaterialIcons name="my-location" size={18} color="#0a2f4a" />
          )}
          <ThemedText type="default" style={styles.locationButtonText}>
            Use current location
          </ThemedText>
        </Pressable>

        {pin ? (
          <View style={styles.infoRow}>
            <MaterialIcons name="check-circle" size={18} color="#2e7d32" />
            <ThemedText type="default" style={styles.infoText}>
              Location selected: {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
            </ThemedText>
          </View>
        ) : null}

        <FieldLabel label="Business License Upload" required />
        <UploadRow
          label={licenseFile?.name ?? "Upload business license (PDF or Image)"}
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
            style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
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

        <FieldLabel label="Additional Documents" />
        <UploadRow
          label={
            additionalDocs.length > 0
              ? `${additionalDocs.length} document(s) uploaded`
              : "Upload additional documents (optional)"
          }
          onPress={handlePickAdditionalDocs}
          filled={additionalDocs.length > 0}
        />
        {additionalDocs.length > 0 ? (
          <View style={styles.docsList}>
            {additionalDocs.map((doc, idx) => (
              <View key={idx} style={styles.docItem}>
                <MaterialIcons name="insert-drive-file" size={16} color="#6b6b6b" />
                <ThemedText type="default" style={styles.docName}>
                  {doc.name}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}
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
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },
  phonePrefix: {
    color: "#0a2f4a",
    fontWeight: "600",
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  mapHint: {
    color: "#6b6b6b",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.12)",
    backgroundColor: "#e5ebe7",
  },
  map: { flex: 1 },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  webFallbackText: { color: "#55656d" },
  locationButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    backgroundColor: "#fff",
  },
  buttonDisabled: { opacity: 0.6 },
  locationButtonText: { marginLeft: 8, color: "#0a2f4a" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
  },
  infoText: { marginLeft: 8, color: "#2e7d32", fontSize: 12 },
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
  uploadText: { marginLeft: 8, color: "#55656d", flex: 1 },
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
  termsText: { marginLeft: 8, color: "#333", flex: 1 },
  docsList: {
    marginTop: 8,
    gap: 6,
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
  },
  docName: {
    marginLeft: 8,
    color: "#6b6b6b",
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
