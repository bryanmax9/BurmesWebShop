import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Platform } from "react-native";

// Set document title and favicon for web (so tab shows "Burmes" and icon works when deployed)
if (typeof document !== "undefined") {
  document.title = "Burmes";
  const existingFavicon = document.querySelector('link[rel="icon"]');
  if (!existingFavicon || !existingFavicon.getAttribute("href")) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = "/favicon.jpg";
    document.head.appendChild(link);
  }
}
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import StoreLayout from "./screens/StoreLayout";
import SignInClientPage from "./screens/auth/SignInClientPage";
import SignUpClientPage from "./screens/auth/SignUpClientPage";
import CompleteProfilePage from "./screens/auth/CompleteProfilePage";
import AdminSignInPage from "./screens/auth/AdminSignInPage";
import AdminDashboard from "./screens/AdminDashboard";
import AdminListings from "./screens/AdminListings";
import ClientDashboard from "./screens/ClientDashboard";
import CartPage from "./screens/CartPage";

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = {
  fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin/sign-in" element={<AdminSignInPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/listings" element={<AdminListings />} />
      <Route path="/sign-in" element={<SignInClientPage />} />
      <Route path="/sign-up" element={<SignUpClientPage />} />
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
      <Route path="/client/dashboard" element={<ClientDashboard />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="*" element={<StoreLayout />} />
    </Routes>
  );
}

export default function App() {
  const isWeb = Platform.OS === "web";

  const Router = isWeb ? BrowserRouter : MemoryRouter;
  const routerProps = isWeb ? {} : { initialEntries: ["/"] };

  return (
    <Router {...routerProps}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
