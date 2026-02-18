import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, ScrollView, Dimensions } from "react-native";
import CategoriesSection from "./LandingPage/CategoriesSection";
import Footer from "../Shared/Footer";

const categoriesData = require("../assets/data/categories.json");

// Map category names to icons and colors
const categoryIcons = {
  pendants: "diamond-outline",
  chains: "link-outline",
  rings: "radio-button-on-outline",
  bracelets: "ellipse-outline",
};

const categoryColors = {
  pendants: "#C9A961",
  chains: "#2E7D32",
  rings: "#E8B4B8",
  bracelets: "#4A90E2",
};

const Collections = ({ onCategorySelect, onNavigate }) => {
  const [categories, setCategories] = useState([]);
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window")
  );

  useEffect(() => {
    // Set up resize listener
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window);
    });

    // Map categories from local JSON file
    const mappedCategories = categoriesData.map((cat) => ({
      ...cat,
      _id: cat._id?.$oid || cat._id,
      icon: categoryIcons[cat.name?.toLowerCase()] || "diamond-outline",
      color: categoryColors[cat.name?.toLowerCase()] || "#C9A961",
    }));
    setCategories(mappedCategories);

    return () => subscription?.remove();
  }, []);

  const handleCategoryPress = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Catalog</Text>
      </View>
      <CategoriesSection
        categories={categories}
        onCategorySelect={handleCategoryPress}
      />
      <Footer onNavigate={onNavigate} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
  },
  header: {
    paddingTop: 120,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 42,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "center",
    letterSpacing: 2,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
});

export default Collections;
