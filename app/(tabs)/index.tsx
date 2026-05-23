import { Image } from "expo-image";
import React, { useState, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StyleSheet, View, Pressable, FlatList } from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SearchBar } from "@/components/search-bar";
import { FilterChips } from "@/components/filter-chips";
import { SectionHeader } from "@/components/section-header";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/components/cart-context";

const CATEGORIES = ["All", "Electronics", "Industrial", "Apparel"];

const TRENDING = [
  {
    id: "1",
    title: "Aura Smartwatch Pro",
    category: "Electronics",
    price: "$299.99",
  },
  {
    id: "2",
    title: "Sonicar Wireless ANC Headphones",
    category: "Audio",
    price: "$189.50",
  },
  {
    id: "3",
    title: "Velocity Runners Red Edition",
    category: "Apparel",
    price: "$120.00",
  },
  {
    id: "4",
    title: "EchoBuds Pro Wireless",
    category: "Electronics",
    price: "$89.99",
  },
];

function SearchBarComponent() {
  return <SearchBar />;
}

function CategoryChips({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (c: string) => void;
}) {
  const filters = CATEGORIES.map((cat) => ({ key: cat, label: cat }));
  return <FilterChips filters={filters} active={active} onSelect={onSelect} />;
}

function TopPickCard() {
  return (
    <View style={styles.topPickCard}>
      <View style={styles.topPickImageWrap}>
        <Image
          source={require("@/assets/images/adv.png")}
          style={styles.topPickImage}
        />
        <View style={styles.topBadge}>
          <ThemedText type="defaultSemiBold">Top Pick</ThemedText>
        </View>
      </View>
      <View style={styles.topPickContent}>
        <ThemedText type="default3">INDUSTRIAL PROCESSING</ThemedText>
        <ThemedText type="subtitle">
          Advanced Silicon Microchip Fabricator Series X
        </ThemedText>
        <View style={styles.topPickFooter}>
          <View style={styles.priceStack}>
            <ThemedText
              type="default"
              lightColor="#6b6b6b"
              style={styles.startingAt}
            >
              Starting at
            </ThemedText>
            <ThemedText
              type="defaultSemiBold"
              lightColor="#8a1d1d"
              style={styles.priceText}
            >
              $24,500
            </ThemedText>
          </View>

          <Pressable style={styles.arrowButton} accessibilityLabel="Open">
            <MaterialIcons name="arrow-forward" size={22} color="#1a1c1c" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function TrendingProductCard({ item }: { item: (typeof TRENDING)[0] }) {
  const { addItem } = useCart();

  const onAdd = () => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, "")) || 0;
    addItem({
      id: item.id,
      title: item.title,
      price,
      subtitle: item.category,
      image: require("@/assets/images/icon.png"),
    });
  };

  return (
    <ProductCard
      id={item.id}
      title={item.title}
      category={item.category}
      price={item.price}
      image={require("@/assets/images/icon.png")}
      onAddToCart={onAdd}
    />
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORIES[0],
  );

  const products = useMemo(() => {
    if (selectedCategory === "All") return TRENDING;
    return TRENDING.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <ParallaxScrollView>
      <ThemedView style={styles.container}>
        <SearchBarComponent />
        <SectionHeader
          title="Categories"
          actionText="View all"
          onActionPress={() => router.push("/categories")}
        />

        <CategoryChips
          active={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {selectedCategory === "All" && <TopPickCard />}

        <SectionHeader
          title="Trending Products"
          style={styles.sectionHeaderSmall}
        />

        <FlatList
          data={products}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrap}
          renderItem={({ item }) => <TrendingProductCard item={item} />}
          scrollEnabled={false}
          ListFooterComponent={<View style={{ height: insets.bottom + 26 }} />}
        />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 24,
    marginTop: -13,
  },
  /* header is rendered in app/_layout.tsx */
  sectionHeaderSmall: { marginTop: 18, marginBottom: 8 },
  topPickCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topPickImageWrap: {
    position: "relative",
    height: 180,
    backgroundColor: "#f7f7f7",
  },
  topPickImage: { width: "100%", height: "100%", resizeMode: "cover" },
  topBadge: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: "rgba(255,255,255,0.98)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  topPickContent: { padding: 16 },
  topPickFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  priceStack: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  startingAt: {
    fontSize: 13,
    color: "#5A413D",
    marginBottom: 2,
    fontWeight: "500",
  },
  priceText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  arrowButton: {
    backgroundColor: "#f1f1f1",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  columnWrap: { justifyContent: "space-between", marginTop: 12 },
});
