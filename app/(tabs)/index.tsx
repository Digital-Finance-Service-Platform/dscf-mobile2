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
import { marketGetAggregatorListings, marketGetVisibleListings } from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";

// Removed hardcoded TRENDING fixture — listings are loaded from the API only.

function mapApiListingToCard(listing: any) {
  const product = listing?.product ?? listing?.supplier_product?.product ?? {};
  const thumbnail =
    listing?.thumbnail_url ??
    listing?.supplier_product?.product?.thumbnail_url ??
    product?.thumbnail_url ??
    null;
  const imagesArr =
    listing?.images_urls ??
    listing?.supplier_product?.product?.images_urls ??
    product?.images_urls ??
    (thumbnail ? [thumbnail] : []);
  const image = imagesArr && imagesArr.length > 0 ? { uri: imagesArr[0] } : require("@/assets/images/logo1.png");
  const title = listing?.product_name ?? product?.name ?? listing?.title ?? "Untitled";
  const category = product?.category?.name ?? listing?.category ?? "";
  const price =
    listing?.price ?? listing?.supplier_price ?? listing?.price_text ?? 0;
  
  // Patch missing description if available in listing
  if (!listing?.description && listing?.product_description) {
    listing.description = listing.product_description;
  }
  return {
    id: String(listing?.id ?? title),
    title,
    category,
    price,
    image,
    images: imagesArr,
    raw: listing,
    listing_id: listing?.id,
    product_id: listing?.product?.id ?? listing?.supplier_product?.product?.id,
    unit_id:
      listing?.unit_id ??
      listing?.unit?.id ??
      listing?.product?.unit_id ??
      listing?.product?.unit?.id ??
      listing?.supplier_product?.product?.unit_id ??
      listing?.supplier_product?.product?.unit?.id,
    ordered_to_id:
      listing?.supplier_id ??
      listing?.seller_id ??
      listing?.user_id ??
      listing?.supplier_product?.supplier_id ??
      listing?.supplier_product?.supplier?.id,
  };
}

function SearchBarComponent({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  return <SearchBar value={value} onChangeText={onChangeText} />;
}

function CategoryChips({
  active,
  onSelect,
  categories,
}: {
  active: string;
  onSelect: (c: string) => void;
  categories: string[];
}) {
  const filters = categories.map((cat) => ({ key: cat, label: cat }));
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
      raw: item.raw ?? item,
      listing_id: item.listing_id,
      product_id: item.product_id,
      unit_id: item.unit_id,
      ordered_to_id: item.ordered_to_id,
    });
  };

  return (
    <ProductCard
      id={item.id}
      title={item.title}
      category={item.category}
      price={item.price}
      image={item.image}
      images={item.images}
      raw={item.raw}
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
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [listings, setListings] = useState<any[]>([]);
  const [aggregatorListings, setAggregatorListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamically build categories from aggregator listings
  const categories = useMemo(() => {
    const cats = new Set<string>();
    aggregatorListings.forEach((item) => {
      const categoryLabel = item.category || item.title;
      if (categoryLabel) cats.add(categoryLabel);
    });
    return ["All", ...Array.from(cats)];
  }, [aggregatorListings]);

  const filteredAggregatorListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let items = aggregatorListings;

    if (selectedCategory !== "All") {
      items = items.filter(
        (item) =>
          item.category === selectedCategory ||
          item.title === selectedCategory,
      );
    }

    if (query) {
      items = items.filter((item) =>
        String(item.title).toLowerCase().includes(query),
      );
    }

    return [...items].sort((a, b) =>
      String(a.title).localeCompare(String(b.title)),
    );
  }, [aggregatorListings, selectedCategory, searchQuery]);

  const showFilteredAggregatorListings =
    searchQuery.trim().length > 0 || selectedCategory !== "All";

  const handleAddProduct = (item: any) => {
    const price = parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 0;
    addItem({
      id: String(item.id),
      title: item.title,
      price,
      subtitle: item.category,
      image: item.image || require("@/assets/images/logo1.png"),
      raw: item.raw ?? item,
      listing_id: item.listing_id,
      product_id: item.product_id,
      unit_id: item.unit_id,
      ordered_to_id: item.ordered_to_id,
    });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [visibleRes, aggregatorRes] = await Promise.allSettled([
          marketGetVisibleListings(),
          marketGetAggregatorListings(),
        ]);
        
        const isAuthError = (res: PromiseSettledResult<any>) =>
          res.status === "rejected" &&
          (String(res.reason).toLowerCase().includes("authentication required") ||
            String(res.reason).includes("401"));

        if (isAuthError(visibleRes) || isAuthError(aggregatorRes)) {
          console.warn("[HomeScreen] Authentication required, redirecting to login...");
          if (mounted) {
            router.replace("/login");
            return;
          }
        }
        
        const visibleData = visibleRes.status === "fulfilled"
          ? (Array.isArray(visibleRes.value?.data) ? visibleRes.value.data : Array.isArray(visibleRes.value) ? visibleRes.value : [])
          : [];
        const aggregatorData = aggregatorRes.status === "fulfilled"
          ? (Array.isArray(aggregatorRes.value?.data) ? aggregatorRes.value.data : Array.isArray(aggregatorRes.value) ? aggregatorRes.value : [])
          : [];
        
        if (mounted) {
          setListings(visibleData.map(mapApiListingToCard));
          setAggregatorListings(aggregatorData.map(mapApiListingToCard));
          setError(null);
        }
      } catch (err) {
        console.warn("Failed to load marketplace listings:", err);
        const msg = String(err ?? "");
        
        if (msg.toLowerCase().includes("authentication required") || msg.includes("401")) {
          if (mounted) {
            router.replace("/login");
            return;
          }
        }
        
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

  return (
    <ParallaxScrollView>
      <ThemedView style={styles.container}>
        <SearchBarComponent value={searchQuery} onChangeText={setSearchQuery} />

        <CategoryChips
          categories={categories}
          active={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {selectedCategory === "All" && !searchQuery.trim() && <TopPickCard />}

        <SectionHeader
          title={searchQuery.trim() ? "Search Results" : "Aggregator Deals"}
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
        ) : filteredAggregatorListings.length === 0 ? (
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <ThemedText type="default" lightColor="#6b6b6b">
              No aggregator deals found.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={showFilteredAggregatorListings ? filteredAggregatorListings : aggregatorListings.slice(0, 6)}
            keyExtractor={(i) => `agg-${i.id}`}
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
