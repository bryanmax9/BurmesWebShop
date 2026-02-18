import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Footer = ({ onNavigate }) => {
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window")
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const isSmallScreen = windowDimensions.width < 768;
  const isMobile = windowDimensions.width < 600;

  const getContainerPadding = () => {
    if (windowDimensions.width < 600) return 20;
    if (windowDimensions.width < 1024) return 40;
    return 80;
  };

  const handleLinkPress = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }
  };

  const handleNavigation = (route) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  const footerLinks = {
    shop: [
      { label: "Jewellery", route: "jewellery" },
      { label: "Engagement Rings", route: "engagement" },
      { label: "Watches", route: "watches" },
      { label: "Collections", route: "collections" },
    ],
    about: [
      { label: "About Us", route: "about" },
      { label: "Made for You", route: "made-for-you" },
      { label: "Contact", route: "contact" },
      { label: "Shipping & Returns", route: "shipping" },
    ],
    customer: [
      { label: "My Account", route: "account" },
      { label: "Order Tracking", route: "tracking" },
      { label: "Size Guide", route: "size-guide" },
      { label: "FAQ", route: "faq" },
    ],
  };

  const socialLinks = [
    {
      name: "instagram",
      url: "https://www.instagram.com",
      icon: "logo-instagram",
    },
    {
      name: "facebook",
      url: "https://www.facebook.com",
      icon: "logo-facebook",
    },
    {
      name: "twitter",
      url: "https://www.twitter.com",
      icon: "logo-twitter",
    },
    {
      name: "pinterest",
      url: "https://www.pinterest.com",
      icon: "logo-pinterest",
    },
  ];

  return (
    <View
      style={[
        styles.footer,
        {
          paddingHorizontal: getContainerPadding(),
          paddingTop: isSmallScreen ? 60 : 80,
          paddingBottom: isSmallScreen ? 40 : 60,
        },
      ]}
    >
      {/* Main Footer Content */}
      <View style={styles.footerContent}>
        {/* Brand Section */}
        <View
          style={[
            styles.footerSection,
            {
              width: isMobile ? "100%" : isSmallScreen ? "50%" : "25%",
              marginBottom: isMobile ? 32 : 0,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => handleNavigation("home")}
            activeOpacity={0.7}
          >
            <Text style={styles.brandName}>BURMES & CO.</Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.brandDescription,
              {
                fontSize: isSmallScreen ? 13 : 14,
                marginTop: isSmallScreen ? 12 : 16,
                lineHeight: isSmallScreen ? 20 : 22,
              },
            ]}
          >
            Handcrafted jewellery from our studio in Peru. Created with
            precision, shipped worldwide.
          </Text>
        </View>

        {/* Shop Links */}
        <View
          style={[
            styles.footerSection,
            {
              width: isMobile ? "100%" : isSmallScreen ? "50%" : "18%",
              marginBottom: isMobile ? 32 : 0,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isSmallScreen ? 13 : 14,
                marginBottom: isSmallScreen ? 16 : 20,
              },
            ]}
          >
            SHOP
          </Text>
          {footerLinks.shop.map((link, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleNavigation(link.route)}
              style={styles.linkItem}
            >
              <Text
                style={[
                  styles.linkText,
                  {
                    fontSize: isSmallScreen ? 13 : 14,
                    marginBottom: isSmallScreen ? 10 : 12,
                  },
                ]}
              >
                {link.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* About Links */}
        <View
          style={[
            styles.footerSection,
            {
              width: isMobile ? "100%" : isSmallScreen ? "50%" : "18%",
              marginBottom: isMobile ? 32 : 0,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isSmallScreen ? 13 : 14,
                marginBottom: isSmallScreen ? 16 : 20,
              },
            ]}
          >
            ABOUT
          </Text>
          {footerLinks.about.map((link, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleNavigation(link.route)}
              style={styles.linkItem}
            >
              <Text
                style={[
                  styles.linkText,
                  {
                    fontSize: isSmallScreen ? 13 : 14,
                    marginBottom: isSmallScreen ? 10 : 12,
                  },
                ]}
              >
                {link.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Customer Service Links */}
        <View
          style={[
            styles.footerSection,
            {
              width: isMobile ? "100%" : isSmallScreen ? "50%" : "18%",
              marginBottom: isMobile ? 32 : 0,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isSmallScreen ? 13 : 14,
                marginBottom: isSmallScreen ? 16 : 20,
              },
            ]}
          >
            CUSTOMER SERVICE
          </Text>
          {footerLinks.customer.map((link, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleNavigation(link.route)}
              style={styles.linkItem}
            >
              <Text
                style={[
                  styles.linkText,
                  {
                    fontSize: isSmallScreen ? 13 : 14,
                    marginBottom: isSmallScreen ? 10 : 12,
                  },
                ]}
              >
                {link.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact & Social Section */}
        <View
          style={[
            styles.footerSection,
            {
              width: isMobile ? "100%" : isSmallScreen ? "50%" : "21%",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isSmallScreen ? 13 : 14,
                marginBottom: isSmallScreen ? 16 : 20,
              },
            ]}
          >
            CONTACT
          </Text>
          <Text
            style={[
              styles.contactText,
              {
                fontSize: isSmallScreen ? 13 : 14,
                marginBottom: isSmallScreen ? 8 : 10,
                lineHeight: isSmallScreen ? 20 : 22,
              },
            ]}
          >
            Email:{"\n"}info@burmes.com
          </Text>
          <Text
            style={[
              styles.contactText,
              {
                fontSize: isSmallScreen ? 13 : 14,
                marginBottom: isSmallScreen ? 20 : 24,
                lineHeight: isSmallScreen ? 20 : 22,
              },
            ]}
          >
            Phone:{"\n"}+1 (555) 123-4567
          </Text>

          {/* Social Media Icons */}
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: isSmallScreen ? 13 : 14,
                marginBottom: isSmallScreen ? 16 : 20,
                marginTop: isSmallScreen ? 0 : 8,
              },
            ]}
          >
            FOLLOW US
          </Text>
          <View style={styles.socialContainer}>
            {socialLinks.map((social, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleLinkPress(social.url)}
                style={styles.socialIcon}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={social.icon}
                  size={isSmallScreen ? 20 : 22}
                  color="#ffffff"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Section - Copyright & Legal */}
      <View
        style={[
          styles.bottomSection,
          {
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: isMobile ? "flex-start" : "space-between",
          },
        ]}
      >
        <Text
          style={[
            styles.copyrightText,
            {
              fontSize: isSmallScreen ? 11 : 12,
              marginBottom: isMobile ? 16 : 0,
            },
          ]}
        >
          © {new Date().getFullYear()} Burmes & Co. All rights reserved.
        </Text>
        <View
          style={[
            styles.legalLinks,
            {
              flexDirection: isMobile ? "column" : "row",
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => handleNavigation("privacy")}
            style={styles.legalLink}
          >
            <Text
              style={[
                styles.legalLinkText,
                {
                  fontSize: isSmallScreen ? 11 : 12,
                  marginRight: isMobile ? 0 : 24,
                  marginBottom: isMobile ? 8 : 0,
                },
              ]}
            >
              Privacy Policy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleNavigation("terms")}
            style={styles.legalLink}
          >
            <Text
              style={[
                styles.legalLinkText,
                {
                  fontSize: isSmallScreen ? 11 : 12,
                  marginRight: isMobile ? 0 : 24,
                  marginBottom: isMobile ? 8 : 0,
                },
              ]}
            >
              Terms of Service
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleNavigation("cookies")}
            style={styles.legalLink}
          >
            <Text
              style={[
                styles.legalLinkText,
                {
                  fontSize: isSmallScreen ? 11 : 12,
                },
              ]}
            >
              Cookie Policy
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    alignSelf: "stretch",
  },
  footerContent: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  footerSection: {
    marginBottom: 0,
  },
  brandName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 2,
    fontFamily: "'Cinzel', Georgia, serif",
  },
  brandDescription: {
    fontWeight: "400",
    color: "#cccccc",
    fontFamily: "sans-serif",
  },
  sectionTitle: {
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
  linkItem: {
    marginBottom: 0,
  },
  linkText: {
    fontWeight: "400",
    color: "#cccccc",
    fontFamily: "sans-serif",
  },
  contactText: {
    fontWeight: "400",
    color: "#cccccc",
    fontFamily: "sans-serif",
  },
  socialContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  socialIcon: {
    padding: 4,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#333333",
    marginTop: 40,
    marginBottom: 32,
  },
  bottomSection: {
    width: "100%",
  },
  copyrightText: {
    fontWeight: "400",
    color: "#999999",
    fontFamily: "sans-serif",
  },
  legalLinks: {
    alignItems: "flex-start",
  },
  legalLink: {
    marginBottom: 0,
  },
  legalLinkText: {
    fontWeight: "400",
    color: "#cccccc",
    fontFamily: "sans-serif",
    textDecorationLine: "underline",
  },
});

export default Footer;
