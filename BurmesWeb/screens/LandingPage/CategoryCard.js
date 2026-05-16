import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const categoryImages = {
  pendants: require("../../assets/pendants.png"),
  chains: require("../../assets/chains.png"),
  rings: require("../../assets/rings.png"),
  bracelets: require("../../assets/bracelet.png"),
  aretes: require("../../assets/areteCategory.png"),
  relojes: require("../../assets/relojesCategory.png"),
};

const categoryNamesEs = {
  pendants: "DIJES",
  chains: "CADENAS",
  rings: "ANILLOS",
  bracelets: "PULSERAS",
  aretes: "ARETES",
  relojes: "RELOJES",
  gemas: "GEMAS",
};

const CategoryCard = ({ category, onPress, isSmallScreen }) => {
  const [hovered, setHovered] = useState(false);

  const displayName = category?.name
    ? categoryNamesEs[category.name.toLowerCase()] ||
      category.name.charAt(0).toUpperCase() + category.name.slice(1)
    : "";

  const webGradientStyle =
    Platform.OS === "web"
      ? {
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.08) 65%, rgba(0,0,0,0) 100%)",
        }
      : {};

  return (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        {
          width: isSmallScreen ? "100%" : "48.5%",
          height: isSmallScreen ? 200 : 270,
          marginBottom: isSmallScreen ? 16 : 20,
        },
        hovered && styles.categoryCardHovered,
      ]}
      onPress={() => onPress && onPress(category)}
      activeOpacity={0.92}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ImageBackground
        source={
          categoryImages[category.name?.toLowerCase()] ||
          categoryImages.pendants
        }
        style={styles.categoryImageBackground}
        imageStyle={[
          styles.categoryImage,
          hovered && styles.categoryImageHovered,
        ]}
        resizeMode="cover"
      >
        {/* Smooth gradient overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.gradientOverlay,
            webGradientStyle,
          ]}
        >
          {/* Fallback layered gradient for native */}
          {Platform.OS !== "web" && (
            <>
              <View style={[styles.nativeLayer, { top: "0%", height: "12%", backgroundColor: "rgba(0,0,0,0.0)" }]} />
              <View style={[styles.nativeLayer, { top: "12%", height: "12%", backgroundColor: "rgba(0,0,0,0.04)" }]} />
              <View style={[styles.nativeLayer, { top: "24%", height: "12%", backgroundColor: "rgba(0,0,0,0.1)" }]} />
              <View style={[styles.nativeLayer, { top: "36%", height: "12%", backgroundColor: "rgba(0,0,0,0.2)" }]} />
              <View style={[styles.nativeLayer, { top: "48%", height: "12%", backgroundColor: "rgba(0,0,0,0.32)" }]} />
              <View style={[styles.nativeLayer, { top: "60%", height: "12%", backgroundColor: "rgba(0,0,0,0.48)" }]} />
              <View style={[styles.nativeLayer, { top: "72%", height: "12%", backgroundColor: "rgba(0,0,0,0.62)" }]} />
              <View style={[styles.nativeLayer, { bottom: "0%", height: "16%", backgroundColor: "rgba(0,0,0,0.78)" }]} />
            </>
          )}
        </View>

        {/* Bottom content row */}
        <View style={styles.cardContent}>
          <View style={styles.textBlock}>
            <Text
              style={[
                styles.categoryName,
                { fontSize: isSmallScreen ? 18 : 22 },
              ]}
              accessibilityRole="header"
              aria-level={3}
            >
              {displayName}
            </Text>
            <View style={styles.underline} />
          </View>

          <View style={[styles.arrowButton, hovered && styles.arrowButtonHovered]}>
            <Ionicons
              name="arrow-forward"
              size={isSmallScreen ? 16 : 18}
              color="#ffffff"
            />
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 7,
  },
  categoryCardHovered: {
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  categoryImageBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  categoryImage: {
    borderRadius: 16,
    ...(Platform.OS === "web" ? { transition: "transform 0.4s ease" } : {}),
  },
  categoryImageHovered: {
    ...(Platform.OS === "web" ? { transform: [{ scale: 1.04 }] } : {}),
  },
  gradientOverlay: {
    borderRadius: 16,
    overflow: "hidden",
  },
  nativeLayer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    zIndex: 1,
  },
  textBlock: {
    flex: 1,
  },
  categoryName: {
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 1.2,
    fontFamily: "'Playfair Display', Georgia, serif",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 6,
  },
  underline: {
    width: 28,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 1,
  },
  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    ...(Platform.OS === "web" ? { transition: "background-color 0.2s ease" } : {}),
  },
  arrowButtonHovered: {
    backgroundColor: "rgba(255,255,255,0.32)",
  },
});

export default CategoryCard;
