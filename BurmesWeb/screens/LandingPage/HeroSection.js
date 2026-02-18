import React, { useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
  ImageBackground,
} from "react-native";
import ShopCollectionsButton from "./ShopCollectionsButton";

// Try to import expo-av for mobile video support
let Video = null;
try {
  const expoAv = require("expo-av");
  Video = expoAv.Video;
} catch (e) {
  // expo-av not available, will use fallback
}

const HeroSection = ({ onShopCollections }) => {
  const windowDimensions = Dimensions.get("window");
  const isSmallScreen = windowDimensions.width < 768;
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web" && videoRef.current) {
      const video = videoRef.current;
      // Set video properties
      video.loop = true;
      video.muted = true;
      // Try to play, but don't treat play() failure as error
      // Mobile browsers often require user interaction for autoplay
      video.play().catch(() => {
        // Play failed (likely autoplay policy), but video might still load
        // Only show error if video actually fails to load (handled by onError)
      });
    } else if (Platform.OS !== "web" && Video && videoRef.current) {
      // For native, try to play but don't treat failure as immediate error
      videoRef.current.playAsync().catch(() => {
        // Play failed, but video might still be loading
      });
    }
  }, []);

  const handleVideoError = (e) => {
    // Only set error when video actually fails to load
    console.log("Video error:", e);
    setVideoError(true);
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };

  const videoSource = require("../../assets/bobby.mp4");

  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;

  return (
    <View
      style={[
        styles.heroSection,
        {
          height: isSmallScreen
            ? Math.min(screenHeight * 0.75, 500)
            : Platform.OS === "web" && typeof window !== "undefined"
            ? window.innerHeight
            : screenHeight,
          paddingTop: isSmallScreen ? 60 : 120,
          paddingBottom: 0,
        },
      ]}
    >
      {/* Video Background */}
      {videoError ? (
        <View style={styles.videoPlaceholder}>
          <ImageBackground
            source={require("../../assets/burmes-Banner.png")}
            style={styles.videoPlaceholderImage}
            resizeMode="cover"
          />
        </View>
      ) : Platform.OS === "web" && typeof document !== "undefined" ? (
        <video
          ref={videoRef}
          src={videoSource}
          style={styles.videoBackground}
          autoPlay
          loop
          muted
          playsInline
          onError={handleVideoError}
          onLoadedData={handleVideoLoaded}
          onCanPlay={handleVideoLoaded}
        />
      ) : Video ? (
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.videoBackground}
          resizeMode="cover"
          shouldPlay
          isLooping
          isMuted
          onError={handleVideoError}
        />
      ) : (
        <View style={styles.videoPlaceholder}>
          <ImageBackground
            source={require("../../assets/burmes-Banner.png")}
            style={styles.videoPlaceholderImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Modern Gradient Overlay - Covers entire hero section */}
      <View style={styles.gradientOverlay}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
        <View style={styles.gradientLayer4} />
      </View>

      {/* Content */}
      <View
        style={[
          styles.heroContent,
          {
            paddingHorizontal: isSmallScreen ? 24 : 40,
            justifyContent: isSmallScreen ? "flex-end" : "center",
            paddingBottom: isSmallScreen ? 40 : 0,
            flex: 1,
          },
        ]}
      >
        <Text
          style={[
            styles.madeInText,
            {
              fontSize: isSmallScreen ? 32 : 56,
              letterSpacing: isSmallScreen ? 5 : 8,
              marginBottom: isSmallScreen ? 12 : 20,
              lineHeight: isSmallScreen ? 38 : 64,
            },
          ]}
        >
          MADE IN HOUSE
        </Text>
        <Text
          style={[
            styles.locationText,
            {
              fontSize: isSmallScreen ? 18 : 24,
              letterSpacing: isSmallScreen ? 4 : 4,
              marginBottom: isSmallScreen ? 28 : 48,
            },
          ]}
        >
          PERU
        </Text>
        <ShopCollectionsButton onPress={onShopCollections} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingTop: 120,
    paddingBottom: 60,
    width: "100%",
    alignSelf: "stretch",
    position: "relative",
    overflow: "hidden",
  },
  videoBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
  },
  videoPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#1a1a1a",
  },
  videoPlaceholderImage: {
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
    height: "20%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  gradientLayer2: {
    position: "absolute",
    top: "20%",
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  gradientLayer3: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  gradientLayer4: {
    position: "absolute",
    top: "80%",
    left: 0,
    right: 0,
    height: "20%",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    width: "100%",
  },
  madeInText: {
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
  locationText: {
    fontWeight: "400",
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
});

export default HeroSection;
