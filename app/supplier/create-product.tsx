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
import { SupplierCatalogCard } from "@/components/supplier/supplier-catalog-card";
import { SupplierEmptyState } from "@/components/supplier/supplier-empty-state";
import { ThemedText } from "@/components/themed-text";
import { useSupplierMenuItems } from "@/hooks/use-supplier-menu";
import { marketGetProducts, publishSupplierProduct, coreGetMyBusiness } from "@/lib/api/clients";
import { supplierTheme } from "@/lib/supplier-theme";

type CatalogProduct = {
  id: number;
  name: string;
  sku: string;
  category?: { name: string };
  unit?: { name: string; code: string };
};

function parseApiError(err: unknown): string {
  return err instanceof Error ? err.message : "Failed to publish product";
}

export default function CreateSupplierProductScreen() {
  const router = useRouter();
  const supplierMenuItems = useSupplierMenuItems();

  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [businessId, setBusinessId] = useState<number | null>(null);

  useEffect(() => {
    fetchCatalog();
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      const res = await coreGetMyBusiness();
      console.log("[CreateProduct] business response:", JSON.stringify(res));
      const biz = res?.data ?? res;
      if (biz?.id) {
        setBusinessId(biz.id);
      } else if (Array.isArray(biz) && biz[0]?.id) {
        setBusinessId(biz[0].id);
      }
    } catch (err: unknown) {
      console.warn("[CreateProduct] Failed to fetch business:", err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await marketGetProducts({ page: "1", per_page: "50" });
      const data = Array.isArray(res?.data) ? res.data : [];
      setCatalog(data);
      setError(null);
    } catch (err: unknown) {
      setError(parseApiError(err) || "Failed to load product catalog");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleSelectProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setError(null);
    setPrice("");
    setQuantity("");
  };

  const handleSubmit = async () => {
    if (!selectedProduct) {
      setError("Please select a product from the catalog");
      return;
    }

    const parsedPrice = Number.parseFloat(price.trim());
    if (!price.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("A valid price is required");
      return;
    }

    const parsedQuantity = Number.parseInt(quantity.trim(), 10);
    if (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError("A valid quantity is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    if (!businessId) {
      setError("Business information not loaded. Please try again.");
      setSubmitting(false);
      return;
    }

    try {
      await publishSupplierProduct({
        supplier_product: {
          product_id: selectedProduct.id,
          supplier_price: parsedPrice,
          available_quantity: parsedQuantity,
          minimum_order_quantity: 1,
          business_id: businessId,
          status: "active",
        },
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageShell
        title="Create Product"
        showBackButton
        useBackIcon
        headerVariant="retailer"
        menuItems={supplierMenuItems}
        style={styles.shell}
      >
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <MaterialIcons name="check-circle" size={56} color={supplierTheme.success} />
          </View>
          <ThemedText type="defaultSemiBold" style={styles.successTitle}>
            Product Published!
          </ThemedText>
          <ThemedText type="default" style={styles.successText}>
            Your supplier product listing is now live in the marketplace catalog.
          </ThemedText>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/supplier/products" as any)}
          >
            <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
              View My Products
            </ThemedText>
          </Pressable>
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Create Product"
      showBackButton
      useBackIcon
      headerVariant="retailer"
      menuItems={supplierMenuItems}
      style={styles.shell}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, !selectedProduct && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, selectedProduct && styles.stepDotActive]} />
        </View>
        <ThemedText type="defaultSemiBold" style={styles.stepLabel}>
          {selectedProduct ? "Step 2 · Set price & quantity" : "Step 1 · Select a catalog product"}
        </ThemedText>

        {!selectedProduct ? (
          <>
            <ThemedText type="default" style={styles.description}>
              Select a product from the marketplace catalog to add to your supplier products.
            </ThemedText>

            {loadingCatalog ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={supplierTheme.primary} />
                <ThemedText type="default" style={styles.loadingText}>
                  Loading catalog...
                </ThemedText>
              </View>
            ) : catalog.length === 0 ? (
              <SupplierEmptyState
                icon="inventory"
                title="No catalog products"
                message="No products in catalog yet. Check back later or request a new product inclusion."
                actionLabel="Request Product"
                onAction={() => router.push("/supplier/request-product" as any)}
              />
            ) : (
              <View style={styles.catalogList}>
                {catalog.map((product) => (
                  <SupplierCatalogCard
                    key={product.id}
                    name={product.name}
                    sku={product.sku ?? "N/A"}
                    meta={
                      product.category
                        ? `${product.category.name}${product.unit ? ` · ${product.unit.name}` : ""}`
                        : undefined
                    }
                    onPress={() => handleSelectProduct(product)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.formCard}>
            <Pressable style={styles.changeProduct} onPress={() => setSelectedProduct(null)}>
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
              {selectedProduct.category ? (
                <ThemedText type="default" style={styles.selectedMeta}>
                  {selectedProduct.category.name}
                  {selectedProduct.unit
                    ? ` · ${selectedProduct.unit.name} (${selectedProduct.unit.code})`
                    : ""}
                </ThemedText>
              ) : null}
            </View>

            <FieldLabel label="Price (ETB)" required />
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="e.g., 325.00"
              placeholderTextColor="#8a8a8a"
              keyboardType="decimal-pad"
            />

            <FieldLabel label="Quantity" required />
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g., 500"
              placeholderTextColor="#8a8a8a"
              keyboardType="number-pad"
            />

            {error ? (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={18} color={supplierTheme.error} />
                <ThemedText type="default" style={styles.errorText}>
                  {error}
                </ThemedText>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.primaryButton,
                (submitting || !price.trim() || !quantity.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting || !price.trim() || !quantity.trim()}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                  Publish Product
                </ThemedText>
              )}
            </Pressable>
          </View>
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
  shell: { paddingTop: 60, backgroundColor: supplierTheme.background },
  content: { paddingBottom: 40 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    paddingHorizontal: 80,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: supplierTheme.border,
  },
  stepDotActive: {
    backgroundColor: supplierTheme.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: supplierTheme.border,
    marginHorizontal: 8,
  },
  stepLabel: {
    textAlign: "center",
    color: supplierTheme.primary,
    fontSize: 14,
    marginBottom: 16,
  },
  description: {
    color: supplierTheme.textMuted,
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: supplierTheme.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  catalogList: { gap: 12 },
  formCard: {
    backgroundColor: supplierTheme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: supplierTheme.border,
    ...supplierTheme.cardShadow,
  },
  changeProduct: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  changeProductText: { color: "#0a7ea4", fontSize: 15, fontWeight: "600" },
  selectedProductCard: {
    backgroundColor: supplierTheme.iconBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  selectedName: { color: supplierTheme.primary, fontSize: 18, fontWeight: "600" },
  selectedSku: { color: supplierTheme.textMuted, fontSize: 13, marginTop: 3 },
  selectedMeta: { color: supplierTheme.textMuted, fontSize: 13, marginTop: 6 },
  labelRow: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { color: supplierTheme.primary, fontWeight: "600", fontSize: 15 },
  requiredMark: { color: supplierTheme.accent, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: supplierTheme.border,
    color: supplierTheme.primary,
    fontSize: 15,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 14,
    backgroundColor: "#ffebee",
    borderRadius: 12,
  },
  errorText: { marginLeft: 10, color: supplierTheme.error, flex: 1, fontSize: 14 },
  primaryButton: {
    marginTop: 24,
    backgroundColor: supplierTheme.primaryDark,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 24,
    color: supplierTheme.primary,
    marginTop: 20,
    textAlign: "center",
    fontWeight: "700",
  },
  successText: {
    fontSize: 16,
    color: supplierTheme.textMuted,
    marginTop: 12,
    textAlign: "center",
    lineHeight: 24,
  },
});
