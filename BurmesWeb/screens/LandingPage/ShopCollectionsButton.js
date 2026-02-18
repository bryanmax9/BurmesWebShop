import React from "react";
import { TouchableOpacity, StyleSheet, Text, Dimensions } from "react-native";

const ShopCollectionsButton = ({ onPress }) => {
  const windowDimensions = Dimensions.get("window");
  const isSmallScreen = windowDimensions.width < 768;

  return (
    <TouchableOpacity
      style={[
        styles.shopButton,
        {
          paddingVertical: isSmallScreen ? 14 : 16,
          paddingHorizontal: isSmallScreen ? 28 : 40,
        },
      ]}
      onPress={() => onPress && onPress()}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.shopButtonText,
          {
            fontSize: isSmallScreen ? 13 : 14,
            letterSpacing: isSmallScreen ? 1.5 : 2,
          },
        ]}
      >
        SHOP COLLECTIONS
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shopButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 4,
  },
  shopButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
});

export default ShopCollectionsButton;
