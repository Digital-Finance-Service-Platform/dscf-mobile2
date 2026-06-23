import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageShell } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import { ThemedText } from "@/components/themed-text";
import { marketGetCategories, marketGetCategoryProducts } from "@/lib/api/clients";

function SearchBarComponent({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) {
  return <SearchBar value={value} onChangeText={onChange} />;
}

function CategoryCard({ item, onPress }: any) {
  return (
    <ProductCard
      id={item.id}
      title={item.name}
      price={0}
      priceText={item.product_count ? `${item.product_count} products` : "Browse"}
      image={item.image_url ? { uri: item.image_url } : require("@/assets/images/logo1.png")}
      onPress={() => onPress(item)}
      showAddButton={false}
    />
  );
}

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await marketGetCategories();
        const data = Array.isArray(res?.data) ? res.data : res || [];
        if (mounted) {
          setCategories(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Failed to load categories");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name?.toLowerCase().includes(q));
  }, [query, categories]);

  const onBrowse = async (cat: any) => {
    try {
      // Fetch products in this category and navigate to a product list
      const res = await marketGetCategoryProducts(cat.id);
      const products = Array.isArray(res?.data) ? res.data : res || [];
      // For now, show an alert with product count
      Alert.alert(
        cat.name,
        `${products.length} product(s) in this category. Product detail view coming soon.`,
      );
    } catch (err) {
      Alert.alert("Error", "Failed to load products for this category.");
    }
  };

  return (
    <PageShell
      title="Categories"
      rightNode={
        <ThemedText type="default" lightColor="#6b6b6b">
          {categories.length}
        </ThemedText>
      }
    >
      <SearchBarComponent value={query} onChange={setQuery} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a2f4a" />
          <ThemedText type="default" style={{ marginTop: 12, color: "#6b6b6b" }}>
            Loading categories...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <ThemedText type="default" style={{ color: "#b00020" }}>
            {error}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={{ paddingTop: 8 }}
          ListFooterComponent={<View style={{ height: insets.bottom + 39 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CategoryCard item={item} onPress={onBrowse} />
          )}
          ListEmptyComponent={
            <View style={styles.loadingContainer}>
              <ThemedText type="default" style={{ color: "#6b6b6b" }}>
                No categories found
              </ThemedText>
            </View>
          }
        />
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  columnWrap: { justifyContent: "space-between", marginBottom: 12 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
});
