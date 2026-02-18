import React, { useMemo, useState } from "react";
import { StyleSheet, View, Image, Text, TouchableOpacity } from "react-native";

const ProductCard = (props) => {
  const { name, image, images, price, countInStock, onPress } = props;
  const [idx, setIdx] = useState(0);

  const imgList = useMemo(() => {
    if (Array.isArray(images) && images.length) return images.filter(Boolean);
    return image ? [image] : [];
  }, [images, image]);

  const currentImage = imgList[idx] || imgList[0] || null;

  const formatPrice = (price) => {
    if (!price) return "Price on request";
    return `$${price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const CardContent = (
    <>
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          source={{
            uri: currentImage
              ? currentImage
              : "https://bobbywhite.com/cdn/shop/products/Lionfront.jpg?v=1635864807&width=1080",
          }}
          resizeMode="contain"
        />
        {imgList.length > 1 && (
          <>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnLeft]}
              onPress={() => setIdx((p) => (p - 1 + imgList.length) % imgList.length)}
              activeOpacity={0.85}
            >
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnRight]}
              onPress={() => setIdx((p) => (p + 1) % imgList.length)}
              activeOpacity={0.85}
            >
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
            <View style={styles.dots}>
              {imgList.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === idx && styles.dotActive]}
                />
              ))}
            </View>
          </>
        )}
        {countInStock === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.price}>{formatPrice(price)}</Text>
        {typeof countInStock === "number" && (
          <Text style={[styles.stockText, countInStock === 0 && styles.stockTextZero]}>
            {countInStock === 0 ? "Out of stock" : `${countInStock} in stock`}
            {countInStock > 0 && countInStock <= 5 ? ` · Only ${countInStock} left` : ""}
          </Text>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{CardContent}</View>;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    marginBottom: 30,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#ffffff",
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnLeft: { left: 10 },
  navBtnRight: { right: 10 },
  navBtnText: { color: "#fff", fontSize: 20, fontWeight: "700", lineHeight: 22 },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  dotActive: {
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 0,
    alignItems: "flex-start",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 13,
    fontWeight: "400",
    color: "#1a1a1a",
    marginBottom: 6,
    lineHeight: 18,
    letterSpacing: 0,
  },
  price: {
    fontSize: 14,
    fontWeight: "400",
    color: "#1a1a1a",
    letterSpacing: 0,
  },
  stockText: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b6b6b",
    fontWeight: "500",
  },
  stockTextZero: {
    color: "#9b3c3c",
  },
});

export default ProductCard;
