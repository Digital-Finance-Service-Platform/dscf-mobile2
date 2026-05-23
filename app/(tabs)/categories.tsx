import React, { useState, useMemo } from "react";
import { StyleSheet, FlatList, Alert, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PageShell } from "@/components/page-shell";
import { SearchBar } from "@/components/search-bar";
import { ProductCard } from "@/components/product-card";
import { ThemedText } from "@/components/themed-text";

const CATEGORIES = [
  {
    id: "electronics",
    name: "Electronics",
    count: 124,
    image: require("@/assets/images/icon.png"),
  },
  {
    id: "apparel",
    name: "Apparel",
    count: 56,
    image: require("@/assets/images/icon.png"),
  },
  {
    id: "audio",
    name: "Audio",
    count: 38,
    image: require("@/assets/images/icon.png"),
  },
  {
    id: "industrial",
    name: "Industrial",
    count: 22,
    image: require("@/assets/images/icon.png"),
  },
  {
    id: "home",
    name: "Home",
    count: 18,
    image: require("@/assets/images/icon.png"),
  },
  {
    id: "beauty",
    name: "Beauty",
    count: 12,
    image: require("@/assets/images/icon.png"),
  },
];

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
      price={`${item.count} products`}
      image={item.image}
      onPress={() => onPress(item)}
      showAddButton={false}
    />
  );
}

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const onBrowse = (cat: any) => {
    Alert.alert("Browse", `Open category: ${cat.name}`);
  };

  return (
    <PageShell
      title="Categories"
      rightNode={
        <ThemedText type="default" lightColor="#6b6b6b">
          {CATEGORIES.length}
        </ThemedText>
      }
    >
      <SearchBarComponent value={query} onChange={setQuery} />

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        contentContainerStyle={{ paddingTop: 8 }}
        ListFooterComponent={<View style={{ height: insets.bottom + 39 }} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CategoryCard item={item} onPress={onBrowse} />
        )}
      />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  columnWrap: { justifyContent: "space-between", marginBottom: 12 },
});
