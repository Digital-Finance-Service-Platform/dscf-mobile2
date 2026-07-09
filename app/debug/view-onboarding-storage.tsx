/**
 * View Onboarding Storage
 * 
 * Debug screen to inspect what's stored in onboarding temporary storage
 */

import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { PageShell } from "@/components/page-shell";
import { ThemedText } from "@/components/themed-text";
import {
    clearOnboardingData,
    getOnboardingData,
    OnboardingData,
} from "@/lib/onboarding-storage";

export default function ViewOnboardingStorageScreen() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const storedData = await getOnboardingData();
    setData(storedData);
    setLoading(false);
  };

  const handleClear = async () => {
    await clearOnboardingData();
    await loadData();
  };

  if (loading) {
    return (
      <PageShell title="Loading..." showBackButton style={styles.shell}>
        <ThemedText type="default">Loading stored data...</ThemedText>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Onboarding Storage"
      subtitle="View temporary storage"
      showBackButton
      style={styles.shell}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {!data ? (
          <View style={styles.emptyState}>
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              No Data Stored
            </ThemedText>
            <ThemedText type="default" style={styles.emptyText}>
              Complete an onboarding flow to see data here
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Role
              </ThemedText>
              <ThemedText type="default" style={styles.value}>
                {data.role}
              </ThemedText>
            </View>

            {data.businessName && (
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Business Name
                </ThemedText>
                <ThemedText type="default" style={styles.value}>
                  {data.businessName}
                </ThemedText>
              </View>
            )}

            {data.contactName && (
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Contact Name
                </ThemedText>
                <ThemedText type="default" style={styles.value}>
                  {data.contactName}
                </ThemedText>
              </View>
            )}

            {data.phone && (
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Phone
                </ThemedText>
                <ThemedText type="default" style={styles.value}>
                  {data.phone}
                </ThemedText>
              </View>
            )}

            {data.email && (
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Email
                </ThemedText>
                <ThemedText type="default" style={styles.value}>
                  {data.email}
                </ThemedText>
              </View>
            )}

            {(data.latitude || data.longitude) && (
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Location
                </ThemedText>
                <ThemedText type="default" style={styles.value}>
                  {data.latitude}, {data.longitude}
                </ThemedText>
              </View>
            )}

            {data.documents && (
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Documents
                </ThemedText>

                {data.documents.licenseFile && (
                  <View style={styles.docCard}>
                    <ThemedText type="defaultSemiBold" style={styles.docLabel}>
                      Business License
                    </ThemedText>
                    <ThemedText type="default" style={styles.docDetail}>
                      Name: {data.documents.licenseFile.name}
                    </ThemedText>
                    <ThemedText type="default" style={styles.docDetail}>
                      Type: {data.documents.licenseFile.mimeType}
                    </ThemedText>
                    {data.documents.licenseFile.size && (
                      <ThemedText type="default" style={styles.docDetail}>
                        Size: {(data.documents.licenseFile.size / 1024).toFixed(2)} KB
                      </ThemedText>
                    )}
                    <ThemedText type="default" style={styles.docDetail}>
                      URI: {data.documents.licenseFile.uri.substring(0, 50)}...
                    </ThemedText>
                  </View>
                )}

                {data.documents.additionalDocs && data.documents.additionalDocs.length > 0 && (
                  <>
                    <ThemedText type="defaultSemiBold" style={styles.additionalTitle}>
                      Additional Documents ({data.documents.additionalDocs.length})
                    </ThemedText>
                    {data.documents.additionalDocs.map((doc, idx) => (
                      <View key={idx} style={styles.docCard}>
                        <ThemedText type="default" style={styles.docDetail}>
                          Name: {doc.name}
                        </ThemedText>
                        <ThemedText type="default" style={styles.docDetail}>
                          Type: {doc.mimeType}
                        </ThemedText>
                        {doc.size && (
                          <ThemedText type="default" style={styles.docDetail}>
                            Size: {(doc.size / 1024).toFixed(2)} KB
                          </ThemedText>
                        )}
                      </View>
                    ))}
                  </>
                )}

                {!data.documents.licenseFile && (!data.documents.additionalDocs || data.documents.additionalDocs.length === 0) && (
                  <ThemedText type="default" style={styles.noDocuments}>
                    No documents stored
                  </ThemedText>
                )}
              </View>
            )}

            <Pressable style={styles.clearButton} onPress={handleClear}>
              <ThemedText type="defaultSemiBold" style={styles.clearButtonText}>
                Clear Stored Data
              </ThemedText>
            </Pressable>
          </>
        )}

        <Pressable style={styles.refreshButton} onPress={loadData}>
          <ThemedText type="default" style={styles.refreshButtonText}>
            Refresh
          </ThemedText>
        </Pressable>
      </ScrollView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  content: { paddingBottom: 40 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    color: "#0a2f4a",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b6b6b",
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.1)",
  },
  sectionTitle: {
    fontSize: 14,
    color: "#0a2f4a",
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    color: "#55656d",
  },
  docCard: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  docLabel: {
    fontSize: 14,
    color: "#0a2f4a",
    marginBottom: 6,
  },
  docDetail: {
    fontSize: 13,
    color: "#6b6b6b",
    marginTop: 4,
  },
  additionalTitle: {
    fontSize: 14,
    color: "#0a2f4a",
    marginTop: 12,
    marginBottom: 4,
  },
  noDocuments: {
    fontSize: 13,
    color: "#9a9a9a",
    fontStyle: "italic",
    marginTop: 4,
  },
  clearButton: {
    backgroundColor: "#b00020",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 15,
  },
  refreshButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  refreshButtonText: {
    color: "#0a7ea4",
    fontSize: 15,
  },
});
