import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
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
import { coreGetMyBusiness, coreUpdateBusiness } from "@/lib/api/clients";

export default function BusinessScreen() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    setLoading(true);
    try {
      const res = await coreGetMyBusiness();
      const data = res?.data ?? res;
      setBusiness(data);
      setName(data?.name ?? "");
      setTinNumber(data?.tin_number ?? "");
    } catch (err: any) {
      setError(err?.message || "Failed to load business info");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!business?.id) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await coreUpdateBusiness(business.id, {
        business: { name, tin_number: tinNumber },
      });
      setSuccess("Business updated successfully");
      setEditMode(false);
      fetchBusiness();
    } catch (err: any) {
      setError(err?.message || "Failed to update business");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="My Business" showBackButton style={styles.shell}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a2f4a" />
          <ThemedText type="default" style={{ marginTop: 12, color: "#6b6b6b" }}>
            Loading business info...
          </ThemedText>
        </View>
      </PageShell>
    );
  }

  if (!business) {
    return (
      <PageShell title="My Business" showBackButton style={styles.shell}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="store" size={48} color="#6b6b6b" />
          <ThemedText type="default" style={{ marginTop: 12, color: "#6b6b6b" }}>
            No business found. Complete supplier registration first.
          </ThemedText>
        </View>
      </PageShell>
    );
  }

  const documents = business?.documents ?? [];
  const reviews = business?.reviews ?? [];
  const latestReview = reviews[reviews.length - 1];

  return (
    <PageShell title="My Business" showBackButton style={styles.shell}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Business Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Business Information
            </ThemedText>
            <Pressable onPress={() => setEditMode(!editMode)}>
              <MaterialIcons
                name={editMode ? "close" : "edit"}
                size={20}
                color="#0a2f4a"
              />
            </Pressable>
          </View>

          <View style={styles.field}>
            <ThemedText type="default" style={styles.fieldLabel}>
              Business Name
            </ThemedText>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Business name"
              />
            ) : (
              <ThemedText type="default" style={styles.fieldValue}>
                {business.name}
              </ThemedText>
            )}
          </View>

          <View style={styles.field}>
            <ThemedText type="default" style={styles.fieldLabel}>
              TIN Number
            </ThemedText>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={tinNumber}
                onChangeText={setTinNumber}
                placeholder="TIN number"
              />
            ) : (
              <ThemedText type="default" style={styles.fieldValue}>
                {business.tin_number ?? "Not provided"}
              </ThemedText>
            )}
          </View>

          <View style={styles.field}>
            <ThemedText type="default" style={styles.fieldLabel}>
              Status
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                business.status === "approved" && styles.statusApproved,
                business.status === "pending" && styles.statusPending,
                business.status === "rejected" && styles.statusRejected,
              ]}
            >
              <ThemedText type="defaultSemiBold" style={styles.statusText}>
                {business.status ?? "pending"}
              </ThemedText>
            </View>
          </View>

          {editMode && (
            <Pressable
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={styles.saveButtonText}>
                  Save Changes
                </ThemedText>
              )}
            </Pressable>
          )}
        </View>

        {/* Documents */}
        <View style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Documents ({documents.length})
          </ThemedText>
          {documents.length === 0 ? (
            <ThemedText type="default" style={styles.emptyText}>
              No documents uploaded
            </ThemedText>
          ) : (
            documents.map((doc: any) => (
              <View key={doc.id} style={styles.docItem}>
                <MaterialIcons name="insert-drive-file" size={18} color="#6b6b6b" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <ThemedText type="default" style={styles.docType}>
                    {doc.document_type?.replace(/_/g, " ")}
                  </ThemedText>
                  <ThemedText type="default" style={styles.docStatus}>
                    Status: {doc.status ?? "uploaded"}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Review Status */}
        {latestReview && (
          <View style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Review Status
            </ThemedText>
            <View style={styles.reviewItem}>
              <MaterialIcons
                name={
                  latestReview.status === "approved"
                    ? "check-circle"
                    : latestReview.status === "rejected"
                    ? "cancel"
                    : "hourglass-empty"
                }
                size={20}
                color={
                  latestReview.status === "approved"
                    ? "#2e7d32"
                    : latestReview.status === "rejected"
                    ? "#b00020"
                    : "#f57c00"
                }
              />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <ThemedText type="default" style={styles.reviewStatus}>
                  {latestReview.status}
                </ThemedText>
                {latestReview.feedback && (
                  <ThemedText type="default" style={styles.reviewFeedback}>
                    {latestReview.feedback}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={18} color="#b00020" />
            <ThemedText type="default" style={styles.errorText}>
              {error}
            </ThemedText>
          </View>
        )}

        {success && (
          <View style={styles.successBox}>
            <MaterialIcons name="check-circle" size={18} color="#2e7d32" />
            <ThemedText type="default" style={styles.successText}>
              {success}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  content: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, color: "#0a2f4a", marginBottom: 8 },
  field: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 47, 74, 0.08)",
  },
  fieldLabel: { color: "#6b6b6b", fontSize: 13, marginBottom: 4 },
  fieldValue: { color: "#0a2f4a", fontSize: 15 },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#0a2f4a",
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  statusApproved: { backgroundColor: "#e8f5e9" },
  statusPending: { backgroundColor: "#fff3e0" },
  statusRejected: { backgroundColor: "#ffebee" },
  statusText: { fontSize: 12, color: "#0a2f4a" },
  saveButton: {
    marginTop: 16,
    backgroundColor: "#0a2f4a",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 15 },
  buttonDisabled: { opacity: 0.6 },
  emptyText: { color: "#6b6b6b", fontStyle: "italic" },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10, 47, 74, 0.08)",
  },
  docType: { color: "#0a2f4a", fontSize: 14 },
  docStatus: { color: "#6b6b6b", fontSize: 12, marginTop: 2 },
  reviewItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  reviewStatus: { color: "#0a2f4a", fontSize: 14, textTransform: "capitalize" },
  reviewFeedback: { color: "#6b6b6b", fontSize: 13, marginTop: 4 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: { marginLeft: 8, color: "#b00020", flex: 1 },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    marginTop: 8,
  },
  successText: { marginLeft: 8, color: "#2e7d32", flex: 1 },
});
