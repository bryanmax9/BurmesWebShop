import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import ProductCard from "./ProductCard";

const ProductList = (props) => {
  const { item, onProductPress } = props;

  // State to track window dimensions - updates dynamically
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window")
  );

  // Set up resize listener for dynamic updates
  useEffect(() => {
    // Function to handle dimension changes
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window);
    });

    // Cleanup: remove listener when component unmounts
    return () => subscription?.remove();
  }, []);

  // Responsive width: 3 cols default, 2 cols medium, 1 col small
  const getWidth = () => {
    const width = windowDimensions.width;
    if (width < 600) return "100%"; // 1 column
    if (width < 1024) return "50%"; // 2 columns
    return "33.333%"; // 3 columns (default)
  };

  const getPadding = () => {
    const width = windowDimensions.width;
    if (width < 600) return 10;
    if (width < 1024) return 20;
    return 15;
  };

  const getMarginBottom = () => {
    const width = windowDimensions.width;
    return width < 600 ? 20 : 0;
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: getWidth(),
          paddingLeft: getPadding(),
          marginBottom: getMarginBottom(),
        },
      ]}
    >
      <View style={styles.cardWrapper}>
        <ProductCard
          {...item}
          onPress={() => onProductPress && onProductPress(item)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Dynamic styles are applied inline based on windowDimensions
  },
  cardWrapper: {
    flex: 1,
  },
});

export default ProductList;
