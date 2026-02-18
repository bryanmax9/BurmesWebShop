import React, { useState } from "react";
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
  useWindowDimensions,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function SignUpClientScreen({ onBack, onSignIn, onSignUpSuccess }) {
  const { signUpClient, signInWithGoogle } = useAuth();
  const { width } = useWindowDimensions();
  const isWebOrLarge = width >= 768;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    const e = (email || "").trim();
    const p = password || "";
    const r = repeatPassword || "";
    if (!e || !p) {
      Alert.alert("Required", "Please enter email and password.");
      return;
    }
    if (p.length < 6) {
      Alert.alert("Password", "Password should be at least 6 characters.");
      return;
    }
    if (p !== r) {
      Alert.alert("Password", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signUpClient(e, p, "");
      onSignUpSuccess?.();
    } catch (err) {
      Alert.alert("Sign up failed", err.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onSignUpSuccess?.();
    } catch (err) {
      Alert.alert("Sign up failed", err.message || "Could not sign up with Google.");
    } finally {
      setLoading(false);
    }
  };

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
      maxWidth: 460,
      alignSelf: "center",
      width: "100%",
    },
  ];
  const titleStyle = [styles.title, isWebOrLarge && styles.titleWeb];
  const subtitleStyle = [styles.subtitle, isWebOrLarge && styles.subtitleWeb];
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
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <Text style={titleStyle}>Create account</Text>
        <Text style={subtitleStyle}>
          Email and password, or continue with Google. You’ll complete your profile next.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={inputStyle}
          placeholder="you@example.com"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={inputStyle}
          placeholder="Min. 6 characters"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <Text style={styles.label}>Repeat password</Text>
        <TextInput
          style={inputStyle}
          placeholder="Repeat password"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={repeatPassword}
          onChangeText={setRepeatPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0a0a0a" />
          ) : (
            <Text style={styles.primaryButtonText}>Continue with email</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignUp}
          disabled={loading}
        >
          <Text style={styles.googleButtonText}>Sign up with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={onSignIn} disabled={loading}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    width: "100%",
  },
  containerWeb: {
    maxWidth: 520,
    alignSelf: "center",
    minHeight: "100%",
    ...(Platform.OS === "web" && {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    }),
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  backBtn: { marginBottom: 32 },
  backBtnText: { fontSize: 14, color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  title: {
    fontSize: 26,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 10,
  },
  titleWeb: { fontSize: 30, marginBottom: 12 },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 28,
    lineHeight: 20,
  },
  subtitleWeb: { fontSize: 14, lineHeight: 22, marginBottom: 32 },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  inputWeb: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 22,
  },
  primaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#0a0a0a", fontWeight: "700", fontSize: 13, letterSpacing: 1.5 },
  buttonDisabled: { opacity: 0.5 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.15)" },
  dividerText: { marginHorizontal: 14, color: "rgba(255,255,255,0.4)", fontSize: 12 },
  googleButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14,
    alignItems: "center",
  },
  googleButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  link: { marginTop: 28, alignItems: "center" },
  linkText: { fontSize: 13, color: "rgba(255,255,255,0.5)" },
});
