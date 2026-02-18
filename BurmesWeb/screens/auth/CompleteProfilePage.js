import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import CompleteProfileScreen from "./CompleteProfileScreen";

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, isAdmin, profileNeedsCompletion, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/sign-in", { replace: true });
      return;
    }
    if (isAdmin) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
    if (!profileNeedsCompletion) {
      navigate("/", { replace: true });
    }
  }, [user, isAdmin, profileNeedsCompletion, loading, navigate]);

  if (!user || isAdmin) return null;
  if (!loading && !profileNeedsCompletion) return null;

  return (
    <View style={styles.page}>
      <CompleteProfileScreen onComplete={() => navigate("/", { replace: true })} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    minHeight: Platform.OS === "web" ? "100vh" : "100%",
    width: "100%",
  },
});
