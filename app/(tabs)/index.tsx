import { useSdk } from "@/lib/sdk/context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useCart } from "@/components/cart-context";
import { FilterChips } from "@/components/filter-chips";
import KeGebeyaLoader from "@/components/KeGebeyaLoader";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ProductCard } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import { SectionHeader } from "@/components/section-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { marketGetAggregatorFeed, marketGetVisibleListings } from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";

const CATEGORIES = ["All", "Electronics", "Industrial", "Apparel"];

// Removed hardcoded TRENDING fixture — listings are loaded from the API only.

function mapApiListingToCard(listing: any) {
  const product = listing?.product ?? listing?.supplier_product?.product ?? {};
  const thumbnail =
    listing?.supplier_product?.product?.thumbnail_url ??
    product?.thumbnail_url ??
    null;
  const image = thumbnail
    ? { uri: thumbnail }
    : require("@/assets/images/logo1.png");
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

function TrendingProductCard({ item }: { item: any }) {
  const { addItem } = useCart();

  const onAdd = () => {
    const price = parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 0;
    addItem({
      id: String(item.id),
      title: item.title,
      price,
      subtitle: item.category,
      image: item.image || require("@/assets/images/logo1.png"),
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
  // safe-read `_t` search param — `useSearchParams` may be unavailable in some expo-router versions
  let _t: string | undefined = undefined;
  try {
    // dynamic require so bundler won't call an undefined hook
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const routerHooks = require("expo-router");
    if (routerHooks && typeof routerHooks.useSearchParams === "function") {
      const params = routerHooks.useSearchParams();
      _t = params?._t;
    }
  } catch (e) {
    _t = undefined;
  }
  const { token, refreshKey } = useSdk();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORIES[0],
  );

  const [listings, setListings] = useState<any[]>([]);
  const [aggregatorListings, setAggregatorListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [visibleRes, aggregatorRes] = await Promise.allSettled([
          marketGetVisibleListings(),
          marketGetAggregatorFeed(),
        ]);
        
        const visibleData = visibleRes.status === "fulfilled"
          ? (Array.isArray(visibleRes.value?.data) ? visibleRes.value.data : visibleRes.value || [])
          : [];
        const aggregatorData = aggregatorRes.status === "fulfilled"
          ? (Array.isArray(aggregatorRes.value?.data) ? aggregatorRes.value.data : aggregatorRes.value || [])
          : [];
        
        if (mounted) {
          setListings(visibleData.map(mapApiListingToCard));
          setAggregatorListings(aggregatorData.map(mapApiListingToCard));
          setError(null);
        }
      } catch (err) {
        console.warn("Failed to load marketplace listings:", err);
        const msg = String(err ?? "");
        if (
          msg.includes("Network request failed") ||
          msg.toLowerCase().includes("could not reach market server") ||
          msg.toLowerCase().includes("network")
        ) {
          setError(
            "Network error: could not reach market server at https://uat.api.fcgm.pro.et/marketplace — Network request failed",
          );
        } else {
          setError("Failed to load marketplace listings.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [_t, token, refreshKey]);

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
          <View style={{ marginTop: 12, alignItems: "center" }}>
            <KeGebeyaLoader />
          </View>
        ) : error ? (
          <View style={{ marginTop: 24, alignItems: "center", paddingHorizontal: 20 }}>
            <ThemedText type="default" lightColor="#6b6b6b" style={{ textAlign: "center" }}>
              {error}
            </ThemedText>
          </View>
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

        {/* Aggregator Listings Section */}
        {aggregatorListings.length > 0 && (
          <>
            <SectionHeader
              title="Aggregator Deals"
              style={styles.sectionHeaderSmall}
            />
            <FlatList
              data={aggregatorListings.slice(0, 6)}
              keyExtractor={(i) => `agg-${i.id}`}
              numColumns={2}
              columnWrapperStyle={styles.columnWrap}
              renderItem={({ item }) => <TrendingProductCard item={item} />}
              scrollEnabled={false}
              ListFooterComponent={
                <View style={{ height: insets.bottom + 26 }} />
              }
            />
          </>
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
