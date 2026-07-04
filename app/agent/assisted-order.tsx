import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View
} from "react-native";

import { FilterChips } from "@/components/filter-chips";
import KeGebeyaLoader from "@/components/KeGebeyaLoader";
import { PageShell } from "@/components/page-shell";
import { ProductCard } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { marketGetAggregatorListings } from "@/lib/api/clients";
import { formatCurrency } from "@/lib/formatters";
import { useSdk } from "@/lib/sdk/context";

type CartItem = {
  id: string;
  title: string;
  category: string;
  price: number;
  quantity: number;
  image: any;
  listing_id?: number;
  product_id?: number;
  unit_id?: number;
  ordered_to_id?: number;
  raw?: any;
};

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
  const image =
    imagesArr && imagesArr.length > 0
      ? { uri: imagesArr[0] }
      : require("@/assets/images/logo1.png");
  const title =
    listing?.product_name ?? product?.name ?? listing?.title ?? "Untitled";
  const category = product?.category?.name ?? listing?.category ?? "";
  const price =
    listing?.price ?? listing?.supplier_price ?? listing?.price_text ?? 0;

  return {
    id: String(listing?.id ?? title),
    title,
    category,
    price,
    image,
    images: imagesArr,
    raw: listing,
    listing_id: listing?.id,
    product_id:
      listing?.product?.id ?? listing?.supplier_product?.product?.id,
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

export default function AssistedOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useSdk();

  const retailerId = params.retailerId as string;
  const retailerName = params.retailerName as string;
  const retailerPhone = params.retailerPhone as string;

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [itemToAdd, setItemToAdd] = useState<any>(null);
  const [quantity, setQuantity] = useState("1");

  // Dynamically build categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    listings.forEach((item) => {
      const categoryLabel = item.category || item.title;
      if (categoryLabel) cats.add(categoryLabel);
    });
    return ["All", ...Array.from(cats)];
  }, [listings]);

  const filteredListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let items = listings;

    if (selectedCategory !== "All") {
      items = items.filter(
        (item) =>
          item.category === selectedCategory || item.title === selectedCategory
      );
    }

    if (query) {
      items = items.filter((item) =>
        String(item.title).toLowerCase().includes(query)
      );
    }

    return [...items].sort((a, b) =>
      String(a.title).localeCompare(String(b.title))
    );
  }, [listings, selectedCategory, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await marketGetAggregatorListings();
        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        if (mounted) {
          setListings(data.map(mapApiListingToCard));
          setError(null);
        }
      } catch (err) {
        console.warn("Failed to load marketplace listings:", err);
        if (mounted) {
          setError("Failed to load marketplace listings.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = (item: any) => {
    setItemToAdd(item);
    setQuantity("1");
    setShowCartModal(true);
  };

  const confirmAddToCart = () => {
    if (!itemToAdd) return;

    const qty = parseInt(quantity) || 1;
    const price =
      parseFloat(String(itemToAdd.price).replace(/[^0-9.]/g, "")) || 0;

    const existingIndex = cart.findIndex((c) => c.id === itemToAdd.id);

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += qty;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: itemToAdd.id,
          title: itemToAdd.title,
          category: itemToAdd.category,
          price,
          quantity: qty,
          image: itemToAdd.image,
          listing_id: itemToAdd.listing_id,
          product_id: itemToAdd.product_id,
          unit_id: itemToAdd.unit_id,
          ordered_to_id: itemToAdd.ordered_to_id,
          raw: itemToAdd.raw,
        },
      ]);
    }

    setShowCartModal(false);
    setItemToAdd(null);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    // Navigate to OTP confirmation
    router.push({
      pathname: "/agent/order-confirmation",
      params: {
        retailerId,
        retailerName,
        retailerPhone,
        cartData: JSON.stringify(cart),
        total: cartTotal.toString(),
      },
    });
  };

  return (
    <PageShell
      title={`Order for ${retailerName}`}
      subtitle={retailerPhone}
      showBackButton
      style={styles.shell}
    >
      <ThemedView style={styles.container}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        <FilterChips
          filters={categories.map((cat) => ({ key: cat, label: cat }))}
          active={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {loading ? (
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <KeGebeyaLoader />
          </View>
        ) : error ? (
          <View
            style={{
              marginTop: 24,
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            <ThemedText
              type="default"
              lightColor="#6b6b6b"
              style={{ textAlign: "center" }}
            >
              {error}
            </ThemedText>
          </View>
        ) : filteredListings.length === 0 ? (
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <ThemedText type="default" lightColor="#6b6b6b">
              No products found.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredListings}
            keyExtractor={(i) => `product-${i.id}`}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            renderItem={({ item }) => (
              <ProductCard
                id={item.id}
                title={item.title}
                category={item.category}
                price={item.price}
                image={item.image}
                images={item.images}
                raw={item.raw}
                onAddToCart={() => handleAddToCart(item)}
              />
            )}
            scrollEnabled={false}
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
        )}

        {/* Cart Badge */}
        {cart.length > 0 && (
          <Pressable
            style={styles.cartFab}
            onPress={() =>
              router.push({
                pathname: "/agent/order-confirmation",
                params: {
                  retailerId,
                  retailerName,
                  retailerPhone,
                  cartData: JSON.stringify(cart),
                  total: cartTotal.toString(),
                },
              })
            }
          >
            <MaterialIcons name="shopping-cart" size={24} color="#fff" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <ThemedText
                  type="defaultSemiBold"
                  style={styles.cartBadgeText}
                >
                  {cartCount}
                </ThemedText>
              </View>
            )}
          </Pressable>
        )}

        {/* Add to Cart Modal */}
        <Modal
          visible={showCartModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCartModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowCartModal(false)}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle">Add to Cart</ThemedText>
                <Pressable onPress={() => setShowCartModal(false)}>
                  <MaterialIcons name="close" size={24} color="#0a2f4a" />
                </Pressable>
              </View>

              {itemToAdd && (
                <>
                  <ThemedText type="defaultSemiBold" style={{ marginTop: 12 }}>
                    {itemToAdd.title}
                  </ThemedText>
                  <ThemedText
                    type="default"
                    lightColor="#6b6b6b"
                    style={{ marginTop: 4 }}
                  >
                    {formatCurrency(itemToAdd.price)}
                  </ThemedText>

                  <View style={styles.quantityRow}>
                    <ThemedText type="default">Quantity:</ThemedText>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={styles.totalRow}>
                    <ThemedText type="defaultSemiBold">Total:</ThemedText>
                    <ThemedText type="defaultSemiBold">
                      {formatCurrency(
                        itemToAdd.price * (parseInt(quantity) || 1)
                      )}
                    </ThemedText>
                  </View>

                  <Pressable
                    style={styles.addButton}
                    onPress={confirmAddToCart}
                  >
                    <ThemedText
                      type="defaultSemiBold"
                      style={{ color: "#fff" }}
                    >
                      Add to Cart
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </ThemedView>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 60 },
  container: {
    flex: 1,
    padding: 16,
  },
  columnWrap: { justifyContent: "space-between", marginTop: 12 },
  cartFab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0a2f4a",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#8a1d1d",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  quantityInput: {
    borderWidth: 2,
    borderColor: "#0a2f4a",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 80,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(10, 47, 74, 0.1)",
  },
  addButton: {
    marginTop: 20,
    backgroundColor: "#0a2f4a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});
