/**
 * Test Document Submission Flow
 * 
 * This screen demonstrates and tests the complete document submission
 * and review API integration.
 */

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
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
    coreCreateBusiness,
    coreCreateBusinessDocument,
    coreDeleteBusinessDocument,
    coreGetBusiness,
    coreGetBusinessDocuments,
    coreGetMyBusiness,
    coreResubmitBusiness,
    coreSubmitBusiness,
    marketGetMySuppliers,
    marketGetSupplier,
    marketRegisterSupplier,
    marketResubmitSupplier,
} from "@/lib/api/clients";
import {
    buildBusinessFormData,
    buildBusinessResubmitFormData,
    buildSupplierRegistrationFormData,
    buildSupplierResubmitFormData,
    DocumentAsset,
    pickDocument,
    pickDocuments,
} from "@/lib/document-helpers";
import {
    extractReviewStatus,
    getStatusColor,
    getStatusMessage,
    ReviewState,
} from "@/lib/review-status";
import { useSdk } from "@/lib/sdk/context";

type TestMode = "business" | "supplier" | "none";

export default function TestDocumentSubmissionScreen() {
  const router = useRouter();
  const { user } = useSdk();

  const [mode, setMode] = useState<TestMode>("none");
  const [loading, setLoading] = useState(false);
  const [reviewState, setReviewState] = useState<ReviewState | null>(null);

  // Business fields
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [businessLicense, setBusinessLicense] = useState<DocumentAsset | null>(null);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  // Supplier fields
  const [supplierBusinessName, setSupplierBusinessName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierPassword, setSupplierPassword] = useState("Test123456");
  const [supplierLocation, setSupplierLocation] = useState("Addis Ababa");
  const [supplierLicense, setSupplierLicense] = useState<DocumentAsset | null>(null);
  const [supplierAdditionalDocs, setSupplierAdditionalDocs] = useState<DocumentAsset[]>([]);
  const [supplierId, setSupplierId] = useState<number | null>(null);

  useEffect(() => {
    loadMyEntities();
  }, []);

  const loadMyEntities = async () => {
    try {
      // Try to load existing business
      const businessRes = await coreGetMyBusiness();
      if (businessRes?.data) {
        const state = extractReviewStatus(businessRes, "business");
        if (state) {
          setReviewState(state);
          setBusinessId(state.entityId as number);
          setBusinessName(businessRes.data.name || "");
          setBusinessEmail(businessRes.data.contact_email || "");
          setBusinessPhone(businessRes.data.contact_phone || "");
          setTinNumber(businessRes.data.tin_number || "");
        }
      }
    } catch (err) {
      console.log("[TestDocSubmit] No business found or error:", err);
    }

    try {
      // Try to load existing supplier
      const supplierRes = await marketGetMySuppliers();
      if (supplierRes?.data && supplierRes.data.length > 0) {
        const supplier = supplierRes.data[0];
        const state = extractReviewStatus(supplier, "supplier");
        if (state) {
          setReviewState(state);
          setSupplierId(state.entityId as number);
          setSupplierBusinessName(supplier.name || supplier.business_name || "");
          setSupplierPhone(supplier.contact_phone || supplier.phone || "");
          setSupplierEmail(supplier.email || "");
          setSupplierLocation(supplier.location || "");
        }
      }
    } catch (err) {
      console.log("[TestDocSubmit] No supplier found or error:", err);
    }
  };

  // ─── Business Flow ───────────────────────────────────────────────────────

  const handleCreateBusiness = async () => {
    if (!businessName || !businessPhone) {
      Alert.alert("Error", "Business name and phone are required");
      return;
    }

    setLoading(true);
    try {
      const formData = buildBusinessFormData({
        name: businessName,
        contact_email: businessEmail || undefined,
        contact_phone: businessPhone,
        tin_number: tinNumber || undefined,
        business_license: businessLicense || undefined,
      });

      const result = await coreCreateBusiness(formData);
      const state = extractReviewStatus(result, "business");
      
      if (state) {
        setReviewState(state);
        setBusinessId(state.entityId as number);
        Alert.alert("Success", `Business created in ${state.status} status`);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBusiness = async () => {
    if (!businessId) {
      Alert.alert("Error", "No business ID");
      return;
    }

    setLoading(true);
    try {
      const result = await coreSubmitBusiness(businessId);
      const state = extractReviewStatus(result, "business");
      
      if (state) {
        setReviewState(state);
        Alert.alert("Success", `Business submitted for review (status: ${state.status})`);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to submit business");
    } finally {
      setLoading(false);
    }
  };

  const handleResubmitBusiness = async () => {
    if (!businessId) {
      Alert.alert("Error", "No business ID");
      return;
    }

    setLoading(true);
    try {
      const formData = buildBusinessResubmitFormData({
        name: businessName || undefined,
        contact_email: businessEmail || undefined,
        contact_phone: businessPhone || undefined,
        tin_number: tinNumber || undefined,
        business_license: businessLicense || undefined,
      });

      const result = await coreResubmitBusiness(businessId, formData);
      const state = extractReviewStatus(result, "business");
      
      if (state) {
        setReviewState(state);
        Alert.alert("Success", `Business resubmitted (status: ${state.status})`);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to resubmit business");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBusinessDocument = async () => {
    if (!businessId) {
      Alert.alert("Error", "No business ID");
      return;
    }

    const doc = await pickDocument();
    if (!doc) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("document[file]", {
        uri: doc.uri,
        name: doc.name,
        type: doc.mimeType || "application/octet-stream",
      } as any);

      await coreCreateBusinessDocument(businessId, formData);
      Alert.alert("Success", "Document uploaded");
      await loadBusinessDocuments();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessDocuments = async () => {
    if (!businessId) return;

    try {
      const result = await coreGetBusinessDocuments(businessId);
      setDocuments(result?.data || []);
    } catch (err) {
      console.error("[TestDocSubmit] loadBusinessDocuments error:", err);
    }
  };

  const handleDeleteBusinessDocument = async (documentId: number) => {
    if (!businessId) return;

    setLoading(true);
    try {
      await coreDeleteBusinessDocument(businessId, documentId);
      Alert.alert("Success", "Document deleted");
      await loadBusinessDocuments();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBusinessStatus = async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      const result = await coreGetBusiness(businessId);
      const state = extractReviewStatus(result, "business");
      
      if (state) {
        setReviewState(state);
        Alert.alert("Status", `Current status: ${state.status}${state.reason ? `\n\nReason: ${state.reason}` : ""}`);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to refresh status");
    } finally {
      setLoading(false);
    }
  };

  // ─── Supplier Flow ───────────────────────────────────────────────────────

  const handleRegisterSupplier = async () => {
    if (!supplierBusinessName || !supplierPhone || !supplierPassword) {
      Alert.alert("Error", "Business name, phone, and password are required");
      return;
    }

    setLoading(true);
    try {
      const formData = buildSupplierRegistrationFormData({
        email: supplierEmail || undefined,
        contact_person_phone: supplierPhone,
        password: supplierPassword,
        password_confirmation: supplierPassword,
        business_name: supplierBusinessName,
        location: supplierLocation,
        business_license: supplierLicense || undefined,
        additional_documents: supplierAdditionalDocs,
      });

      const result = await marketRegisterSupplier(formData);
      const state = extractReviewStatus(result, "supplier");
      
      if (state) {
        setReviewState(state);
        setSupplierId(state.entityId as number);
        Alert.alert("Success", `Supplier registered (status: ${state.status})`);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to register supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleResubmitSupplier = async () => {
    if (!supplierId) {
      Alert.alert("Error", "No supplier ID");
      return;
    }

    setLoading(true);
    try {
      const formData = buildSupplierResubmitFormData({
        name: supplierBusinessName || undefined,
        location: supplierLocation || undefined,
        contact_phone: supplierPhone || undefined,
        business_license: supplierLicense || undefined,
        additional_documents: supplierAdditionalDocs,
      });

      const result = await marketResubmitSupplier(supplierId, formData);
      const state = extractReviewStatus(result, "supplier");
      
      if (state) {
        setReviewState(state);
        Alert.alert("Success", `Supplier resubmitted (status: ${state.status})`);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to resubmit supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSupplierStatus = async () => {
    if (!supplierId) return;

    setLoading(true);
    try {
      const result = await marketGetSupplier(supplierId);
      const state = extractReviewStatus(result, "supplier");
      
      if (state) {
        setReviewState(state);
        Alert.alert("Status", `Current status: ${state.status}${state.reason ? `\n\nReason: ${state.reason}` : ""}`);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to refresh status");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  const statusConfig = reviewState ? getStatusColor(reviewState.status) : null;

  return (
    <PageShell
      title="Test Document Submission"
      subtitle="Test the document submission & review API"
      showBackButton
      style={styles.shell}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Mode Selection */}
        {mode === "none" && (
          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Select Test Mode
            </ThemedText>
            
            <Pressable
              style={styles.modeButton}
              onPress={() => setMode("business")}
            >
              <MaterialIcons name="business" size={24} color="#0a2f4a" />
              <ThemedText type="defaultSemiBold" style={styles.modeButtonText}>
                Test Business Flow
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.modeButton}
              onPress={() => setMode("supplier")}
            >
              <MaterialIcons name="storefront" size={24} color="#0a2f4a" />
              <ThemedText type="defaultSemiBold" style={styles.modeButtonText}>
                Test Supplier Flow
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Status Display */}
        {reviewState && statusConfig && (
          <View style={[styles.statusCard, { backgroundColor: statusConfig.bgColor }]}>
            <MaterialIcons
              name={statusConfig.icon as any}
              size={32}
              color={statusConfig.iconColor}
            />
            <View style={styles.statusContent}>
              <ThemedText type="defaultSemiBold" style={styles.statusTitle}>
                Status: {reviewState.status.toUpperCase()}
              </ThemedText>
              <ThemedText type="default" style={styles.statusMessage}>
                {getStatusMessage(reviewState.status, reviewState.entityType)}
              </ThemedText>
              {reviewState.reason && (
                <View style={styles.reasonBox}>
                  <ThemedText type="default" style={styles.reasonLabel}>
                    Admin Feedback:
                  </ThemedText>
                  <ThemedText type="default" style={styles.reasonText}>
                    {reviewState.reason}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Business Test Mode */}
        {mode === "business" && (
          <>
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Business Information
              </ThemedText>

              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Business Name"
                placeholderTextColor="#8a8a8a"
              />

              <TextInput
                style={styles.input}
                value={businessEmail}
                onChangeText={setBusinessEmail}
                placeholder="Email (optional)"
                placeholderTextColor="#8a8a8a"
                keyboardType="email-address"
              />

              <TextInput
                style={styles.input}
                value={businessPhone}
                onChangeText={setBusinessPhone}
                placeholder="Phone"
                placeholderTextColor="#8a8a8a"
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                value={tinNumber}
                onChangeText={setTinNumber}
                placeholder="TIN Number (optional)"
                placeholderTextColor="#8a8a8a"
              />

              <Pressable
                style={styles.uploadButton}
                onPress={async () => {
                  const doc = await pickDocument();
                  setBusinessLicense(doc);
                }}
              >
                <MaterialIcons
                  name={businessLicense ? "task-alt" : "upload-file"}
                  size={20}
                  color={businessLicense ? "#2e7d32" : "#0a2f4a"}
                />
                <ThemedText type="default" style={styles.uploadButtonText}>
                  {businessLicense ? businessLicense.name : "Upload Business License"}
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Actions
              </ThemedText>

              {!businessId && (
                <ActionButton
                  label="1. Create Business (Draft)"
                  icon="add-business"
                  onPress={handleCreateBusiness}
                  loading={loading}
                />
              )}

              {businessId && reviewState?.status === "draft" && (
                <>
                  <ActionButton
                    label="2. Submit for Review"
                    icon="send"
                    onPress={handleSubmitBusiness}
                    loading={loading}
                  />
                  <ActionButton
                    label="Add Document"
                    icon="add"
                    onPress={handleAddBusinessDocument}
                    loading={loading}
                  />
                </>
              )}

              {businessId && reviewState?.status === "modify" && (
                <ActionButton
                  label="Resubmit Changes"
                  icon="refresh"
                  onPress={handleResubmitBusiness}
                  loading={loading}
                />
              )}

              {businessId && (
                <ActionButton
                  label="Refresh Status"
                  icon="sync"
                  onPress={handleRefreshBusinessStatus}
                  loading={loading}
                />
              )}

              {documents.length > 0 && (
                <View style={styles.docsList}>
                  <ThemedText type="defaultSemiBold" style={styles.docsTitle}>
                    Documents
                  </ThemedText>
                  {documents.map((doc) => (
                    <View key={doc.id} style={styles.docItem}>
                      <MaterialIcons name="insert-drive-file" size={16} color="#6b6b6b" />
                      <ThemedText type="default" style={styles.docName}>
                        Document {doc.id}
                      </ThemedText>
                      <Pressable onPress={() => handleDeleteBusinessDocument(doc.id)}>
                        <MaterialIcons name="delete" size={18} color="#b00020" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Supplier Test Mode */}
        {mode === "supplier" && (
          <>
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Supplier Information
              </ThemedText>

              <TextInput
                style={styles.input}
                value={supplierBusinessName}
                onChangeText={setSupplierBusinessName}
                placeholder="Business Name"
                placeholderTextColor="#8a8a8a"
              />

              <TextInput
                style={styles.input}
                value={supplierPhone}
                onChangeText={setSupplierPhone}
                placeholder="Phone"
                placeholderTextColor="#8a8a8a"
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                value={supplierEmail}
                onChangeText={setSupplierEmail}
                placeholder="Email (optional)"
                placeholderTextColor="#8a8a8a"
                keyboardType="email-address"
              />

              <TextInput
                style={styles.input}
                value={supplierPassword}
                onChangeText={setSupplierPassword}
                placeholder="Password"
                placeholderTextColor="#8a8a8a"
                secureTextEntry
              />

              <TextInput
                style={styles.input}
                value={supplierLocation}
                onChangeText={setSupplierLocation}
                placeholder="Location"
                placeholderTextColor="#8a8a8a"
              />

              <Pressable
                style={styles.uploadButton}
                onPress={async () => {
                  const doc = await pickDocument();
                  setSupplierLicense(doc);
                }}
              >
                <MaterialIcons
                  name={supplierLicense ? "task-alt" : "upload-file"}
                  size={20}
                  color={supplierLicense ? "#2e7d32" : "#0a2f4a"}
                />
                <ThemedText type="default" style={styles.uploadButtonText}>
                  {supplierLicense ? supplierLicense.name : "Upload Business License"}
                </ThemedText>
              </Pressable>

              <Pressable
                style={styles.uploadButton}
                onPress={async () => {
                  const docs = await pickDocuments();
                  setSupplierAdditionalDocs([...supplierAdditionalDocs, ...docs]);
                }}
              >
                <MaterialIcons
                  name="add"
                  size={20}
                  color="#0a2f4a"
                />
                <ThemedText type="default" style={styles.uploadButtonText}>
                  Add Additional Documents ({supplierAdditionalDocs.length})
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Actions
              </ThemedText>

              {!supplierId && (
                <ActionButton
                  label="1. Register Supplier"
                  icon="app-registration"
                  onPress={handleRegisterSupplier}
                  loading={loading}
                />
              )}

              {supplierId && reviewState?.status === "modify" && (
                <ActionButton
                  label="Resubmit Changes"
                  icon="refresh"
                  onPress={handleResubmitSupplier}
                  loading={loading}
                />
              )}

              {supplierId && (
                <ActionButton
                  label="Refresh Status"
                  icon="sync"
                  onPress={handleRefreshSupplierStatus}
                  loading={loading}
                />
              )}
            </View>
          </>
        )}

        <Pressable style={styles.resetButton} onPress={() => setMode("none")}>
          <ThemedText type="default" style={styles.resetText}>
            Change Test Mode
          </ThemedText>
        </Pressable>
      </ScrollView>
    </PageShell>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  loading,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionButton, loading && styles.buttonDisabled]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <MaterialIcons name={icon as any} size={20} color="#fff" />
          <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  content: { paddingBottom: 40 },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#0a2f4a",
    marginBottom: 12,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    marginBottom: 12,
  },
  modeButtonText: {
    marginLeft: 12,
    color: "#0a2f4a",
    fontSize: 16,
  },
  statusCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusContent: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 16,
    color: "#0a2f4a",
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: "#55656d",
  },
  reasonBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 6,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0a2f4a",
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: "#55656d",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    color: "#0a2f4a",
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    marginBottom: 12,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: "#55656d",
    flex: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a2f4a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  docsList: {
    marginTop: 16,
  },
  docsTitle: {
    fontSize: 14,
    color: "#0a2f4a",
    marginBottom: 8,
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 6,
  },
  docName: {
    flex: 1,
    marginLeft: 8,
    color: "#6b6b6b",
    fontSize: 13,
  },
  resetButton: {
    padding: 14,
    alignItems: "center",
  },
  resetText: {
    color: "#0a7ea4",
    fontSize: 15,
  },
});
