import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function CompleteProfileScreen({ onComplete }) {
  const { user, userDoc, updateUserProfile } = useAuth();
  const { width } = useWindowDimensions();
  const isWebOrLarge = width >= 768;
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [hasWhatsApp, setHasWhatsApp] = useState(true);
  const [workTitle, setWorkTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userDoc) {
      if (userDoc.fullName) setFullName(userDoc.fullName);
      if (userDoc.address) setAddress(userDoc.address);
      if (userDoc.phone) setPhone(userDoc.phone);
      if (typeof userDoc.hasWhatsApp === "boolean") setHasWhatsApp(userDoc.hasWhatsApp);
      if (userDoc.workTitle) setWorkTitle(userDoc.workTitle);
    }
  }, [userDoc]);

  const handleSubmit = async () => {
    const name = (fullName || "").trim();
    const addr = (address || "").trim();
    const ph = (phone || "").trim();
    if (!name) {
      Alert.alert("Required", "Please enter your full name.");
      return;
    }
    if (!addr) {
      Alert.alert("Required", "Please enter your address.");
      return;
    }
    if (!ph) {
      Alert.alert("Required", "Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      await updateUserProfile({
        fullName: name,
        address: addr,
        phone: ph,
        hasWhatsApp,
        workTitle: (workTitle || "").trim() || null,
      });
      onComplete?.();
    } catch (err) {
      Alert.alert("Error", err.message || "Could not save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const containerStyle = [
    styles.container,
    isWebOrLarge && styles.containerWeb,
  ];
  const scrollContentStyle = [
    styles.scrollContent,
    isWebOrLarge && {
      paddingHorizontal: 48,
      paddingTop: 56,
      paddingBottom: 56,
      maxWidth: 500,
      alignSelf: "center",
      width: "100%",
    },
  ];
  const titleStyle = [styles.title, styles.titleAccentWrap, isWebOrLarge && styles.titleWeb];
  const inputStyle = [styles.input, isWebOrLarge && styles.inputWeb];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={containerStyle}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={scrollContentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={titleStyle}>
          Complete your <Text style={styles.titleAccent}>profile</Text>
        </Text>
        <Text style={styles.hint}>
          A few details so we can serve you better. We’ll contact you via WhatsApp or SMS as you prefer.
        </Text>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={inputStyle}
          placeholder="Full name"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={fullName}
          onChangeText={setFullName}
          editable={!loading}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={inputStyle}
          placeholder="Address"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={address}
          onChangeText={setAddress}
          editable={!loading}
        />

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={inputStyle}
          placeholder="Phone number"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Contact me via WhatsApp</Text>
            <Text style={styles.subtitle}>Otherwise we’ll use SMS</Text>
          </View>
          <Switch
            value={hasWhatsApp}
            onValueChange={setHasWhatsApp}
            trackColor={{ false: "rgba(255,255,255,0.2)", true: "rgba(255,255,255,0.4)" }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.label}>Work title (optional)</Text>
        <TextInput
          style={[inputStyle, styles.inputOptional]}
          placeholder="e.g. Designer"
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={workTitle}
          onChangeText={setWorkTitle}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0a0a0a" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 48,
    width: "100%",
  },
  containerWeb: {
    maxWidth: 560,
    alignSelf: "center",
    minHeight: "100%",
    paddingHorizontal: 0,
    ...(Platform.OS === "web" && {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    }),
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 0,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#fff",
    marginBottom: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  inputWeb: { paddingVertical: 18, marginBottom: 26 },
  inputOptional: {
    borderColor: "rgba(255,255,255,0.1)",
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  toggleLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginRight: 12,
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#0a0a0a", fontWeight: "700", fontSize: 14, letterSpacing: 1.5 },
  title: {
    fontSize: 22,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 8,
  },
  titleAccentWrap: {},
  titleWeb: { fontSize: 28, marginBottom: 10 },
  titleAccent: { fontWeight: "600", letterSpacing: 3 },
  hint: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 32 },
});
