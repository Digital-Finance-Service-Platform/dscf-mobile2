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
    coreGetMyBusiness,
    marketCreateSupplierProduct,
    marketGetProducts,
} from "@/lib/api/clients";
import { useSdk } from "@/lib/sdk/context";

type CatalogProduct = {
  id: number;
  name: string;
  sku: string;
  category?: { name: string };
  unit?: { name: string; code: string };
};

export default function CreateSupplierProductScreen() {
  const router = useRouter();
  const { user } = useSdk();

  // Catalog products
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogPage, setCatalogPage] = useState(1);

  // Selected product
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  // Form fields
  const [supplierPrice, setSupplierPrice] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [minOrderQuantity, setMinOrderQuantity] = useState("");
  const [status, setStatus] = useState("active");

  // Business / supplier context
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCatalog();
    fetchBusinessContext();
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await marketGetProducts({ page: String(catalogPage), per_page: "50" });
      const data = Array.isArray(res?.data) ? res.data : [];
      setCatalog((prev) => (catalogPage === 1 ? data : [...prev, ...data]));
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load product catalog");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchBusinessContext = async () => {
    try {
      // Get supplier_id from review_status.entity_id (supplier entity)
      const supplierEntityId = user?.review_status?.entity_id;
      if (supplierEntityId) {
        setSupplierId(Number(supplierEntityId));
      }

      // Get business_id from my_business endpoint
      const bizRes = await coreGetMyBusiness();
      const biz = bizRes?.data ?? bizRes;
      if (biz?.id) {
        setBusinessId(String(biz.id));
      }
    } catch (err: any) {
      // Non-critical - user can still create without auto-fill
      console.log("[CreateSupplierProduct] Context fetch:", err?.message);
    }
  };

  const handleSelectProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setError(null);
    // Reset form
    setSupplierPrice("");
    setAvailableQuantity("");
    setMinOrderQuantity("");
    setStatus("active");
  };

  const handleSubmit = async () => {
    if (!selectedProduct) {
      setError("Please select a product from the catalog");
      return;
    }
    if (!supplierPrice.trim()) {
      setError("Supplier price is required");
      return;
    }
    if (!businessId) {
      setError("Business ID not found. Please ensure your business profile is set up.");
      return;
    }
    if (!supplierId) {
      setError("Supplier ID not found. Please ensure your supplier profile is set up.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        supplier_product: {
          business_id: businessId,
          product_id: String(selectedProduct.id),
          supplier_price: supplierPrice.trim(),
          available_quantity: availableQuantity.trim() || "0",
          minimum_order_quantity: minOrderQuantity.trim() || "1",
          status,
          supplier_id: supplierId,
        },
      };

      await marketCreateSupplierProduct(payload);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to create supplier product");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageShell title="Create Product" showBackButton style={styles.shell}>
        <View style={styles.successContainer}>
          <MaterialIcons name="check-circle" size={64} color="#2e7d32" />
          <ThemedText type="defaultSemiBold" style={styles.successTitle}>
            Product Created!
          </ThemedText>
          <ThemedText type="default" style={styles.successText}>
            Your product has been added successfully.
          </ThemedText>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/supplier/dashboard" as any)}
          >
            <ThemedText type="defaultSemiBold" style={styles.backButtonText}>
              Back to Dashboard
            </ThemedText>
          </Pressable>
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell title="Create Product" showBackButton style={styles.shell}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {!selectedProduct ? (
          <>
            <ThemedText type="default" style={styles.description}>
              Select a product from the marketplace catalog to add to your supplier products.
            </ThemedText>

            {loadingCatalog ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0a2f4a" />
                <ThemedText type="default" style={styles.loadingText}>
                  Loading catalog...
                </ThemedText>
              </View>
            ) : catalog.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="inventory" size={48} color="#6b6b6b" />
                <ThemedText type="default" style={styles.emptyText}>
                  No products in catalog yet.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.catalogList}>
                {catalog.map((product) => (
                  <Pressable
                    key={product.id}
                    style={styles.catalogItem}
                    onPress={() => handleSelectProduct(product)}
                  >
                    <View style={styles.catalogItemLeft}>
                      <View style={styles.catalogIconWrap}>
                        <MaterialIcons name="inventory" size={24} color="#0a2f4a" />
                      </View>
                      <View style={styles.catalogItemInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.catalogItemName}>
                          {product.name}
                        </ThemedText>
                        <ThemedText type="default" style={styles.catalogItemSku}>
                          SKU: {product.sku ?? "N/A"}
                        </ThemedText>
                        {product.category && (
                          <ThemedText type="default" style={styles.catalogItemCategory}>
                            {product.category.name}
                            {product.unit ? ` · ${product.unit.name}` : ""}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#6b6b6b" />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Selected Product Info */}
            <Pressable
              style={styles.changeProduct}
              onPress={() => setSelectedProduct(null)}
            >
              <MaterialIcons name="arrow-back" size={18} color="#0a7ea4" />
              <ThemedText type="default" style={styles.changeProductText}>
                Change Product
              </ThemedText>
            </Pressable>

            <View style={styles.selectedProductCard}>
              <ThemedText type="defaultSemiBold" style={styles.selectedName}>
                {selectedProduct.name}
              </ThemedText>
              <ThemedText type="default" style={styles.selectedSku}>
                SKU: {selectedProduct.sku ?? "N/A"}
              </ThemedText>
              {selectedProduct.category && (
                <ThemedText type="default" style={styles.selectedMeta}>
                  {selectedProduct.category.name}
                  {selectedProduct.unit ? ` · ${selectedProduct.unit.name} (${selectedProduct.unit.code})` : ""}
                </ThemedText>
              )}
            </View>

            {/* Supplier Price */}
            <FieldLabel label="Supplier Price (ETB)" required />
            <TextInput
              style={styles.input}
              value={supplierPrice}
              onChangeText={setSupplierPrice}
              placeholder="e.g., 2500.00"
              placeholderTextColor="#8a8a8a"
              keyboardType="decimal-pad"
            />

            {/* Available Quantity */}
            <FieldLabel label="Available Quantity" required />
            <TextInput
              style={styles.input}
              value={availableQuantity}
              onChangeText={setAvailableQuantity}
              placeholder="e.g., 1000"
              placeholderTextColor="#8a8a8a"
              keyboardType="number-pad"
            />

            {/* Minimum Order Quantity */}
            <FieldLabel label="Minimum Order Quantity (MOQ)" />
            <TextInput
              style={styles.input}
              value={minOrderQuantity}
              onChangeText={setMinOrderQuantity}
              placeholder="e.g., 50"
              placeholderTextColor="#8a8a8a"
              keyboardType="number-pad"
            />

            {/* Status */}
            <FieldLabel label="Status" />
            <View style={styles.statusRow}>
              {["active", "inactive"].map((s) => (
                <Pressable
                  key={s}
                  style={[styles.statusChip, status === s && styles.statusChipActive]}
                  onPress={() => setStatus(s)}
                >
                  <ThemedText
                    type="default"
                    style={[styles.statusChipText, status === s && styles.statusChipTextActive]}
                  >
                    {s}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {/* Context info */}
            {businessId && supplierId && (
              <View style={styles.contextInfo}>
                <MaterialIcons name="info-outline" size={16} color="#6b6b6b" />
                <ThemedText type="default" style={styles.contextText}>
                  Business #{businessId} · Supplier #{supplierId}
                </ThemedText>
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

            <Pressable
              style={[
                styles.submitButton,
                (submitting || !supplierPrice.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting || !supplierPrice.trim()}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={styles.submitText}>
                  Create Supplier Product
                </ThemedText>
              )}
            </Pressable>
          </>
        )}
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#6b6b6b",
    marginTop: 8,
  },
  catalogList: { gap: 8 },
  catalogItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  catalogItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  catalogIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(10, 47, 74, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  catalogItemInfo: { flex: 1 },
  catalogItemName: { color: "#0a2f4a", fontSize: 15 },
  catalogItemSku: { color: "#6b6b6b", fontSize: 12, marginTop: 2 },
  catalogItemCategory: { color: "#6b6b6b", fontSize: 12, marginTop: 1 },
  changeProduct: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  changeProductText: { color: "#0a7ea4", fontSize: 14 },
  selectedProductCard: {
    backgroundColor: "#f0f4f8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  selectedName: { color: "#0a2f4a", fontSize: 16 },
  selectedSku: { color: "#6b6b6b", fontSize: 12, marginTop: 2 },
  selectedMeta: { color: "#6b6b6b", fontSize: 12, marginTop: 4 },
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
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(10, 47, 74, 0.2)",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  statusChipActive: {
    backgroundColor: "#0a2f4a",
    borderColor: "#0a2f4a",
  },
  statusChipText: { color: "#0a2f4a", fontSize: 14, textTransform: "capitalize" },
  statusChipTextActive: { color: "#fff" },
  contextInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  contextText: { color: "#6b6b6b", fontSize: 12 },
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { color: "#6b6b6b", textAlign: "center", marginTop: 12 },
});
