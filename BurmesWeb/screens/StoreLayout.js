import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProductContainer from "./Products/ProductContainer";
import SingleProduct from "./Products/SingleProduct";
import LandingPage from "./LandingPage";
import Collections from "./Collections";
import MadeForYou from "./MadeForYou";
import LibroReclamaciones from "./LibroReclamaciones";
import TerminosCondiciones from "./TerminosCondiciones";
import Header from "../Shared/Header";
import useSEO from "../hooks/useSEO";

const categoriesData = require("../assets/data/categories.json");
const categoryIcons = { pendants: "diamond-outline", chains: "link-outline", rings: "radio-button-on-outline", bracelets: "ellipse-outline", aretes: "sparkles-outline", relojes: "time-outline" };
const categoryColors = { pendants: "#C9A961", chains: "#2E7D32", rings: "#E8B4B8", bracelets: "#4A90E2", aretes: "#C9A961", relojes: "#7B6B5A" };

const getId = (x) => x?._id?.$oid || x?._id || x?.id;

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = {
  fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
};

export default function StoreLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId, productId, filterKey } = useParams();
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

  const DISCOVER_FILTERS = {
    oro:              { label: "Colección Oro",        filterFn: (p) => p.material === "oro" },
    plata:            { label: "Colección Plata",      filterFn: (p) => p.material === "plata" },
    hombre:           { label: "Para Hombres",         filterFn: (p) => Array.isArray(p.gender) ? p.gender.includes("hombre")      : p.gender === "hombre" },
    mujer:            { label: "Para Mujeres",         filterFn: (p) => Array.isArray(p.gender) ? p.gender.includes("mujer")       : p.gender === "mujer" },
    unisex:           { label: "Unisex",               filterFn: (p) => Array.isArray(p.gender) ? p.gender.includes("unisex")      : p.gender === "unisex" },
    novios:           { label: "Para Novios",          filterFn: (p) => p.isNovios === true },
    ninos:            { label: "Niños y Bebés",        filterFn: (p) => Array.isArray(p.gender) ? p.gender.includes("ninos_bebes") : p.gender === "ninos_bebes" },
    gemas_diamantes:  { label: "Diamantes",            filterFn: (p) => p.gemType === "diamantes" },
    gemas_color:      { label: "Gemas de Color",       filterFn: (p) => p.gemType === "gemas_color" },
    gemas_nacimiento: { label: "Gemas de Nacimiento",  filterFn: (p) => p.gemType === "gemas_nacimiento" },
    zodiac:           { label: "Signos Zodiacales",    filterFn: (p) => p.isZodiac === true },
    letras:           { label: "Colección de Letras",  filterFn: (p) => p.isLetterCollection === true },
  };

  const showDiscover = pathname.startsWith("/coleccion/") && !!filterKey && !!DISCOVER_FILTERS[filterKey];

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
    } else if (route === "libro-reclamaciones") {
      navigate("/libro-reclamaciones", { replace: false });
      scrollTop();
    } else if (route === "terms") {
      navigate("/terminos-condiciones", { replace: false });
      scrollTop();
    } else if (route === "jewellery" || route === "engagement" || route === "watches") {
      if (route === "engagement") {
        const ringsCat = categories.find((c) => c.name === "rings");
        if (ringsCat) navigate(`/category/${getId(ringsCat)}`, { replace: false, state: { filterNovios: true } });
        else navigate("/collections", { replace: false });
      } else if (route === "gemas") {
        const gemasCat = categories.find((c) => c.name === "gemas");
        if (gemasCat) navigate(`/category/${getId(gemasCat)}`, { replace: false });
        else navigate("/collections", { replace: false });
      } else {
        const cat = categories.find((c) => route === "jewellery" ? c.name === "pendants" : c.name === "relojes");
        if (cat) navigate(`/category/${getId(cat)}`, { replace: false });
        else navigate("/collections", { replace: false });
      }
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
  const showLibroReclamaciones  = pathname === "/libro-reclamaciones";
  const showTerminos            = pathname === "/terminos-condiciones";
  const currentProduct = productFromState ?? resolvedProduct;

  const seoTitle = useMemo(() => {
    if (showSingleProduct && currentProduct) return currentProduct.name;
    if (showProducts && selectedCategory) return selectedCategory.name;
    if (showCollections) return "Collections";
    if (showMadeForYou) return "Personalizado";
    return "Inicio";
  }, [showSingleProduct, currentProduct, showProducts, selectedCategory, showCollections, showMadeForYou]);

  const seoDescription = useMemo(() => {
    if (showSingleProduct && currentProduct) return currentProduct.description;
    if (showProducts && selectedCategory) return `Descubre nuestra colección de ${selectedCategory.name}.`;
    return "Burmes & Co. | Joyería fina, relojes y accesorios de lujo.";
  }, [showSingleProduct, currentProduct, showProducts, selectedCategory]);

  useSEO({
    title: seoTitle,
    description: seoDescription,
    ogImage: showSingleProduct && currentProduct ? currentProduct.image : undefined,
  });

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
      ) : showDiscover ? (
        <ProductContainer
          onScroll={setScrollY}
          selectedCategory={null}
          onProductPress={handleProductSelect}
          discoverFilter={{ key: filterKey, ...DISCOVER_FILTERS[filterKey] }}
        />
      ) : showProducts ? (
        <ProductContainer
          onScroll={setScrollY}
          selectedCategory={selectedCategory}
          onProductPress={handleProductSelect}
          filterNovios={location.state?.filterNovios === true}
          genderFilter={location.state?.genderFilter || null}
        />
      ) : showCollections ? (
        <Collections
          onCategorySelect={handleCategorySelect}
          onNavigate={handleNavigate}
        />
      ) : showMadeForYou ? (
        <MadeForYou onNavigate={handleNavigate} />
      ) : showTerminos ? (
        <TerminosCondiciones onNavigate={handleNavigate} />
      ) : showLibroReclamaciones ? (
        <LibroReclamaciones onNavigate={handleNavigate} />
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
