import React from "react";
import { TouchableOpacity, StyleSheet, Text, Dimensions } from "react-native";

const DiscoverMoreButton = ({ onPress }) => {
  const windowDimensions = Dimensions.get("window");
  const isSmallScreen = windowDimensions.width < 768;

  return (
    <TouchableOpacity
      style={[
        styles.discoverButton,
        {
          paddingVertical: isSmallScreen ? 14 : 16,
          paddingHorizontal: isSmallScreen ? 28 : 40,
          alignSelf: "flex-start",
        },
      ]}
      onPress={() => {
        if (onPress && typeof onPress === "function") {
          onPress();
        }
      }}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.discoverButtonText,
          {
            fontSize: isSmallScreen ? 13 : 14,
            letterSpacing: isSmallScreen ? 1.5 : 2,
          },
        ]}
      >
        DISCOVER MORE
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  discoverButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
  },
  discoverButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
});

export default DiscoverMoreButton;
