import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Text } from "react-native";
import HeroSection from "./LandingPage/HeroSection";
import CategoriesSection from "./LandingPage/CategoriesSection";
import MostPopularSection from "./LandingPage/MostPopularSection";
import DiscoverMoreSection from "./LandingPage/DiscoverMoreSection";
import FromBurmesSection from "./LandingPage/FromBurmesSection";
import CollageSection from "./LandingPage/CollageSection";
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

const LandingPage = ({ onCategorySelect, onShopCollections, onMadeForYou, onNavigate, onProductPress }) => {
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
      <HeroSection onShopCollections={onShopCollections} />
      <CategoriesSection
        categories={categories}
        onCategorySelect={handleCategoryPress}
      />
      <MostPopularSection onProductPress={onProductPress} />
      <DiscoverMoreSection onDiscoverMore={onMadeForYou} />
      <FromBurmesSection onShopNew={onShopCollections} />
      
      {/* Visible SEO Content / Brand Story */}
      <View style={styles.aboutSection}>
        <View style={styles.aboutContent}>
          <View style={styles.aboutHeader}>
            <View style={styles.line} />
            <View style={styles.dot} />
            <View style={styles.line} />
          </View>
          
          <View style={styles.aboutTitleContainer}>
            <Text 
              style={styles.aboutTitle}
              accessibilityRole="header"
              aria-level={2}
            >
              Nuestra Herencia
            </Text>
            <View style={styles.titleUnderline} />
          </View>
          
          <View style={styles.seoTextContainer}>
            <Text style={styles.aboutDescription}>
              Bienvenido a <Text style={styles.goldText}>Burmes & Co.</Text>, donde la elegancia y la tradición artesanal se encuentran. 
              Como la <Text style={styles.boldText}>mejor joyería en Perú</Text>, nos dedicamos a crear piezas que trascienden el tiempo. 
              Nuestra especialidad son los <Text style={styles.boldText}>anillos de compromiso</Text> y las <Text style={styles.boldText}>joyas de oro de 18k</Text>, 
              cada una diseñada con una atención meticulosa al detalle y diamantes de la más alta calidad.
            </Text>

            <View style={styles.aboutPara}>
              <Text 
                style={styles.paraTitle}
                accessibilityRole="header"
                aria-level={3}
              >
                Artesanía "Hecho en Casa"
              </Text>
              <Text style={styles.paraContent}>
                En nuestro taller exclusivo, nuestros maestros joyeros transforman metales preciosos en obras de arte. 
                Desde <Text style={styles.boldText}>dijes personalizados</Text> hasta <Text style={styles.boldText}>cadenas de oro</Text> tejidas a mano, 
                cada creación de <Text style={styles.goldText}>Burmes joyas</Text> es un reflejo de la sofisticación peruana.
              </Text>
            </View>

            <View style={styles.aboutPara}>
              <Text 
                style={styles.paraTitle}
                accessibilityRole="header"
                aria-level={3}
              >
                Relojes de Lujo y Alta Gama
              </Text>
              <Text style={styles.paraContent}>
                Más que una joyería, somos curadores de la excelencia. Nuestra colección de <Text style={styles.boldText}>relojes de lujo</Text> 
                representa lo mejor de la relojería mundial, ofreciendo precisión y estilo para aquellos que aprecian lo extraordinario en <Text style={styles.boldText}>Lima</Text> y todo el país.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <CollageSection />
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
  aboutSection: {
    paddingVertical: 80,
    backgroundColor: "#fcfcfc",
    alignItems: "center",
  },
  aboutContent: {
    maxWidth: 800,
    width: "90%",
    alignItems: "center",
  },
  aboutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  line: {
    height: 1,
    width: 60,
    backgroundColor: "#C9A961",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C9A961",
    marginHorizontal: 15,
  },
  aboutTitleContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  aboutTitle: {
    fontSize: 32,
    fontFamily: "'Playfair Display', Georgia, serif",
    color: "#1a1a1a",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  titleUnderline: {
    height: 2,
    width: 40,
    backgroundColor: "#C9A961",
    marginTop: 15,
  },
  seoTextContainer: {
    width: "100%",
  },
  aboutDescription: {
    fontSize: 18,
    color: "#4a4a4a",
    lineHeight: 32,
    textAlign: "center",
    marginBottom: 40,
    fontFamily: "serif",
  },
  aboutPara: {
    marginBottom: 35,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(201, 169, 97, 0.3)",
    paddingLeft: 25,
  },
  paraTitle: {
    fontSize: 20,
    color: "#1a1a1a",
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  paraContent: {
    fontSize: 16,
    color: "#666",
    lineHeight: 26,
  },
  goldText: {
    color: "#C9A961",
    fontWeight: "700",
  },
  boldText: {
    fontWeight: "600",
    color: "#333",
  },
});

export default LandingPage;
