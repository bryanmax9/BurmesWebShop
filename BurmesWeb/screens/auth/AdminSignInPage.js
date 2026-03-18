import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import useSEO from "../../hooks/useSEO";
import SignInAdminScreen from "./SignInAdminScreen";

export default function AdminSignInPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  useSEO({
    title: "Acceso Administrativo",
    description: "Inicia sesión para gestionar la tienda de Burmes & Co.",
  });

  useEffect(() => {
    if (user && isAdmin) navigate("/admin/dashboard", { replace: true });
  }, [user, isAdmin, navigate]);

  return (
    <View style={styles.page}>
      <SignInAdminScreen onBack={() => navigate("/")} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
});
