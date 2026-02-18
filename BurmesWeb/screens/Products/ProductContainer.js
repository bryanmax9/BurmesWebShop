import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProductList from "./ProductList";
import { useAuth } from "../../contexts/AuthContext";

const ProductContainer = ({ onScroll, selectedCategory, onProductPress }) => {
  const { getProducts } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // State to track window dimensions - updates dynamically
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window"),
  );

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, getProducts]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const categoryId = selectedCategory?._id?.$oid || selectedCategory?._id || null;
      const allProducts = await (getProducts?.(categoryId) ?? Promise.resolve([]));
      setProducts(allProducts || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Set up resize listener for dynamic updates
  useEffect(() => {
    // Function to handle dimension changes
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window);
    });

    // Cleanup: remove listener when component unmounts
    return () => subscription?.remove();
  }, []);

  // Responsive padding based on current window width
  const getPadding = () => {
    const width = windowDimensions.width;
    if (width < 600) return 10;
    if (width < 1024) return 20;
    return 40;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C9A961" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            const currentScrollY = event.nativeEvent.contentOffset.y;
            setScrollY(currentScrollY);
            if (onScroll) onScroll(currentScrollY);
          }}
          scrollEventThrottle={16}
        >
          {/* Category Header */}
          {selectedCategory && (
            <View
              style={[
                styles.categoryHeader,
                { paddingHorizontal: getPadding() },
              ]}
            >
              <View style={styles.categoryHeaderContent}>
                <View style={styles.categoryHeaderLeft}>
                  <View
                    style={[
                      styles.categoryIconContainer,
                      {
                        backgroundColor:
                          (selectedCategory.color || "#C9A961") + "20",
                      },
                    ]}
                  >
                    <Ionicons
                      name={selectedCategory.icon || "diamond-outline"}
                      size={24}
                      color={selectedCategory.color || "#C9A961"}
                    />
                  </View>
                  <Text style={styles.categoryHeaderTitle}>
                    {selectedCategory.name
                      ? selectedCategory.name.charAt(0).toUpperCase() +
                        selectedCategory.name.slice(1)
                      : selectedCategory.name}
                  </Text>
                </View>
                <Text style={styles.productCount}>
                  {products.length}{" "}
                  {products.length === 1 ? "product" : "products"}
                </Text>
              </View>
            </View>
          )}

          {/* Products List */}
          {products.length > 0 ? (
            <View
              style={[
                styles.listContent,
                { paddingLeft: getPadding(), paddingRight: getPadding() },
              ]}
            >
              {products.map((item, index) => (
                <ProductList
                  key={item._id?.$oid || item.id || `product-${index}`}
                  item={item}
                  onProductPress={onProductPress}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubtext}>
                Try selecting a different category
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    width: "100%",
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
  },
  categoryHeader: {
    paddingTop: 120,
    paddingBottom: 30,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  categoryHeaderTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: 1,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  productCount: {
    fontSize: 14,
    fontWeight: "400",
    color: "#757575",
    letterSpacing: 0.5,
  },
  listContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingTop: 40,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 150,
    paddingBottom: 100,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#757575",
    marginTop: 20,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  emptySubtext: {
    fontSize: 16,
    fontWeight: "400",
    color: "#999",
    marginTop: 8,
  },
});

export default ProductContainer;
