import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SignInClientScreen from "./SignInClientScreen";

export default function SignInClientPage() {
  const navigate = useNavigate();
  const { user, isAdmin, profileNeedsCompletion, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (isAdmin) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }
    if (profileNeedsCompletion) {
      navigate("/complete-profile", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  }, [user, isAdmin, profileNeedsCompletion, loading, navigate]);

  return (
    <View style={styles.page}>
      <SignInClientScreen
        onBack={() => navigate("/")}
        onSignUp={() => navigate("/sign-up")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    minHeight: Platform.OS === "web" ? "100vh" : undefined,
    width: "100%",
  },
});
