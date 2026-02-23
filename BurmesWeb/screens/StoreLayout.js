import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProductContainer from "./Products/ProductContainer";
import SingleProduct from "./Products/SingleProduct";
import LandingPage from "./LandingPage";
import Collections from "./Collections";
import MadeForYou from "./MadeForYou";
import Header from "../Shared/Header";

const categoriesData = require("../assets/data/categories.json");
const categoryIcons = { pendants: "diamond-outline", chains: "link-outline", rings: "radio-button-on-outline", bracelets: "ellipse-outline" };
const categoryColors = { pendants: "#C9A961", chains: "#2E7D32", rings: "#E8B4B8", bracelets: "#4A90E2" };

const getId = (x) => x?._id?.$oid || x?._id || x?.id;

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = {
  fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
};

export default function StoreLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId, productId } = useParams();
  const { user, isAdmin, signOut, getCart, profileNeedsCompletion, getProducts } = useAuth();
  const cartCount = !isAdmin && user ? (getCart() || []).length : 0;
  const showCart = !!user && !profileNeedsCompletion && !isAdmin;
  const [scrollY, setScrollY] = useState(0);
  const [resolvedProduct, setResolvedProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(false);

  const pathname = location.pathname || "/";
  const productFromState = location.state?.product;

  const categories = useMemo(() => {
    return (categoriesData || []).map((cat) => ({
      ...cat,
      _id: cat._id?.$oid || cat._id,
      icon: categoryIcons[cat.name?.toLowerCase()] || "diamond-outline",
      color: categoryColors[cat.name?.toLowerCase()] || "#C9A961",
    }));
  }, []);

  const selectedCategory = useMemo(() => {
    if (!categoryId || !categories.length) return null;
    return categories.find((c) => getId(c) === categoryId) || null;
  }, [categoryId, categories]);

  useEffect(() => {
    if (user && !isAdmin && profileNeedsCompletion) {
      navigate("/complete-profile", { replace: true });
      return;
    }
  }, [user, isAdmin, profileNeedsCompletion, navigate]);

  useEffect(() => {
    if (productId && !productFromState && getProducts) {
      setProductLoading(true);
      getProducts(null)
        .then((list) => {
          const product = (list || []).find((p) => getId(p) === productId) || null;
          setResolvedProduct(product);
        })
        .catch(() => setResolvedProduct(null))
        .finally(() => setProductLoading(false));
    } else {
      setResolvedProduct(productFromState || null);
    }
  }, [productId, productFromState, getProducts]);

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

  const scrollTop = () => {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCategorySelect = (category) => {
    const id = getId(category);
    if (id) navigate(`/category/${id}`, { replace: false });
    scrollTop();
  };

  const handleNavigate = (route) => {
    if (route === "home") {
      navigate("/", { replace: false });
      scrollTop();
    } else if (route === "collections") {
      navigate("/collections", { replace: false });
      scrollTop();
    } else if (route === "made-for-you") {
      navigate("/made-for-you", { replace: false });
      scrollTop();
    } else if (route === "jewellery" || route === "engagement" || route === "watches") {
      const cat = categories.find((c) => c.name === route.replace("-", "") || (route === "jewellery" && c.name === "pendants"));
      if (cat) navigate(`/category/${getId(cat)}`, { replace: false });
      else navigate("/collections", { replace: false });
      scrollTop();
    }
  };

  const handleProductSelect = (product) => {
    const id = getId(product);
    if (id) navigate(`/product/${id}`, { state: { product }, replace: false });
    scrollTop();
  };

  const handleBackFromProduct = () => {
    navigate(-1);
    scrollTop();
  };

  const handleShopCollections = () => {
    navigate("/collections", { replace: false });
    scrollTop();
  };

  const handleMadeForYou = () => {
    navigate("/made-for-you", { replace: false });
    scrollTop();
  };

  const showSingleProduct = pathname.startsWith("/product/") && productId != null;
  const showProducts = pathname.startsWith("/category/") && selectedCategory != null;
  const showCollections = pathname === "/collections";
  const showMadeForYou = pathname === "/made-for-you";
  const currentProduct = productFromState ?? resolvedProduct;

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
        productLoading ? (
          <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ fontFamily: "'Playfair Display', serif" }}>Cargando...</Text>
          </View>
        ) : currentProduct ? (
          <SingleProduct
            product={currentProduct}
            onBack={handleBackFromProduct}
            onNavigate={handleNavigate}
            onProductPress={handleProductSelect}
            navigate={navigate}
          />
        ) : (
          <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ fontFamily: "'Playfair Display', serif" }}>Producto no encontrado.</Text>
            <Text onPress={() => navigate("/")} style={{ marginTop: 8, textDecorationLine: "underline" }}>Volver al inicio</Text>
          </View>
        )
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
