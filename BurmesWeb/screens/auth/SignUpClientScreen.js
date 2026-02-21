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
      Alert.alert("Requerido", "Ingresa correo y contraseña.");
      return;
    }
    if (p.length < 6) {
      Alert.alert("Contraseña", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (p !== r) {
      Alert.alert("Contraseña", "Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await signUpClient(e, p, "");
      onSignUpSuccess?.();
    } catch (err) {
      Alert.alert("Error al registrarse", err.message || "No se pudo crear la cuenta.");
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
      Alert.alert("Error al registrarse", err.message || "No se pudo registrar con Google.");
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
          <Text style={styles.backBtnText}>← Atrás</Text>
        </TouchableOpacity>

        <Text style={titleStyle}>Crear cuenta</Text>
        <Text style={subtitleStyle}>
          Email and password, or continue with Google. You’ll complete your profile next.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={inputStyle}
          placeholder="tu@ejemplo.com"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={inputStyle}
          placeholder="Mín. 6 caracteres"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <Text style={styles.label}>Repetir contraseña</Text>
        <TextInput
          style={inputStyle}
          placeholder="Repetir contraseña"
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
            <Text style={styles.primaryButtonText}>Continuar con correo</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignUp}
          disabled={loading}
        >
          <Text style={styles.googleButtonText}>Registrarse con Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={onSignIn} disabled={loading}>
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
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
