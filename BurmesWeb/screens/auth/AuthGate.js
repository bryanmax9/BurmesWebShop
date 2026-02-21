import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import SignInClientScreen from "./SignInClientScreen";
import SignUpClientScreen from "./SignUpClientScreen";
import SignInAdminScreen from "./SignInAdminScreen";

const VIEW_PICKER = "picker";
const VIEW_SIGN_IN_CLIENT = "signInClient";
const VIEW_SIGN_UP_CLIENT = "signUpClient";
const VIEW_SIGN_IN_ADMIN = "signInAdmin";

export default function AuthGate() {
  const { loading } = useAuth();
  const [view, setView] = useState(VIEW_PICKER);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.loadingText}>Cargando…</Text>
      </View>
    );
  }

  if (view === VIEW_SIGN_IN_CLIENT) {
    return (
      <SignInClientScreen
        onBack={() => setView(VIEW_PICKER)}
        onSignUp={() => setView(VIEW_SIGN_UP_CLIENT)}
      />
    );
  }
  if (view === VIEW_SIGN_UP_CLIENT) {
    return (
      <SignUpClientScreen
        onBack={() => setView(VIEW_PICKER)}
        onSignIn={() => setView(VIEW_SIGN_IN_CLIENT)}
      />
    );
  }
  if (view === VIEW_SIGN_IN_ADMIN) {
    return (
      <SignInAdminScreen onBack={() => setView(VIEW_PICKER)} />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <Text style={styles.title}>BURMES & CO.</Text>
        <Text style={styles.subtitle}>Inicia sesión o crea una cuenta</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setView(VIEW_SIGN_IN_CLIENT)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Iniciar sesión (Cliente)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setView(VIEW_SIGN_UP_CLIENT)}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Registrarse (Cliente)</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Administrador</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => setView(VIEW_SIGN_IN_ADMIN)}
          activeOpacity={0.85}
        >
          <Text style={styles.adminButtonText}>Iniciar sesión (Admin)</Text>
        </TouchableOpacity>
        <Text style={styles.adminHint}>Solo correo. El acceso de administrador lo otorga la tienda.</Text>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
    paddingBottom: 60,
  },
  container: {
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#1a1a1a",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: "#1a1a1a",
    fontWeight: "700",
    letterSpacing: 1,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  adminButton: {
    backgroundColor: "#444",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  adminButtonText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  adminHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
});
