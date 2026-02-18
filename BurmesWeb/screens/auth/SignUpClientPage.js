import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SignUpClientScreen from "./SignUpClientScreen";

export default function SignUpClientPage() {
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
      <SignUpClientScreen
        onBack={() => navigate("/")}
        onSignIn={() => navigate("/sign-in")}
        onSignUpSuccess={() => navigate("/complete-profile", { replace: true })}
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
