import { Image } from "expo-image";
import React, { useState, useMemo, useEffect } from "react";
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
import { marketGetVisibleListings } from "@/lib/api/clients";
import { ActivityIndicator } from "react-native";
import { formatCurrency } from "@/lib/formatters";

const CATEGORIES = ["All", "Electronics", "Industrial", "Apparel"];

const TRENDING = [
  {
    id: "1",
    title: "Aura Smartwatch Pro",
    category: "Electronics",
    price: 299.99,
  },
  {
    id: "2",
    title: "Sonicar Wireless ANC Headphones",
    category: "Audio",
    price: 189.5,
  },
  {
    id: "3",
    title: "Velocity Runners Red Edition",
    category: "Apparel",
    price: 120.0,
  },
  {
    id: "4",
    title: "EchoBuds Pro Wireless",
    category: "Electronics",
    price: 89.99,
  },
];

function mapApiListingToCard(listing: any) {
  const product = listing?.product ?? listing?.supplier_product?.product ?? {};
  const thumbnail =
    listing?.supplier_product?.product?.thumbnail_url ??
    product?.thumbnail_url ??
    null;
  const image = thumbnail
    ? { uri: thumbnail }
    : require("@/assets/images/icon.png");
  const title = product?.name ?? listing?.title ?? "Untitled";
  const category = product?.category?.name ?? listing?.category ?? "";
  const price =
    listing?.price ?? listing?.supplier_price ?? listing?.price_text ?? 0;
  return {
    id: String(listing?.id ?? title),
    title,
    category,
    price,
    image,
    raw: listing,
  };
}

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
              {formatCurrency(24500)}
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
    const price = parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 0;
    addItem({
      id: String(item.id),
      title: item.title,
      price,
      subtitle: item.category,
      image: item.image || require("@/assets/images/icon.png"),
    });
  };

  return (
    <ProductCard
      id={item.id}
      title={item.title}
      category={item.category}
      price={item.price}
      image={item.image}
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

  const [listings, setListings] = useState<any[]>(
    TRENDING.map((t) => ({
      id: String(t.id),
      title: t.title,
      category: t.category,
      price: t.price,
      image: require("@/assets/images/icon.png"),
      raw: null,
    })),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await marketGetVisibleListings();
        const data = Array.isArray(res?.data) ? res.data : res || [];
        const items = data.map(mapApiListingToCard);
        if (mounted && items.length) setListings(items);
      } catch (err) {
        console.warn("Failed to load marketplace listings:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const products = useMemo(() => {
    if (selectedCategory === "All") return listings;
    return listings.filter((p) => p.category === selectedCategory);
  }, [listings, selectedCategory]);

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

        {loading ? (
          <ActivityIndicator size="small" style={{ marginTop: 12 }} />
        ) : products.length === 0 ? (
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <ThemedText type="default" lightColor="#6b6b6b">
              {`The ${selectedCategory} category is not available at this time.`}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(i) => i.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            renderItem={({ item }) => <TrendingProductCard item={item} />}
            scrollEnabled={false}
            ListFooterComponent={
              <View style={{ height: insets.bottom + 26 }} />
            }
          />
        )}
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
