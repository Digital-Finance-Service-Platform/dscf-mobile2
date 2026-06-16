import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
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
import {
    marketCreateProductInclusionRequest,
    marketGetCategories,
    marketGetUnits,
} from "@/lib/api/clients";

export default function RequestProductScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [baseQuantity, setBaseQuantity] = useState("1");

  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [catRes, unitRes] = await Promise.allSettled([
          marketGetCategories(),
          marketGetUnits(),
        ]);
        if (catRes.status === "fulfilled") {
          setCategories(Array.isArray(catRes.value?.data) ? catRes.value.data : []);
        }
        if (unitRes.status === "fulfilled") {
          setUnits(Array.isArray(unitRes.value?.data) ? unitRes.value.data : []);
        }
      } catch (e) {
        // silently fail — user can still fill in the form
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Product name is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, any> = {
        product_inclusion_request: {
          name: name.trim(),
          description: description.trim(),
          sku: sku.trim() || undefined,
          category_id: categoryId || undefined,
          unit_id: unitId || undefined,
          gross_weight: grossWeight ? parseFloat(grossWeight) : undefined,
          base_quantity: baseQuantity ? parseInt(baseQuantity) : 1,
        },
      };
      await marketCreateProductInclusionRequest(payload);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageShell title="Request Product" showBackButton style={styles.shell}>
        <View style={styles.successContainer}>
          <MaterialIcons name="check-circle" size={64} color="#2e7d32" />
          <ThemedText type="defaultSemiBold" style={styles.successTitle}>
            Request Submitted!
          </ThemedText>
          <ThemedText type="default" style={styles.successText}>
            Your product request has been submitted for review. The orchestrator
            will review and approve it shortly.
          </ThemedText>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText type="defaultSemiBold" style={styles.backButtonText}>
              Back to Products
            </ThemedText>
          </Pressable>
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell title="Request New Product" showBackButton style={styles.shell}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ThemedText type="default" style={styles.description}>
          Request a new product to be added to the marketplace catalogue. The
          orchestrator will review your request.
        </ThemedText>

        <FieldLabel label="Product Name" required />
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., White Sugar"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Description" />
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Product description"
          placeholderTextColor="#8a8a8a"
          multiline
          numberOfLines={3}
        />

        <FieldLabel label="SKU / Product Code" />
        <TextInput
          style={styles.input}
          value={sku}
          onChangeText={setSku}
          placeholder="e.g., SUG-001"
          placeholderTextColor="#8a8a8a"
        />

        <FieldLabel label="Category" />
        {categories.length > 0 ? (
          <View style={styles.chipRow}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.chip,
                  categoryId === String(cat.id) && styles.chipActive,
                ]}
                onPress={() => setCategoryId(String(cat.id))}
              >
                <ThemedText
                  type="default"
                  style={[
                    styles.chipText,
                    categoryId === String(cat.id) && styles.chipTextActive,
                  ]}
                >
                  {cat.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <ThemedText type="default" style={styles.hintText}>
            {loading ? "Loading categories..." : "No categories available"}
          </ThemedText>
        )}

        <FieldLabel label="Unit of Measure" />
        {units.length > 0 ? (
          <View style={styles.chipRow}>
            {units.map((unit) => (
              <Pressable
                key={unit.id}
                style={[
                  styles.chip,
                  unitId === String(unit.id) && styles.chipActive,
                ]}
                onPress={() => setUnitId(String(unit.id))}
              >
                <ThemedText
                  type="default"
                  style={[
                    styles.chipText,
                    unitId === String(unit.id) && styles.chipTextActive,
                  ]}
                >
                  {unit.name} ({unit.code})
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <ThemedText type="default" style={styles.hintText}>
            {loading ? "Loading units..." : "No units available"}
          </ThemedText>
        )}

        <FieldLabel label="Gross Weight (kg)" />
        <TextInput
          style={styles.input}
          value={grossWeight}
          onChangeText={setGrossWeight}
          placeholder="e.g., 50.0"
          placeholderTextColor="#8a8a8a"
          keyboardType="decimal-pad"
        />

        <FieldLabel label="Base Quantity" />
        <TextInput
          style={styles.input}
          value={baseQuantity}
          onChangeText={setBaseQuantity}
          placeholder="1"
          placeholderTextColor="#8a8a8a"
          keyboardType="number-pad"
        />

        {error && (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={18} color="#b00020" />
            <ThemedText type="default" style={styles.errorText}>
              {error}
            </ThemedText>
          </View>
        )}

        <Pressable
          style={[styles.submitButton, (submitting || !name.trim()) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !name.trim()}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="defaultSemiBold" style={styles.submitText}>
              Submit Request
            </ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </PageShell>
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
  content: { padding: 16, paddingBottom: 40 },
  description: { color: "#6b6b6b", fontSize: 14, marginBottom: 16 },
  labelRow: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { color: "#0a2f4a", fontWeight: "500" },
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
  textarea: { minHeight: 80, textAlignVertical: "top" },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: "#0a2f4a",
    borderColor: "#0a2f4a",
  },
  chipText: { color: "#0a2f4a", fontSize: 13 },
  chipTextActive: { color: "#fff" },
  hintText: { color: "#6b6b6b", fontSize: 13, fontStyle: "italic" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#ffebee",
    borderRadius: 8,
  },
  errorText: { marginLeft: 8, color: "#b00020", flex: 1 },
  submitButton: {
    marginTop: 24,
    backgroundColor: "#0a2f4a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16 },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  successTitle: {
    fontSize: 22,
    color: "#0a2f4a",
    marginTop: 16,
    textAlign: "center",
  },
  successText: {
    fontSize: 15,
    color: "#6b6b6b",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 22,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: "#0a2f4a",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backButtonText: { color: "#fff" },
});
