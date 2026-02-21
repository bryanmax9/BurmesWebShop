import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
} from "react-native";
import ProductCard from "../Products/ProductCard";
import { useAuth } from "../../contexts/AuthContext";

const MostPopularSection = ({ onProductPress }) => {
  const { getProducts } = useAuth();
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window")
  );
  const [popularProducts, setPopularProducts] = useState([]);

  const isSmallScreen = windowDimensions.width < 768;

  useEffect(() => {
    // Set up resize listener
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window);
    });

    // Load most popular products from Firestore
    (async () => {
      try {
        const all = await (getProducts?.() ?? Promise.resolve([]));
        const featured = (all || []).filter((p) => p.isFeatured);
        const source = featured.length ? featured : all;
        const randomized = [...source]
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
        setPopularProducts(randomized);
      } catch (e) {
        setPopularProducts([]);
      }
    })();

    return () => subscription?.remove();
  }, [getProducts]);

  const getContainerPadding = () => {
    if (windowDimensions.width < 600) return 20;
    if (windowDimensions.width < 1024) return 40;
    return 80;
  };

  return (
    <View
      style={[
        styles.section,
        {
          paddingHorizontal: getContainerPadding(),
          paddingTop: isSmallScreen ? 60 : 80,
          paddingBottom: isSmallScreen ? 60 : 100,
          backgroundColor: "#f5f5f5",
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionSubtitle,
            { fontSize: isSmallScreen ? 12 : 14 },
          ]}
        >
          NUESTRA TIENDA
        </Text>
        <Text
          style={[
            styles.sectionTitle,
            { fontSize: isSmallScreen ? 28 : 36 },
          ]}
        >
          Más populares
        </Text>
        <View style={styles.underline} />
      </View>

      <View style={styles.productsContainer}>
        {popularProducts.length > 0 ? (
          <View style={styles.productsGrid}>
            {popularProducts.map((item, index) => (
              <View
                key={item._id?.$oid || item.id || `popular-${index}`}
                style={[
                  styles.productCardWrapper,
                  {
                    width: isSmallScreen
                      ? "100%"
                      : windowDimensions.width < 1024
                      ? "48%"
                      : "23%",
                    marginBottom: isSmallScreen ? 20 : 0,
                  },
                ]}
              >
                <ProductCard
                  name={item.name}
                  image={item.image}
                  price={item.price}
                  countInStock={item.countInStock}
                  onPress={() => onProductPress && onProductPress(item)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay productos disponibles</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: "100%",
    paddingTop: 80,
    paddingBottom: 100,
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 50,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#1a1a1a",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: "sans-serif",
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 12,
    fontFamily: "sans-serif",
  },
  underline: {
    width: 100,
    height: 2,
    backgroundColor: "#1a1a1a",
    marginTop: 8,
  },
  productsContainer: {
    width: "100%",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  productCardWrapper: {
    marginBottom: 0,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
    fontFamily: "sans-serif",
  },
});

export default MostPopularSection;
