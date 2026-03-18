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
import DiscoverMoreButton from "./DiscoverMoreButton";

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

const DiscoverMoreSection = ({ onDiscoverMore }) => {
  const windowDimensions = Dimensions.get("window");
  const isSmallScreen = windowDimensions.width < 768;
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Must be declared before any useEffect that references it
  const videoAsset = require("../../assets/DiscoverMore.mp4");
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

  const getContainerPadding = () => {
    if (windowDimensions.width < 600) return 20;
    if (windowDimensions.width < 1024) return 40;
    return 80;
  };

  return (
    <View
      style={[
        styles.discoverSection,
        {
          height: isSmallScreen
            ? Math.min(screenHeight * 0.9, 500)
            : Platform.OS === "web" && typeof window !== "undefined"
            ? "90vh"
            : screenHeight * 0.9,
          paddingTop: isSmallScreen ? 60 : 80,
          paddingBottom: isSmallScreen ? 40 : 60,
          paddingHorizontal: getContainerPadding(),
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

      {/* Content - White Box on Top Left */}
      <View
        style={[
          styles.contentBox,
          {
            width: isSmallScreen
              ? "100%"
              : windowDimensions.width < 1024
              ? "90%"
              : "45%",
            maxWidth: isSmallScreen ? "100%" : 600,
            padding: isSmallScreen ? 24 : 40,
            marginTop: isSmallScreen ? 20 : 60,
          },
        ]}
      >
        <Text
          style={[
            styles.madeToOrderText,
            {
              fontSize: isSmallScreen ? 12 : 14,
              letterSpacing: isSmallScreen ? 1 : 2,
              marginBottom: isSmallScreen ? 12 : 16,
            },
          ]}
        >
          HECHO A LA MEDIDA
        </Text>
        <Text
          style={[
            styles.bespokeTitle,
            {
              fontSize: isSmallScreen ? 24 : 36,
              letterSpacing: isSmallScreen ? 1 : 2,
              marginBottom: isSmallScreen ? 16 : 24,
              lineHeight: isSmallScreen ? 30 : 44,
            },
          ]}
          accessibilityRole="header"
          aria-level={2}
        >
          ANILLOS DE COMPROMISO A LA MEDIDA
        </Text>
        <Text
          style={[
            styles.descriptionText,
            {
              fontSize: isSmallScreen ? 14 : 16,
              lineHeight: isSmallScreen ? 20 : 24,
              marginBottom: isSmallScreen ? 24 : 32,
            },
          ]}
        >
          En Burmes diseñamos y creamos tu anillo de compromiso a la medida desde
          nuestro taller en Perú. Todo dentro de tu rango de precio.
        </Text>
        <DiscoverMoreButton onPress={onDiscoverMore} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  discoverSection: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
    backgroundColor: "#1a1a1a",
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
  contentBox: {
    backgroundColor: "#ffffff",
    zIndex: 2,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  madeToOrderText: {
    fontWeight: "400",
    color: "#1a1a1a",
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
  bespokeTitle: {
    fontWeight: "700",
    color: "#1a1a1a",
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
  descriptionText: {
    fontWeight: "400",
    color: "#1a1a1a",
    fontFamily: "sans-serif",
  },
});

export default DiscoverMoreSection;
