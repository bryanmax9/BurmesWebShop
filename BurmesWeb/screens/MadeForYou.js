import React, { useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  ScrollView,
  Platform,
  ImageBackground,
} from "react-native";
import Footer from "../Shared/Footer";

// Try to import expo-av for mobile video support
let Video = null;
try {
  const expoAv = require("expo-av");
  Video = expoAv.Video;
} catch (e) {
  // expo-av not available, will use fallback
}

const MadeForYou = ({ onNavigate }) => {
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

  const videoSource = require("../assets/CreateYourOwn.mp4");

  const screenHeight = Dimensions.get("window").height;

  const getContainerPadding = () => {
    if (windowDimensions.width < 600) return 20;
    if (windowDimensions.width < 1024) return 40;
    return 80;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.madeForYouSection,
          {
            height: isSmallScreen
              ? Math.min(screenHeight * 0.9, 500)
              : Platform.OS === "web" && typeof window !== "undefined"
              ? "90vh"
              : screenHeight * 0.9,
            paddingHorizontal: getContainerPadding(),
          },
        ]}
      >
        {/* Video Background */}
        {videoError ? (
          <View style={styles.videoPlaceholder}>
            <ImageBackground
              source={require("../assets/burmes-Banner.png")}
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
              source={require("../assets/burmes-Banner.png")}
              style={styles.videoPlaceholderImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Content - White Box Centered */}
        <View
          style={[
            styles.contentBox,
            {
              width: isSmallScreen
                ? "100%"
                : windowDimensions.width < 1024
                ? "85%"
                : "50%",
              maxWidth: isSmallScreen ? "100%" : 650,
              padding: isSmallScreen ? 32 : 48,
              alignSelf: "center",
              marginTop: isSmallScreen ? 40 : "15%",
            },
          ]}
        >
          <Text
            style={[
              styles.createYourOwnText,
              {
                fontSize: isSmallScreen ? 12 : 14,
                letterSpacing: isSmallScreen ? 1.5 : 2.5,
                marginBottom: isSmallScreen ? 14 : 18,
              },
            ]}
          >
            CREATE YOUR OWN
          </Text>
          <Text
            style={[
              styles.bespokeRingTitle,
              {
                fontSize: isSmallScreen ? 28 : 42,
                letterSpacing: isSmallScreen ? 1.5 : 2,
                marginBottom: isSmallScreen ? 20 : 28,
                lineHeight: isSmallScreen ? 34 : 50,
              },
            ]}
          >
            BESPOKE RING
          </Text>
          <Text
            style={[
              styles.descriptionText,
              {
                fontSize: isSmallScreen ? 15 : 17,
                lineHeight: isSmallScreen ? 22 : 26,
                marginBottom: isSmallScreen ? 28 : 36,
              },
            ]}
          >
            Looking to have a bespoke ring designed and made by hand from the
            Burmes Jewelry studio? All are created within your price range and
            shipped worldwide to your door. Complete the form below for a quote.
          </Text>
        </View>
      </View>

      {/* Made for you Section */}
      <View
        style={[
          styles.madeForYouInfoSection,
          {
            paddingHorizontal: getContainerPadding(),
            paddingTop: isSmallScreen ? 60 : 80,
            paddingBottom: isSmallScreen ? 60 : 100,
          },
        ]}
      >
        <Text
          style={[
            styles.madeForYouHeading,
            {
              fontSize: isSmallScreen ? 32 : 48,
              marginBottom: isSmallScreen ? 24 : 32,
            },
          ]}
        >
          Made for you
        </Text>
        <View
          style={[
            styles.descriptionContainer,
            {
              maxWidth: isSmallScreen ? "100%" : 800,
            },
          ]}
        >
          <Text
            style={[
              styles.madeForYouDescription,
              {
                fontSize: isSmallScreen ? 15 : 17,
                lineHeight: isSmallScreen ? 24 : 28,
              },
            ]}
          >
            We work with 18ct golds, platinum, precious gems, diamonds,
            sapphires, and emeralds. All our diamonds over 0.40ct come with a
            GIA report. Complimentary worldwide shipping on all our engagement
            rings.{"\n\n"}Please complete the form below in full and we will get
            back to you shortly.
          </Text>
        </View>
      </View>
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
  madeForYouSection: {
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  createYourOwnText: {
    fontWeight: "500",
    color: "#1a1a1a",
    textTransform: "uppercase",
    fontFamily: "sans-serif",
  },
  bespokeRingTitle: {
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
  madeForYouInfoSection: {
    backgroundColor: "#f8f8f8",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  madeForYouHeading: {
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  descriptionContainer: {
    width: "100%",
    alignItems: "center",
  },
  madeForYouDescription: {
    fontWeight: "400",
    color: "#1a1a1a",
    textAlign: "center",
    fontFamily: "sans-serif",
  },
});

export default MadeForYou;
