import React from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import CategoryCard from "./CategoryCard";

const CategoriesSection = ({ categories, onCategorySelect }) => {
  const windowDimensions = Dimensions.get("window");
  const isSmallScreen = windowDimensions.width < 768;

  const getContainerPadding = () => {
    if (windowDimensions.width < 600) return 20;
    if (windowDimensions.width < 1024) return 40;
    return 80;
  };

  return (
    <View
      style={[
        styles.mainContent,
        {
          paddingHorizontal: getContainerPadding(),
          paddingTop: isSmallScreen ? 60 : 80,
          paddingBottom: isSmallScreen ? 60 : 100,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionTitle, { fontSize: isSmallScreen ? 24 : 28 }]}
        >
          Browse our Jewelry
        </Text>
        <Text
          style={[
            styles.sectionSubtitle,
            { fontSize: isSmallScreen ? 14 : 16 },
          ]}
        >
          Choose your timeless piece
        </Text>
      </View>

      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <CategoryCard
            key={category._id || category.id}
            category={category}
            onPress={onCategorySelect}
            isSmallScreen={isSmallScreen}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    paddingTop: 80,
    paddingBottom: 100,
    backgroundColor: "#ffffff",
    width: "100%",
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 60,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 1,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#757575",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
    width: "100%",
  },
});

export default CategoriesSection;
