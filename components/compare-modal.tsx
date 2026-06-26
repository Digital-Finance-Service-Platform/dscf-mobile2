import { ThemedText } from "@/components/themed-text";
import { formatCurrency } from "@/lib/formatters";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
} from "react-native";

import { marketGetAggregatorListings } from "@/lib/api/clients";

const MODAL_WIDTH = Dimensions.get("window").width > 600 ? 500 : "90%";

interface CompareModalProps {
  visible: boolean;
  onClose: () => void;
  initialProduct?: any;
}

export function CompareModal({ visible, onClose, initialProduct }: CompareModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Fetch aggregator products when modal opens
  React.useEffect(() => {
    let mounted = true;
    if (visible) {
      setIsLoadingProducts(true);
      marketGetAggregatorListings()
        .then((res) => {
          if (!mounted) return;
          const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          
          const mapped = data.map((listing: any) => {
            const product = listing?.product ?? listing?.supplier_product?.product ?? {};
            const thumbnail = listing?.supplier_product?.product?.thumbnail_url ?? product?.thumbnail_url ?? null;
            const imagesArr = listing?.images_urls ?? listing?.supplier_product?.product?.images_urls ?? product?.images_urls ?? (thumbnail ? [thumbnail] : []);
            
            const title = listing?.product_name ?? product?.name ?? listing?.title ?? "Untitled";
            const priceVal = listing?.price ?? listing?.supplier_price ?? listing?.price_text ?? 0;
            let numericPrice = 0;
            if (typeof priceVal === 'number') {
              numericPrice = priceVal;
            } else {
              const numMatch = String(priceVal).match(/[\d.]+/);
              if (numMatch) numericPrice = parseFloat(numMatch[0]);
            }

            return {
              id: String(listing?.id ?? title),
              title,
              price: numericPrice,
              packaging: listing?.unit?.name ?? product?.unit?.name ?? "Pcs",
              quantity: listing?.stock_quantity ?? listing?.quantity ?? "In Stock",
              image: imagesArr && imagesArr.length > 0 ? imagesArr[0] : null,
            };
          });
          setAvailableProducts(mapped);
        })
        .catch((err) => {
          console.warn("Failed to load aggregator feed for comparison:", err);
        })
        .finally(() => {
          if (mounted) setIsLoadingProducts(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [visible]);

  // Initialize with the product that triggered the modal
  React.useEffect(() => {
    if (visible && initialProduct) {
      // Extract numeric price from string if needed
      let numericPrice = 100;
      if (typeof initialProduct.price === 'number') {
        numericPrice = initialProduct.price;
      } else {
        const numMatch = String(initialProduct.price).match(/[\d.]+/);
        if (numMatch) {
          numericPrice = parseFloat(numMatch[0]);
        }
      }
      
      const formattedInitial = {
        id: initialProduct.id || "init",
        title: initialProduct.title || "Selected Product",
        price: numericPrice,
        packaging: "Pcs", // Mock packaging
        quantity: 50,     // Mock quantity
        image: initialProduct.image?.uri || initialProduct.image || null,
      };
      setSelectedProducts([formattedInitial]);
      setIsComparing(false);
      setSearchQuery("");
    }
  }, [visible, initialProduct]);

  const searchResults = availableProducts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedProducts.find((sp) => sp.id === p.id)
  );

  const handleAddProduct = (product: any) => {
    if (selectedProducts.length < 3) {
      setSelectedProducts([...selectedProducts, product]);
      setSearchQuery("");
    }
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const startComparing = () => {
    if (selectedProducts.length >= 2) {
      setIsComparing(true);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>Product Comparison</ThemedText>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {!isComparing ? (
            <View style={styles.selectionContainer}>
              <ThemedText style={styles.stepTitle}>Select Products to Compare</ThemedText>
              <ThemedText style={styles.stepSubtitle}>
                Add up to 3 products to compare their features.
              </ThemedText>

              {/* Selected Products Chips */}
              <View style={styles.selectedChips}>
                {selectedProducts.map((p) => (
                  <View key={p.id} style={styles.chip}>
                    <ThemedText style={styles.chipText} numberOfLines={1}>
                      {p.title}
                    </ThemedText>
                    {selectedProducts.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveProduct(p.id)}>
                        <MaterialIcons name="cancel" size={18} color="#8a1d1d" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {/* Search / Dropdown */}
              {selectedProducts.length < 3 && (
                <View style={styles.searchWrapper}>
                  <View style={styles.searchInputContainer}>
                    <MaterialIcons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search to add products..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor="#888"
                    />
                  </View>
                  
                  <View style={styles.dropdown}>
                    {isLoadingProducts ? (
                      <ActivityIndicator size="small" color="#8a1d1d" style={{ padding: 20 }} />
                    ) : (
                      <ScrollView 
                        nestedScrollEnabled={true} 
                        style={{ maxHeight: 110 }} 
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                      >
                        {searchResults.length > 0 ? (
                          searchResults.map((p) => (
                            <TouchableOpacity
                              key={p.id}
                              style={styles.dropdownItem}
                              onPress={() => handleAddProduct(p)}
                            >
                              <Image source={{ uri: p.image }} style={styles.dropdownImage} />
                              <ThemedText style={styles.dropdownText}>{p.title}</ThemedText>
                              <MaterialIcons name="add" size={20} color="#8a1d1d" />
                            </TouchableOpacity>
                          ))
                        ) : (
                          <ThemedText style={styles.noResults}>No products found.</ThemedText>
                        )}
                      </ScrollView>
                    )}
                  </View>
                </View>
              )}

              <View style={{ flex: 1 }} />

              {/* Action */}
              <TouchableOpacity
                style={[
                  styles.startBtn,
                  selectedProducts.length < 2 && styles.startBtnDisabled,
                ]}
                disabled={selectedProducts.length < 2}
                onPress={startComparing}
              >
                <Text style={styles.startBtnText}>Start Comparing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.comparisonContainer}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setIsComparing(false)}>
                <MaterialIcons name="arrow-back" size={20} color="#8a1d1d" />
                <ThemedText style={styles.backText}>Edit Selection</ThemedText>
              </TouchableOpacity>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.table}>
                  {/* Table Header */}
                  <View style={[styles.row, styles.headerRow]}>
                    <View style={[styles.cell, styles.paramCell]}>
                      <ThemedText style={styles.headerText}>Comparing parameter</ThemedText>
                    </View>
                    {selectedProducts.map((p, idx) => (
                      <View key={p.id} style={styles.cell}>
                        <ThemedText style={styles.headerText}>Product {idx + 1}</ThemedText>
                        <ThemedText style={styles.productName} numberOfLines={1}>
                          {p.title}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Row: Price */}
                  <View style={styles.row}>
                    <View style={[styles.cell, styles.paramCell]}>
                      <ThemedText style={styles.paramText}>Price</ThemedText>
                    </View>
                    {selectedProducts.map((p) => (
                      <View key={p.id} style={styles.cell}>
                        <ThemedText style={styles.valueText}>{p.price}</ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Row: Packaging */}
                  <View style={[styles.row, styles.altRow]}>
                    <View style={[styles.cell, styles.paramCell]}>
                      <ThemedText style={styles.paramText}>Packaging</ThemedText>
                    </View>
                    {selectedProducts.map((p) => (
                      <View key={p.id} style={styles.cell}>
                        <ThemedText style={styles.valueText}>{p.packaging}</ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Row: Quantity */}
                  <View style={styles.row}>
                    <View style={[styles.cell, styles.paramCell]}>
                      <ThemedText style={styles.paramText}>Quantity available</ThemedText>
                    </View>
                    {selectedProducts.map((p) => (
                      <View key={p.id} style={styles.cell}>
                        <ThemedText style={styles.valueText}>{p.quantity}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: MODAL_WIDTH,
    maxHeight: "85%",
    height: 500,
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1c1c",
  },
  closeBtn: {
    padding: 4,
  },
  selectionContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1c1c",
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
  },
  selectedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f2f2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eedddd",
  },
  chipText: {
    fontSize: 13,
    color: "#8a1d1d",
    fontWeight: "600",
    marginRight: 6,
    maxWidth: 120,
  },
  searchWrapper: {
    position: "relative",
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  dropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    maxHeight: 126,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  dropdownImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  noResults: {
    padding: 12,
    textAlign: "center",
    color: "#888",
    fontSize: 14,
  },
  startBtn: {
    backgroundColor: "#8a1d1d",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startBtnDisabled: {
    backgroundColor: "#ccc",
  },
  startBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  comparisonContainer: {
    flex: 1,
    padding: 20,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#8a1d1d",
    fontWeight: "600",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  altRow: {
    backgroundColor: "#fafafa",
  },
  headerRow: {
    backgroundColor: "#fce97f", // Matching the yellow from the screenshot
    borderBottomWidth: 2,
  },
  cell: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
    justifyContent: "center",
  },
  paramCell: {
    width: 140,
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#333",
    fontStyle: "italic",
    textAlign: "center",
  },
  productName: {
    fontSize: 11,
    color: "#555",
    textAlign: "center",
    marginTop: 4,
  },
  paramText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  valueText: {
    fontSize: 13,
    color: "#444",
  },
});