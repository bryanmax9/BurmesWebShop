import React, { useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
  ImageBackground,
  ActivityIndicator,
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

// Try to import expo-asset for resolving asset URIs on web
let Asset = null;
try {
  const expoAsset = require("expo-asset");
  Asset = expoAsset.Asset;
} catch (e) {
  // expo-asset not available
}

const HeroSection = ({ onShopCollections }) => {
  const windowDimensions = Dimensions.get("window");
  const isSmallScreen = windowDimensions.width < 768;
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Must be declared before any useEffect that references it
  const videoAsset = require("../../assets/hero.mp4");
  const [videoUri, setVideoUri] = useState(null);

  // Step 1: Resolve the asset URI (web needs a real URL, not a module number)
  useEffect(() => {
    if (Platform.OS === "web") {
      if (Asset) {
        const asset = Asset.fromModule(videoAsset);
        asset.downloadAsync().then(() => {
          setVideoUri(asset.uri);
        }).catch(() => {
          setVideoUri(videoAsset);
        });
      } else {
        setVideoUri(videoAsset);
      }
    }
  }, []);

  // Step 2: Once videoUri is set, attempt to play
  useEffect(() => {
    if (Platform.OS === "web" && videoRef.current && videoUri) {
      const video = videoRef.current;
      video.loop = true;
      video.muted = true;
      video.play().catch(() => {
        // Autoplay policy may block — video will still show once canplay fires
      });
    } else if (Platform.OS !== "web" && Video && videoRef.current) {
      videoRef.current.playAsync().catch(() => {});
    }
  }, [videoUri]);

  const handleVideoError = (e) => {
    console.log("Video error:", e);
    setVideoError(true);
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };



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
      {/* Loading Indicator */}
      {!videoLoaded && !videoError && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#C9A961" />
        </View>
      )}

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
        videoUri ? (
          <video
            ref={videoRef}
            src={videoUri}
            style={{
              ...StyleSheet.flatten(styles.videoBackground),
              opacity: videoLoaded ? 1 : 0
            }}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
            onCanPlay={handleVideoLoaded}
          />
        ) : null
      ) : Video ? (
        <Video
          ref={videoRef}
          source={videoAsset}
          style={[
            styles.videoBackground,
            { opacity: videoLoaded ? 1 : 0 }
          ]}
          resizeMode="cover"
          shouldPlay
          isLooping
          isMuted
          onError={handleVideoError}
          onLoad={handleVideoLoaded}
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
          HECHO EN CASA
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
          PERÚ
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
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    zIndex: 5,
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
