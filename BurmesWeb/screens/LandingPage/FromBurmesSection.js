import React, { useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from "react-native";

const FromBurmesSection = ({ onShopNew }) => {
  const windowDimensions = Dimensions.get("window");
  const isSmallScreen = windowDimensions.width < 768;
  const isMobile = windowDimensions.width < 600;
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCorner, setHoveredCorner] = useState(null);

  // Animated values for the 4 images (entrance animation)
  const topLeftAnim = useRef(new Animated.Value(0)).current;
  const topRightAnim = useRef(new Animated.Value(0)).current;
  const bottomLeftAnim = useRef(new Animated.Value(0)).current;
  const bottomRightAnim = useRef(new Animated.Value(0)).current;

  // Hover lift + scale (web): subtle lift and scale on hover
  const hoverTL = useRef(new Animated.Value(0)).current;
  const hoverTR = useRef(new Animated.Value(0)).current;
  const hoverBL = useRef(new Animated.Value(0)).current;
  const hoverBR = useRef(new Animated.Value(0)).current;

  const hoverEasing = Easing.out(Easing.cubic);
  const hoverConfig = {
    duration: 520,
    useNativeDriver: true,
    easing: hoverEasing,
  };
  const hoverIn = (corner) => {
    setHoveredCorner(corner);
    const val = corner === "tl" ? hoverTL : corner === "tr" ? hoverTR : corner === "bl" ? hoverBL : hoverBR;
    Animated.timing(val, { ...hoverConfig, toValue: 1 }).start();
  };
  const hoverOut = (corner) => {
    setHoveredCorner(null);
    const val = corner === "tl" ? hoverTL : corner === "tr" ? hoverTR : corner === "bl" ? hoverBL : hoverBR;
    Animated.timing(val, { ...hoverConfig, toValue: 0 }).start();
  };

  useEffect(() => {
    // Check if section is visible using Intersection Observer (web) or onLayout (native)
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.IntersectionObserver
    ) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isVisible) {
              setIsVisible(true);
              animateImages();
            }
          });
        },
        { threshold: 0.3 },
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => {
        if (sectionRef.current) {
          observer.unobserve(sectionRef.current);
        }
      };
    } else {
      // For native, trigger animation after a delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        animateImages();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const animateImages = () => {
    // Animate all 4 images to their final positions - slow animation
    Animated.parallel([
      Animated.timing(topLeftAnim, {
        toValue: 1,
        useNativeDriver: true,
        duration: 1500,
      }),
      Animated.timing(topRightAnim, {
        toValue: 1,
        useNativeDriver: true,
        duration: 1500,
        delay: 150,
      }),
      Animated.timing(bottomLeftAnim, {
        toValue: 1,
        useNativeDriver: true,
        duration: 1500,
        delay: 300,
      }),
      Animated.timing(bottomRightAnim, {
        toValue: 1,
        useNativeDriver: true,
        duration: 1500,
        delay: 450,
      }),
    ]).start();
  };

  const getContainerPadding = () => {
    if (windowDimensions.width < 600) return 20;
    if (windowDimensions.width < 1024) return 40;
    return 80;
  };

  const images = [
    require("../../assets/FromBurmes1.jpeg"),
    require("../../assets/FromBurmes2.jpeg"),
    require("../../assets/FromBurmes3.jpeg"),
    require("../../assets/FromBurmes4.jpeg"),
    require("../../assets/FromBurmes5.jpeg"),
  ];

  // Calculate positions
  const padding = getContainerPadding();
  const centerImageSize = 380;
  const centerImageTop = 30; // moved up from 100 so center image sits higher
  const smallImageSize = 180;
  const containerHeight = 600;
  const centerImageOffsetLeft = 150; // shift center image left (px) so it's not too far right

  // Calculate container width for images (55% of screen minus padding)
  const containerWidth = (windowDimensions.width - padding * 2) * 0.55;
  const centerX = containerWidth / 2; // Horizontal center of images container

  // Initial position: ALL images start centered below the main image
  // Center image: top: 100, size: 380, so it ends at 480px
  // Small images start 20px below the center image
  const initialTop = centerImageTop + centerImageSize + 20; // 100 + 380 + 20 = 500px from top of container

  // Final positions (absolute pixel values)
  const finalTopLeft = { top: 0, left: 20 };
  const finalTopRight = { top: 40, left: containerWidth - smallImageSize - 20 };
  const finalBottomLeft = {
    top: containerHeight - smallImageSize - 40,
    left: 20,
  };
  const finalBottomRight = {
    top: containerHeight - smallImageSize,
    left: containerWidth - smallImageSize - 20,
  };

  // Calculate translate values from initial (centered at 50%) to final positions
  // Initial horizontal position is at centerX (50% of container)
  const finalPositions = {
    topLeft: {
      x: finalTopLeft.left - centerX, // Move left from center
      y: finalTopLeft.top - initialTop, // Move up from initial position
    },
    topRight: {
      x: finalTopRight.left - centerX, // Move right from center
      y: finalTopRight.top - initialTop, // Move up from initial position
    },
    bottomLeft: {
      x: finalBottomLeft.left - centerX, // Move left from center
      y: finalBottomLeft.top - initialTop, // Move down to bottom position
    },
    bottomRight: {
      x: finalBottomRight.left - centerX, // Move right from center
      y: finalBottomRight.top - initialTop, // Move down to bottom position
    },
  };

  // Interpolate translateX and translateY
  const topLeftX = topLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, finalPositions.topLeft.x],
  });
  const topLeftY = topLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, finalPositions.topLeft.y],
  });

  const topRightX = topRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, finalPositions.topRight.x],
  });
  const topRightY = topRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, finalPositions.topRight.y],
  });

  const bottomLeftX = bottomLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, finalPositions.bottomLeft.x],
  });
  const bottomLeftY = bottomLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, finalPositions.bottomLeft.y],
  });

  const bottomRightX = bottomRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, finalPositions.bottomRight.x],
  });
  const bottomRightY = bottomRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, finalPositions.bottomRight.y],
  });

  // Hover: subtle lift (translateY) and scale for web
  const hoverLiftY = (v) => v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const hoverScale = (v) => v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  const isWeb = Platform.OS === "web";
  const mouseProps = (corner) =>
    isWeb
      ? {
          onMouseEnter: () => hoverIn(corner),
          onMouseLeave: () => hoverOut(corner),
        }
      : {};

  return (
    <View
      ref={sectionRef}
      style={[
        styles.section,
        {
          paddingHorizontal: getContainerPadding(),
          paddingTop: isSmallScreen ? 60 : 80,
          paddingBottom: isSmallScreen ? 60 : 100,
          backgroundColor: "#f8f8f8",
        },
      ]}
    >
      <View
        style={[
          styles.contentContainer,
          {
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "center" : "flex-start",
          },
        ]}
      >
        {/* Left Side - Images Gallery */}
        <View
          style={[
            styles.imagesContainer,
            {
              width: isMobile ? "100%" : "55%",
              marginBottom: isMobile ? 32 : 0,
              marginRight: isMobile ? 0 : 40,
              minHeight: isMobile ? undefined : 600,
            },
          ]}
        >
          {/* Desktop: Main center image + 4 small animated images */}
          {!isMobile && (
            <View
              style={[
                styles.mainImageContainer,
                {
                  top: centerImageTop,
                  marginLeft: -190 - centerImageOffsetLeft,
                  zIndex: 3,
                },
              ]}
            >
              <View style={styles.imagePanel}>
                <Image
                  source={images[1]}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          )}

          {/* Small screens: only the middle/center image, centered */}
          {isMobile && (
            <View style={styles.mobileCenterImageWrapper}>
              <View style={styles.mobileCenterImagePanel}>
                <Image
                  source={images[1]}
                  style={styles.mobileCenterImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          )}

          {/* Top Left - on top of center; hover lift + scale */}
          {!isMobile && (
            <Animated.View
              {...mouseProps("tl")}
              style={[
                {
                  position: "absolute",
                  top: initialTop,
                  left: centerX - 20,
                  zIndex: hoveredCorner === "tl" ? 10 : 4,
                  transform: [
                    { translateX: topLeftX },
                    { translateY: topLeftY },
                    { translateY: hoverLiftY(hoverTL) },
                    { scale: hoverScale(hoverTL) },
                  ],
                },
              ]}
            >
              <View style={styles.smallImagePanel}>
                <Image
                  source={images[0]}
                  style={styles.smallImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>
          )}

          {/* Top Right - behind center; hover lift + scale */}
          {!isMobile && (
            <Animated.View
              {...mouseProps("tr")}
              style={[
                {
                  position: "absolute",
                  top: initialTop,
                  left: centerX - 90,
                  zIndex: hoveredCorner === "tr" ? 10 : 2,
                  transform: [
                    { translateX: topRightX },
                    { translateY: topRightY },
                    { translateY: hoverLiftY(hoverTR) },
                    { scale: hoverScale(hoverTR) },
                  ],
                },
              ]}
            >
              <View style={styles.smallImagePanel}>
                <Image
                  source={images[2]}
                  style={styles.smallImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>
          )}

          {/* Bottom Left - behind center; hover lift + scale */}
          {!isMobile && (
            <Animated.View
              {...mouseProps("bl")}
              style={[
                {
                  position: "absolute",
                  top: initialTop,
                  left: centerX - 90,
                  zIndex: hoveredCorner === "bl" ? 10 : 2,
                  transform: [
                    { translateX: bottomLeftX },
                    { translateY: bottomLeftY },
                    { translateY: hoverLiftY(hoverBL) },
                    { scale: hoverScale(hoverBL) },
                  ],
                },
              ]}
            >
              <View style={styles.smallImagePanel}>
                <Image
                  source={images[3]}
                  style={styles.smallImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>
          )}

          {/* Bottom Right - on top of center; hover lift + scale */}
          {!isMobile && (
            <Animated.View
              {...mouseProps("br")}
              style={[
                {
                  position: "absolute",
                  top: initialTop,
                  left: centerX - 90,
                  zIndex: hoveredCorner === "br" ? 10 : 4,
                  transform: [
                    { translateX: bottomRightX },
                    { translateY: bottomRightY },
                    { translateY: hoverLiftY(hoverBR) },
                    { scale: hoverScale(hoverBR) },
                  ],
                },
              ]}
            >
              <View style={styles.smallImagePanel}>
                <Image
                  source={images[4]}
                  style={styles.smallImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>
          )}

        </View>

        {/* Right Side - Text Content */}
        <View
          style={[
            styles.textContainer,
            {
              width: isMobile ? "100%" : "45%",
              alignItems: isMobile ? "center" : "flex-start",
            },
          ]}
        >
          <Text
            style={[
              styles.brandNewText,
              {
                fontSize: isSmallScreen ? 12 : 14,
                marginBottom: isSmallScreen ? 8 : 12,
              },
            ]}
          >
            Brand new
          </Text>
          <Text
            style={[
              styles.fromBurmesTitle,
              {
                fontSize: isSmallScreen ? 32 : 48,
                marginBottom: isSmallScreen ? 20 : 28,
                lineHeight: isSmallScreen ? 38 : 56,
              },
            ]}
          >
            From Burmes
          </Text>
          <Text
            style={[
              styles.descriptionText,
              {
                fontSize: isSmallScreen ? 15 : 17,
                lineHeight: isSmallScreen ? 22 : 26,
                marginBottom: isSmallScreen ? 28 : 36,
                textAlign: isMobile ? "center" : "left",
              },
            ]}
          >
            Shop the latest jewellery by Burmes Jewelry. Created by hand from
            our studio. Ready to ship worldwide.
          </Text>
          <TouchableOpacity
            style={[
              styles.shopButton,
              {
                paddingVertical: isSmallScreen ? 14 : 16,
                paddingHorizontal: isSmallScreen ? 32 : 48,
              },
            ]}
            onPress={() => onShopNew && onShopNew()}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.shopButtonText,
                {
                  fontSize: isSmallScreen ? 13 : 14,
                  letterSpacing: isSmallScreen ? 1.5 : 2,
                },
              ]}
            >
              Shop NEW
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: "100%",
    backgroundColor: "#f8f8f8",
  },
  contentContainer: {
    width: "100%",
    justifyContent: "space-between",
  },
  imagesContainer: {
    position: "relative",
    width: "100%",
  },
  mobileCenterImageWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  mobileCenterImagePanel: {
    width: "85%",
    maxWidth: 340,
    aspectRatio: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: "hidden",
  },
  mobileCenterImage: {
    width: "100%",
    height: "100%",
    borderRadius: 11,
  },
  mainImageContainer: {
    position: "absolute",
    left: "50%",
    zIndex: 3,
    width: 380,
  },
  imagePanel: {
    width: 540,
    height: 540,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: "hidden",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    borderRadius: 11,
  },
  smallImagePanel: {
    width: 180,
    height: 180,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: "hidden",
  },
  smallImage: {
    width: "100%",
    height: "100%",
    borderRadius: 9,
  },
  mobileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  mobileImageContainer: {
    width: "48%",
    aspectRatio: 1,
    backgroundColor: "#ffffff",
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  mobileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 9,
  },
  textContainer: {
    justifyContent: "center",
  },
  brandNewText: {
    fontWeight: "400",
    color: "#1a1a1a",
    fontFamily: "sans-serif",
  },
  fromBurmesTitle: {
    fontWeight: "700",
    color: "#1a1a1a",
    fontFamily: "sans-serif",
  },
  descriptionText: {
    fontWeight: "400",
    color: "#1a1a1a",
    fontFamily: "sans-serif",
  },
  shopButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
  },
  shopButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
});

export default FromBurmesSection;
