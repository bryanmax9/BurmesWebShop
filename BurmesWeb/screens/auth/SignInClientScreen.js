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

export default function SignInClientScreen({ onBack, onSignUp }) {
  const { signInClientEmail, signInWithGoogle } = useAuth();
  const { width } = useWindowDimensions();
  const isWebOrLarge = width >= 768;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async () => {
    const e = (email || "").trim();
    const p = password || "";
    if (!e || !p) {
      Alert.alert("Error", "Ingresa correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await signInClientEmail(e, p);
    } catch (err) {
      Alert.alert("Error al iniciar sesión", err.message || "Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert("Error al iniciar sesión", err.message || "No se pudo iniciar sesión con Google.");
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
          <Text style={styles.backBtnText}>← Atrás</Text>
        </TouchableOpacity>

        <Text style={titleStyle}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Correo o Google</Text>

        <TextInput
          style={inputStyle}
          placeholder="Correo electrónico"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        <TextInput
          style={inputStyle}
          placeholder="Contraseña"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleEmailSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0a0a0a" />
          ) : (
            <Text style={styles.buttonText}>Iniciar sesión con correo</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Text style={styles.googleButtonText}>Iniciar sesión con Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={onSignUp} disabled={loading}>
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
    backgroundColor: "#0a0a0a",
    width: "100%",
  },
  containerWeb: {
    maxWidth: 520,
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
  scrollContent: { paddingBottom: 48 },
  backBtn: { marginBottom: 28 },
  backBtnText: { fontSize: 14, color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  title: {
    fontSize: 26,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 8,
  },
  titleWeb: { fontSize: 30, marginBottom: 10 },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#fff",
    marginBottom: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  inputWeb: { paddingVertical: 16, paddingHorizontal: 18, marginBottom: 20 },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#0a0a0a", fontWeight: "700", fontSize: 13, letterSpacing: 1.5 },
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
