import { ThemedText } from "@/components/themed-text";
import { formatCurrency } from "@/lib/formatters";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import React from "react";
import {
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { CompareModal } from "@/components/compare-modal";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;
const MODAL_WIDTH = Math.min(width - 32, 620);

interface ProductCardProps {
  id: string;
  title: string;
  category?: string;
  price: string | number;
  priceText?: string;
  image?: any;
  images?: string[];
  raw?: any;
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
  images,
  raw,
  onPress,
  onAddToCart,
  showAddButton = true,
  compact = false,
}: ProductCardProps) {
  const [showGallery, setShowGallery] = React.useState(false);
  const [showDetail, setShowDetail] = React.useState(false);
  const [showReviews, setShowReviews] = React.useState(false);
  const [showCompare, setShowCompare] = React.useState(false);
  const [detailIndex, setDetailIndex] = React.useState(0);
  const galleryRef = React.useRef<FlatList<any> | null>(null);
  const normalizeImageSource = (src: any) => {
    if (!src) return require("@/assets/images/favicon.png");
    if (typeof src === "string") return { uri: src };
    return src;
  };
  const fallbackImages =
    raw?.images_urls ??
    raw?.product?.images_urls ??
    raw?.supplier_product?.product?.images_urls ??
    raw?.product?.product?.images_urls ??
    raw?.images ??
    [];
  const gallerySources =
    images && images.length > 0
      ? images
      : Array.isArray(fallbackImages) && fallbackImages.length > 0
      ? fallbackImages
      : image
      ? [image]
      : [];
  const repeatedGallerySources =
    gallerySources.length === 1 ? Array(5).fill(gallerySources[0]) : gallerySources;
  const detailGallerySources = repeatedGallerySources.map(normalizeImageSource);
  const detailImageSource = detailGallerySources[detailIndex] ?? detailGallerySources[0];
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
      onPress={() => {
        if (onPress) return onPress();
        setShowDetail(true);
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.productThumbWrap, compact && styles.compactThumb]}>
        <Image
          source={image || require("@/assets/images/favicon.png")}
          style={[styles.productThumb, compact && styles.compactImage]}
        />
      </View>

      <Modal visible={showGallery} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowGallery(false)}>
              <Text style={{ fontSize: 18, color: "#fff" }}>Close</Text>
            </TouchableOpacity>
            {detailGallerySources.length > 0 ? (
              <FlatList
                ref={galleryRef}
                data={detailGallerySources}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                getItemLayout={(_, index) => ({ length: Dimensions.get("window").width, offset: Dimensions.get("window").width * index, index })}
                initialScrollIndex={Math.min(detailIndex, detailGallerySources.length - 1)}
                keyExtractor={(_, idx) => String(idx)}
                renderItem={({ item }) => (
                  <Image source={item} style={styles.modalImage} contentFit="contain" />
                )}
              />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontSize: 16 }}>No images available</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.nonScrollContainer}>
              <View style={styles.imageCarouselContainer}>
                <TouchableOpacity
                  style={styles.absoluteCloseBtn}
                  onPress={() => setShowDetail(false)}
                >
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <FlatList
                  data={detailGallerySources}
                  horizontal
                  pagingEnabled
                  bounces={false}
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / MODAL_WIDTH);
                    setDetailIndex(Math.min(index, detailGallerySources.length - 1));
                  }}
                  keyExtractor={(_, idx) => String(idx)}
                  getItemLayout={(_, index) => ({ length: MODAL_WIDTH, offset: MODAL_WIDTH * index, index })}
                  renderItem={({ item }) => (
                    <View style={styles.galleryImageWrap}>
                      <Image source={item} style={styles.galleryImage} contentFit="cover" />
                    </View>
                  )}
                />
              </View>

              {detailGallerySources.length > 1 && (
                <View style={styles.dotIndicatorRow}>
                  {detailGallerySources.map((_, idx) => (
                    <View key={idx} style={[styles.dot, detailIndex === idx && styles.dotActive]} />
                  ))}
                </View>
              )}

              <View style={styles.detailBody}>
                <Text style={styles.detailTitle} numberOfLines={1}>{title}</Text>
                
                <Text style={styles.sectionHeader}>Product Description</Text>
                <Text style={styles.detailDescription} numberOfLines={2}>
                  {raw?.description ?? raw?.product?.description ?? "Experience authentic artisan craftsmanship. This hand-woven basket is perfect for daily use, market trips, or storing fresh produce and grains. Durable, traditional materials with a modern, practical design."}
                </Text>

                <View style={styles.reviewRow}>
                  <View style={styles.reviewLeft}>
                    <Text style={styles.sectionHeader}>Reviews & Rating</Text>
                    <View style={styles.ratingBadgeNew}>
                      <MaterialIcons name="star" size={16} color="#f5a623" />
                      <MaterialIcons name="star" size={16} color="#f5a623" />
                      <MaterialIcons name="star" size={16} color="#f5a623" />
                      <MaterialIcons name="star" size={16} color="#f5a623" />
                      <MaterialIcons name="star-half" size={16} color="#f5a623" />
                      <Text style={styles.ratingTextNew}>4.5</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setShowReviews(true)}>
                    <Text style={styles.seeMoreText}>See More</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.bottomBar}>
              <View style={styles.priceStockCard}>
                <View style={styles.priceStockText}>
                  <Text style={styles.priceStockLabel}>Pricing & Stock</Text>
                  <View style={styles.priceRowDetail}>
                    <Text style={styles.detailPrice}>{displayPrice.replace(/ BR| ETB|birr/i, "").trim()}</Text>
                    <Text style={styles.detailCurrency}> birr</Text>
                  </View>
                </View>
                <View style={styles.stockStatusContainer}>
                  <MaterialIcons name="check-circle" size={16} color="#2a7f2a" />
                  <Text style={styles.priceStockStatus}> In Stock</Text>
                </View>
              </View>

              <View style={styles.compareContainer}>
                <TouchableOpacity style={styles.compareBtn} onPress={() => setShowCompare(true)}>
                  <MaterialIcons name="compare-arrows" size={20} color="#8a1d1d" />
                  <Text style={styles.compareText}>Compare with other products</Text>
                </TouchableOpacity>
              </View>

              {showAddButton && onAddToCart && (
                <TouchableOpacity
                  style={styles.detailAction}
                  onPress={() => { onAddToCart(); setShowDetail(false); }}
                >
                  <Text style={styles.detailActionText}>Add to cart</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showReviews} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.reviewsModalCard}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.reviewsModalTitle}>Reviews</Text>
              <TouchableOpacity
                style={styles.reviewsCloseBtn}
                onPress={() => setShowReviews(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.reviewsScroll}>
              {[
                { name: "Abebe Kebede", rating: 5, date: "2 days ago", text: "Excellent quality and fast delivery. Very satisfied!" },
                { name: "Selamawit T.", rating: 4, date: "1 week ago", text: "Good product, exactly as described. The packaging was also secure." },
                { name: "Dawit M.", rating: 5, date: "2 weeks ago", text: "Highly recommended for anyone looking for reliable artisan goods." },
                { name: "Helen B.", rating: 4, date: "1 month ago", text: "Nice item, the texture is great. Took a bit longer to arrive." }
              ].map((review, idx) => (
                <View key={idx} style={styles.reviewCard}>
                  <View style={styles.reviewHeaderRow}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{review.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewAuthor}>{review.name}</Text>
                      <View style={styles.reviewStars}>
                        {[...Array(5)].map((_, i) => (
                          <MaterialIcons key={i} name="star" size={14} color={i < review.rating ? "#f5a623" : "#e0e0e0"} />
                        ))}
                        <Text style={styles.reviewDate}>{review.date}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewBody}>{review.text}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Compare Modal */}
      <CompareModal
        visible={showCompare}
        onClose={() => setShowCompare(false)}
        initialProduct={{
          id,
          title,
          price: displayPrice,
          image: image || (images && images[0]) || null,
          raw
        }}
      />

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
  thumbRow: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
  },
  thumbImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 6,
    resizeMode: "cover",
    backgroundColor: "#fff",
  },
  moreBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: { fontSize: 12, color: "#333" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "92%",
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
  },
  modalSafeContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  detailModalCard: {
    width: "100%",
    maxWidth: MODAL_WIDTH,
    maxHeight: "92%",
    backgroundColor: "#fff",
    borderRadius: 28,
    overflow: "hidden",
    flexShrink: 1,
  },
  nonScrollContainer: {
    flexShrink: 1,
  },
  detailHeader: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    alignItems: "flex-end",
    backgroundColor: "#fff",
  },
  detailScrollContent: {
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  imageCarouselContainer: {
    width: MODAL_WIDTH,
    height: MODAL_WIDTH * 0.55,
    backgroundColor: "#fff",
    alignSelf: "center",
  },
  galleryImageWrap: {
    width: MODAL_WIDTH,
    height: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    backgroundColor: "#f4f4f4",
    borderRadius: 20,
  },
  detailScroll: {
    alignItems: "center",
    paddingBottom: 24,
  },
  detailImageSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 16,
  },
  detailImageWrap: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#f4f4f4",
    alignItems: "center",
    justifyContent: "center",
  },
  detailImage: {
    width: "100%",
    height: Dimensions.get("window").height * 0.45,
    resizeMode: "contain",
    backgroundColor: "#f4f4f4",
  },
  detailThumbRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    justifyContent: "center",
  },
  detailThumbButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  dotIndicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#8a1d1d",
  },
  detailBody: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 8,
    flexShrink: 1,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    lineHeight: 26,
  },
  detailCategory: {
    color: "#6b6b6b",
    marginBottom: 8,
    fontSize: 14,
  },
  detailPrice: {
    fontSize: 28,
    color: "#8a1d1d",
    fontWeight: "800",
  },
  detailCurrency: {
    fontSize: 14,
    color: "#6b6b6b",
    marginLeft: 4,
    marginBottom: 4,
  },
  priceRowDetail: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  detailDescription: {
    color: "#333",
    marginBottom: 8,
    lineHeight: 20,
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1c1c",
    marginBottom: 4,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewLeft: {
    flexDirection: "column",
  },
  ratingBadgeNew: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingTextNew: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  seeMoreBtn: {
    backgroundColor: "#f5e8e8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  seeMoreText: {
    color: "#8a1d1d",
    fontWeight: "700",
    fontSize: 13,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    backgroundColor: "#fff",
  },
  priceStockCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceStockText: {
    flex: 1,
  },
  priceStockLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1c1c",
    marginBottom: 4,
  },
  stockStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  priceStockStatus: {
    fontSize: 14,
    color: "#2a7f2a",
    fontWeight: "600",
  },
  detailAction: {
    backgroundColor: "#8a1d1d",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  compareContainer: {
    marginBottom: 12,
  },
  compareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#f9f2f2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eedddd",
  },
  compareText: {
    marginLeft: 8,
    color: "#8a1d1d",
    fontWeight: "700",
    fontSize: 14,
  },
  detailActionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  absoluteCloseBtn: {
    position: "absolute",
    top: 28,
    right: 28,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalClose: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#8a1d1d",
    fontWeight: "700",
  },
  reviewsModalCard: {
    width: "100%",
    maxWidth: MODAL_WIDTH,
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
  },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  reviewsModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1c1c",
  },
  reviewsCloseBtn: {
    padding: 4,
  },
  reviewsScroll: {
    padding: 20,
  },
  reviewCard: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    paddingBottom: 20,
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8a1d1d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reviewAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  reviewMeta: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1c1c",
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewDate: {
    marginLeft: 8,
    fontSize: 12,
    color: "#888",
  },
  reviewBody: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
});
