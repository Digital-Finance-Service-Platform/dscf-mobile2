import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import {
    marketFetch,
    marketResubmitSupplier
} from "@/lib/api/clients";
import { useSdk } from "@/lib/sdk/context";

type UploadAsset = DocumentPicker.DocumentPickerAsset;

export default function ChangesRequestedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fetchUser } = useSdk();

  const role = Array.isArray(params.role) ? params.role[0] : params.role;
  const entityId = Array.isArray(params.entityId)
    ? params.entityId[0]
    : params.entityId;

  const isAgent = role === "agent";
  const roleTitle = isAgent ? "Agent" : "Supplier";
  const endpointPrefix = isAgent ? "agents" : "suppliers";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewReason, setReviewReason] = useState<string | null>(null);

  // Editable fields
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Document uploads
  const [licenseFile, setLicenseFile] = useState<UploadAsset | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<UploadAsset[]>([]);

  useEffect(() => {
    loadSupplierData();
  }, [entityId]);

  const loadSupplierData = async () => {
    if (!entityId) {
      Alert.alert("Error", `No ${roleTitle.toLowerCase()} ID provided`);
      return;
    }

    try {
      setLoading(true);
      const response = await marketFetch(`/${endpointPrefix}/${entityId}`, {
        method: "GET",
      });

      const entity = response?.data;
      if (entity) {
        setBusinessName(entity.name || entity.business_name || "");
        setAddress(entity.address || "");
        setContactPhone(entity.contact_phone || entity.phone || "");
        setReviewReason(entity.review_reason || null);
      }
    } catch (err: any) {
      console.error("[ChangesRequested] loadData error:", err);
      Alert.alert("Error", err?.message || `Failed to load ${roleTitle.toLowerCase()} data`);
    } finally {
      setLoading(false);
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

  const handleResubmit = async () => {
    if (!entityId) {
      Alert.alert("Error", `No ${roleTitle.toLowerCase()} ID provided`);
      return;
    }

    try {
      setSubmitting(true);

      // Build payload for resubmit
      const payload: any = {};

      // Add corrected fields
      if (businessName.trim()) {
        payload.name = businessName.trim();
      }
      if (address.trim()) {
        payload.address = address.trim();
      }
      if (contactPhone.trim()) {
        payload.contact_phone = contactPhone.trim();
      }

      // For suppliers, handle document uploads via FormData
      let response;
      if (!isAgent) {
        const formData = new FormData();
        
        Object.keys(payload).forEach(key => {
          formData.append(`supplier[${key}]`, payload[key]);
        });

        // Add documents if selected
        if (licenseFile) {
          formData.append("business_license", {
            uri: licenseFile.uri,
            name: licenseFile.name,
            type: licenseFile.mimeType || "application/octet-stream",
          } as any);
        }

        additionalDocs.forEach((doc, idx) => {
          formData.append("additional_documents[]", {
            uri: doc.uri,
            name: doc.name,
            type: doc.mimeType || "application/octet-stream",
          } as any);
        });

        response = await marketResubmitSupplier(entityId, formData);
      } else {
        // For agents, use JSON payload (agents typically don't upload documents)
        response = await marketFetch(`/${endpointPrefix}/${entityId}/resubmit`, {
          method: "POST",
          body: JSON.stringify({ agent: payload }),
        });
      }

      // Check the updated status from response
      const updatedStatus = response?.data?.review_status || response?.data?.status;

      // Refresh the user profile to update cached state
      await fetchUser();

      if (updatedStatus === "pending") {
        Alert.alert(
          "Success",
          "Your application has been resubmitted for review.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace({
                  pathname: "/onboarding/pending-approval" as any,
                  params: { role, status: "pending" },
                });
              },
            },
          ]
        );
      } else {
        // Fallback if status is something else
        Alert.alert(
          "Success",
          "Your application has been resubmitted for review.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/login"),
            },
          ]
        );
      }
    } catch (err: any) {
      console.error("[ChangesRequested] handleResubmit error:", err);
      Alert.alert("Error", err?.message || "Failed to resubmit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Loading..." style={styles.shell}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0a2f4a" />
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`${roleTitle} Application`}
      subtitle="Update your application"
      showBackButton
      style={styles.shell}
      footer={
        <Pressable
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleResubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="defaultSemiBold" style={styles.submitText}>
              Resubmit Application
            </ThemedText>
          )}
        </Pressable>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Modification Reason Card */}
        {reviewReason ? (
          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <MaterialIcons name="info-outline" size={24} color="#f57c00" />
              <ThemedText type="defaultSemiBold" style={styles.reasonTitle}>
                Admin Feedback
              </ThemedText>
            </View>
            <ThemedText type="default" style={styles.reasonText}>
              {reviewReason}
            </ThemedText>
          </View>
        ) : null}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <ThemedText type="defaultSemiBold" style={styles.instructionsTitle}>
            What to do
          </ThemedText>
          <ThemedText type="default" style={styles.instructionsText}>
            Please review the admin feedback above and update the required
            information below. You can edit any field and re-upload documents if
            needed.
          </ThemedText>
        </View>

        {/* Editable Fields */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Business Information
          </ThemedText>

          <FieldLabel label="Business Name" />
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Enter business name"
            placeholderTextColor="#8a8a8a"
          />

          <FieldLabel label="Address" />
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter business address"
            placeholderTextColor="#8a8a8a"
            multiline
          />

          <FieldLabel label="Contact Phone" />
          <TextInput
            style={styles.input}
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="Enter contact phone"
            placeholderTextColor="#8a8a8a"
            keyboardType="phone-pad"
          />
        </View>

        {/* Document Re-upload - Only for Suppliers */}
        {!isAgent && (
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Documents
            </ThemedText>

            <FieldLabel label="Business License (optional re-upload)" />
            <UploadRow
              label={
                licenseFile?.name ?? "Upload new business license (PDF or Image)"
              }
              onPress={() =>
                handlePickFile(setLicenseFile, {
                  type: ["application/pdf", "image/*"],
                })
              }
              filled={Boolean(licenseFile)}
            />

            <FieldLabel label="Additional Documents (optional)" />
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
                    <MaterialIcons
                      name="insert-drive-file"
                      size={16}
                      color="#6b6b6b"
                    />
                    <ThemedText type="default" style={styles.docName}>
                      {doc.name}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {/* Help Text */}
        <View style={styles.helpCard}>
          <MaterialIcons name="help-outline" size={20} color="#0a7ea4" />
          <ThemedText type="default" style={styles.helpText}>
            Only update the fields that need correction. Leave others as-is.
          </ThemedText>
        </View>
      </ScrollView>
    </PageShell>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <View style={styles.labelRow}>
      <ThemedText type="default" style={styles.label}>
        {label}
      </ThemedText>
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingBottom: 40 },
  reasonCard: {
    backgroundColor: "#fff3e0",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f57c00",
    marginBottom: 16,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reasonTitle: {
    fontSize: 16,
    color: "#e65100",
    marginLeft: 8,
  },
  reasonText: {
    fontSize: 14,
    color: "#55656d",
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0a7ea4",
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    color: "#0a2f4a",
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 14,
    color: "#55656d",
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#0a2f4a",
    marginBottom: 12,
  },
  labelRow: {
    marginTop: 12,
    marginBottom: 6,
  },
  label: { color: "#0a2f4a" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    color: "#0a2f4a",
  },
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
    marginTop: 4,
  },
  uploadLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  uploadText: { marginLeft: 8, color: "#55656d", flex: 1 },
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
  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  helpText: {
    marginLeft: 10,
    color: "#2e7d32",
    fontSize: 13,
    flex: 1,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: "#8a1d1d",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.55 },
  submitText: { color: "#fff" },
});
