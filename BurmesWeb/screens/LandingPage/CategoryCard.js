import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Map category names to images
const categoryImages = {
  pendants: require("../../assets/pendants.png"),
  chains: require("../../assets/chains.png"),
  rings: require("../../assets/rings.png"),
  bracelets: require("../../assets/bracelet.png"),
};

const CategoryCard = ({ category, onPress, isSmallScreen }) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        {
          width: isSmallScreen ? "100%" : "48%",
          marginBottom: isSmallScreen ? 20 : 30,
          height: isSmallScreen ? 180 : 250,
        },
      ]}
      onPress={() => onPress && onPress(category)}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={
          categoryImages[category.name?.toLowerCase()] ||
          categoryImages.pendants
        }
        style={[
          styles.categoryImageBackground,
          {
            height: isSmallScreen ? 180 : 250,
            minHeight: isSmallScreen ? 180 : 250,
          },
        ]}
        imageStyle={styles.categoryImage}
        resizeMode="cover"
      >
        {/* Linear Gradient Overlay */}
        <View style={styles.gradientOverlay}>
          <View style={styles.gradientLayer1} />
          <View style={styles.gradientLayer2} />
          <View style={styles.gradientLayer3} />
          <View style={styles.gradientLayer4} />
          <View style={styles.gradientLayer5} />
        </View>

        {/* Content */}
        <View
          style={[
            styles.categoryCardContent,
            { padding: isSmallScreen ? 20 : 30 },
          ]}
        >
          <Text
            style={[
              styles.categoryName,
              {
                fontSize: isSmallScreen ? 20 : 24,
                letterSpacing: isSmallScreen ? 1 : 1.5,
              },
            ]}
          >
            {category.name
              ? category.name.charAt(0).toUpperCase() + category.name.slice(1)
              : category.name}
          </Text>
          <View style={styles.categoryArrow}>
            <Ionicons
              name="arrow-forward"
              size={isSmallScreen ? 18 : 20}
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
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
    alignSelf: "stretch",
  },
  categoryImageBackground: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryImage: {
    borderRadius: 12,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientLayer1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "20%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  gradientLayer2: {
    position: "absolute",
    top: "20%",
    left: 0,
    right: 0,
    height: "20%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  gradientLayer3: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    height: "20%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  gradientLayer4: {
    position: "absolute",
    top: "60%",
    left: 0,
    right: 0,
    height: "20%",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  gradientLayer5: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "20%",
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  categoryCardContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    width: "100%",
    minHeight: "100%",
  },
  categoryName: {
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "'Playfair Display', Georgia, serif",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoryArrow: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 8,
  },
});

export default CategoryCard;
