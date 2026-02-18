import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProductContainer from "./Products/ProductContainer";
import SingleProduct from "./Products/SingleProduct";
import LandingPage from "./LandingPage";
import Collections from "./Collections";
import MadeForYou from "./MadeForYou";
import Header from "../Shared/Header";

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = {
  fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
};

export default function StoreLayout() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, getCart, profileNeedsCompletion } = useAuth();
  const cartCount = !isAdmin && user ? (getCart() || []).length : 0;
  // Admins should never see or use the cart in the public store
  const showCart = !!user && !profileNeedsCompletion && !isAdmin;
  const [scrollY, setScrollY] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProducts, setShowProducts] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [showMadeForYou, setShowMadeForYou] = useState(false);
  const [showSingleProduct, setShowSingleProduct] = useState(false);
  const [lastView, setLastView] = useState("home"); // 'home' | 'category' | 'collections' | 'madeForYou'

  useEffect(() => {
    if (user && !isAdmin && profileNeedsCompletion) {
      navigate("/complete-profile", { replace: true });
      return;
    }
  }, [user, isAdmin, profileNeedsCompletion, navigate]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const playfairLink = document.createElement("link");
      playfairLink.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500;600;700&display=swap";
      playfairLink.rel = "stylesheet";
      document.head.appendChild(playfairLink);
      const cinzelLink = document.createElement("link");
      cinzelLink.href =
        "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap";
      cinzelLink.rel = "stylesheet";
      document.head.appendChild(cinzelLink);
    }
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowProducts(true);
    setLastView("category");
    if (Platform.OS === "web" && typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNavigate = (route) => {
    if (route === "home") {
      setShowProducts(false);
      setShowCollections(false);
      setShowMadeForYou(false);
      setShowSingleProduct(false);
      setSelectedCategory(null);
      setSelectedProduct(null);
      setLastView("home");
      if (Platform.OS === "web" && typeof window !== "undefined" && window.scrollTo) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setShowSingleProduct(true);
    setShowProducts(false);
    if (Platform.OS === "web" && typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackFromProduct = () => {
    setShowSingleProduct(false);

    // Return to the view the user came from
    if (lastView === "category") {
      setShowProducts(true);
      setShowCollections(false);
      setShowMadeForYou(false);
    } else if (lastView === "collections") {
      setShowCollections(true);
      setShowProducts(false);
      setShowMadeForYou(false);
    } else if (lastView === "madeForYou") {
      setShowMadeForYou(true);
      setShowCollections(false);
      setShowProducts(false);
    } else {
      // default back to landing
      setShowProducts(false);
      setShowCollections(false);
      setShowMadeForYou(false);
    }

    if (Platform.OS === "web" && typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleShopCollections = () => {
    setShowCollections(true);
    setShowProducts(false);
    setShowMadeForYou(false);
    setLastView("collections");
    if (Platform.OS === "web" && typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleMadeForYou = () => {
    setShowMadeForYou(true);
    setShowCollections(false);
    setShowProducts(false);
    setLastView("madeForYou");
    if (Platform.OS === "web" && typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <View style={styles.container}>
      <Header
        scrollY={scrollY}
        onNavigate={handleNavigate}
        onProductPress={handleProductSelect}
        user={user}
        isAdmin={isAdmin}
        cartCount={cartCount}
        showCart={showCart}
        onSignOut={signOut}
        navigate={navigate}
      />
      {showSingleProduct ? (
        <SingleProduct
          product={selectedProduct}
          onBack={handleBackFromProduct}
          onNavigate={handleNavigate}
          onProductPress={handleProductSelect}
          navigate={navigate}
        />
      ) : showProducts ? (
        <ProductContainer
          onScroll={setScrollY}
          selectedCategory={selectedCategory}
          onProductPress={handleProductSelect}
        />
      ) : showCollections ? (
        <Collections
          onCategorySelect={handleCategorySelect}
          onNavigate={handleNavigate}
        />
      ) : showMadeForYou ? (
        <MadeForYou onNavigate={handleNavigate} />
      ) : (
        <LandingPage
          onCategorySelect={handleCategorySelect}
          onShopCollections={handleShopCollections}
          onMadeForYou={handleMadeForYou}
          onNavigate={handleNavigate}
          onProductPress={handleProductSelect}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
  },
});
