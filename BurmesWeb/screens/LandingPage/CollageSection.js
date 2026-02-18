import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  Animated,
} from "react-native";

const CollageSection = () => {
  const windowDimensions = Dimensions.get("window");
  const isSmallScreen = windowDimensions.width < 768;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const fadeAnim1 = useRef(new Animated.Value(1)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;

  const images = [
    require("../../assets/Collage1.png"),
    require("../../assets/Collage2.png"),
  ];

  useEffect(() => {
    // Change image every 5 seconds with crossfade animation
    const interval = setInterval(() => {
      const newIndex = (currentImageIndex + 1) % images.length;
      setNextImageIndex(newIndex);
      
      // Crossfade: fade out current, fade in next simultaneously
      Animated.parallel([
        Animated.timing(fadeAnim1, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Swap the images and reset animations
        setCurrentImageIndex(newIndex);
        fadeAnim1.setValue(1);
        fadeAnim2.setValue(0);
      });
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [currentImageIndex, fadeAnim1, fadeAnim2, images.length]);

  return (
    <View
      style={[
        styles.collageSection,
        {
          height: isSmallScreen
            ? Math.min(windowDimensions.height * 0.95, 600)
            : Platform.OS === "web" && typeof window !== "undefined"
            ? "95vh"
            : windowDimensions.height * 0.95,
        },
      ]}
    >
      {/* Background Images with Crossfade Animation */}
      {/* Current Image - Fading Out */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: fadeAnim1,
            zIndex: 1,
          },
        ]}
      >
        <Image
          source={images[currentImageIndex]}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Next Image - Fading In */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: fadeAnim2,
            zIndex: 2,
          },
        ]}
      >
        <Image
          source={images[nextImageIndex]}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Linear Gradient Overlay */}
      <View style={styles.gradientOverlay}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
        <View style={styles.gradientLayer4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  collageSection: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  gradientLayer1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "25%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  gradientLayer2: {
    position: "absolute",
    top: "25%",
    left: 0,
    right: 0,
    height: "25%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  gradientLayer3: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: "25%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  gradientLayer4: {
    position: "absolute",
    top: "75%",
    left: 0,
    right: 0,
    height: "25%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
});

export default CollageSection;
