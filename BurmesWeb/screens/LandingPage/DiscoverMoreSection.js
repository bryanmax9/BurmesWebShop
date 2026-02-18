import React, { useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
  ImageBackground,
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

const DiscoverMoreSection = ({ onDiscoverMore }) => {
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

  const videoSource = require("../../assets/DiscoverMore.mp4");

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
          MADE TO ORDER
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
        >
          BESPOKE ENGAGEMENT RINGS
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
          At Bobby White, we design and create your bespoke engagement ring from
          our studio in London. All within your price range.
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
