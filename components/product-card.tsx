import React from "react";
import { StyleSheet, View, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/themed-text";
import { formatCurrency } from "@/lib/formatters";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

interface ProductCardProps {
  id: string;
  title: string;
  category?: string;
  price: string | number;
  priceText?: string;
  image?: any;
  onPress?: () => void;
  onAddToCart?: () => void;
  showAddButton?: boolean;
  compact?: boolean;
}

export function ProductCard({
  id,
  title,
  category,
  price,
  priceText,
  image,
  onPress,
  onAddToCart,
  showAddButton = true,
  compact = false,
}: ProductCardProps) {
  let displayPrice: string;
  if (priceText !== undefined) {
    displayPrice = String(priceText);
  } else if (typeof price === "number") {
    displayPrice = formatCurrency(price);
  } else {
    // try to extract numeric value from string and format; otherwise show raw string
    const num = parseFloat(String(price).replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(num)) displayPrice = formatCurrency(num);
    else displayPrice = String(price);
  }

  return (
    <TouchableOpacity
      style={[styles.productCard, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.productThumbWrap, compact && styles.compactThumb]}>
        <Image
          source={image || require("@/assets/images/icon.png")}
          style={[styles.productThumb, compact && styles.compactImage]}
        />
      </View>

      {category && (
        <ThemedText
          type="default"
          style={[styles.categoryText, compact && styles.compactCategory]}
        >
          {category.toUpperCase()}
        </ThemedText>
      )}

      <ThemedText
        type="subtitle"
        style={[styles.productTitle, compact && styles.compactTitle]}
        numberOfLines={2}
      >
        {title}
      </ThemedText>

      <View style={styles.cardFooter}>
        <ThemedText
          type="title"
          lightColor="#8a1d1d"
          style={[styles.productPrice, compact && styles.compactPrice]}
        >
          {displayPrice}
        </ThemedText>

        {showAddButton && onAddToCart && (
          <TouchableOpacity
            style={[styles.addButton, compact && styles.compactButton]}
            onPress={onAddToCart}
            accessibilityLabel="Add to cart"
          >
            <MaterialIcons
              name="add"
              size={compact ? 16 : 18}
              color="#6b6b6b"
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: "space-between",
    minHeight: 200,
  },
  compactCard: {
    width: CARD_WIDTH * 0.8,
    padding: 8,
    marginBottom: 8,
    minHeight: 170,
  },
  productThumbWrap: {
    backgroundColor: "#f6f6f6",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  compactThumb: {
    padding: 8,
    marginBottom: 6,
  },
  productThumb: { width: 80, height: 80, resizeMode: "contain" },
  compactImage: { width: 60, height: 60 },
  categoryText: {
    fontSize: 12,
    color: "#5A413D",
    marginBottom: 6,
  },
  compactCategory: {
    fontSize: 10,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 13,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  productPrice: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: "#8a1d1d",
  },
  compactPrice: {
    fontSize: 16,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  compactButton: {
    borderRadius: 12,
    padding: 4,
  },
});
