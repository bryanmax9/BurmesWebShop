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
          paddingTop: isSmallScreen ? 56 : 80,
          paddingBottom: isSmallScreen ? 56 : 100,
        },
      ]}
    >
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.eyebrow}>Colecciones</Text>
        <Text
          style={[styles.sectionTitle, { fontSize: isSmallScreen ? 26 : 34 }]}
          accessibilityRole="header"
          aria-level={2}
        >
          Explora nuestra joyería
        </Text>
        <View style={styles.titleDivider} />
        <Text
          style={[styles.sectionSubtitle, { fontSize: isSmallScreen ? 14 : 16 }]}
        >
          Elige tu pieza atemporal
        </Text>
      </View>

      {/* Grid */}
      <View
        style={[
          styles.categoriesGrid,
          { gap: isSmallScreen ? 16 : 20 },
        ]}
      >
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
    backgroundColor: "#fafaf8",
    width: "100%",
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 48,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9b8c6e",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.5,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  titleDivider: {
    width: 40,
    height: 2,
    backgroundColor: "#9b8c6e",
    borderRadius: 1,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontWeight: "400",
    color: "#888",
    textAlign: "center",
    letterSpacing: 0.4,
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
