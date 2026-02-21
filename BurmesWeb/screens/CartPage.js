import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Image,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const WHATSAPP_NUMBER = "51969762316";
const INSTAGRAM_URL = "https://www.instagram.com/burmesandco/";

const toImageSource = (img) => {
  if (!img) return null;
  if (typeof img === "number") return img;
  if (typeof img === "string" && /^https?:\/\//i.test(img)) return { uri: img };
  return null;
};

const formatPrice = (price) => {
  if (price == null || Number.isNaN(Number(price))) return "Precio a consultar";
  return `$${Number(price).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function CartPage() {
  const navigate = useNavigate();
  const { user, isAdmin, userDoc, getCart, setCart, createRequest, profileNeedsCompletion } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const { width } = useWindowDimensions();
  const isWebOrLarge = width >= 768;

  // Admins should not use the cart/request flow at all
  const cart = !isAdmin && user ? (getCart() || []) : [];
  const isEmpty = !cart.length;
  const hasStockIssues = cart.some((i) => {
    const stock = typeof i.countInStock === "number" ? i.countInStock : null;
    const qty = i.quantity || 1;
    return stock != null && (stock === 0 || qty > stock);
  });

  const total = cart.reduce((sum, i) => {
    const p = i.price != null ? Number(i.price) : 0;
    const q = i.quantity || 1;
    return sum + p * q;
  }, 0);
  const hasTotal = cart.some((i) => i.price != null && !Number.isNaN(Number(i.price)));

  React.useEffect(() => {
    if (!user) {
      navigate("/sign-in", { replace: true });
      return;
    }
    if (isAdmin) {
      // Admins are not allowed to use the cart – send them back to the store.
      navigate("/", { replace: true });
      return;
    }
    if (profileNeedsCompletion) {
      navigate("/complete-profile", { replace: true });
    }
  }, [user, profileNeedsCompletion, navigate]);

  const removeFromCart = (index) => {
    const next = cart.filter((_, i) => i !== index);
    setCart(next);
  };

  const setItemQty = (index, nextQty) => {
    const qty = Math.max(1, Number(nextQty) || 1);
    const stock = typeof cart[index]?.countInStock === "number" ? cart[index].countInStock : null;
    const clamped = stock != null ? Math.min(qty, stock) : qty;
    const next = cart.map((it, i) => (i === index ? { ...it, quantity: clamped } : it));
    setCart(next);
  };

  const handleSubmitRequest = async () => {
    if (isEmpty || hasStockIssues || submitting || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const id = await createRequest(cart);
      if (id) setRequestId(id);
      setRequestSent(true);
    } catch (err) {
      alert(err.message || "No se pudo enviar la solicitud.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    const names = cart.map((i) => i.productName).join(", ");
    const refLine = requestId ? ` (Request ID: ${requestId})` : "";
    const text = `Hola! He enviado una solicitud desde la web por: ${names}.${refLine} Me gustaría continuar por WhatsApp. Gracias.`;
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`).catch(() => {});
  };

  const openInstagram = () => {
    Linking.openURL(INSTAGRAM_URL).catch(() => {});
  };

  if (!user || isAdmin) return null;

  if (requestSent) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate("/")}>
            <Text style={styles.backText}>← Volver a la tienda</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.successWrapper, isWebOrLarge && styles.successWrapperWeb]}>
          <View style={[styles.successBox, isWebOrLarge && styles.successBoxWeb]}>
            <View style={styles.successIconWrap}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={[styles.successTitle, isWebOrLarge && styles.successTitleWeb]}>
              Solicitud enviada a la tienda
            </Text>
            <Text style={[styles.successSubtitle, isWebOrLarge && styles.successSubtitleWeb]}>
              Tu solicitud está en revisión. Indica tu número de solicitud al contactarnos para un seguimiento rápido.
            </Text>
            {requestId ? (
              <View style={styles.requestIdBlock}>
                <Text style={styles.requestIdLabel}>Número de solicitud</Text>
                <Text style={styles.requestIdValue} selectable>{requestId}</Text>
                <Text style={styles.requestIdHint}>Usa este número al escribir por WhatsApp o Instagram</Text>
              </View>
            ) : null}
            <View style={[styles.successActions, isWebOrLarge && styles.successActionsWeb]}>
              <TouchableOpacity style={styles.whatsAppBtn} onPress={openWhatsApp}>
                <Text style={styles.whatsAppBtnText}>Contactar por WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.instagramBtn} onPress={openInstagram}>
                <Text style={styles.instagramBtnText}>Contactar por Instagram</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.storeLink} onPress={() => navigate("/")}>
              <Text style={styles.storeLinkText}>Seguir comprando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate("/")}>
          <Text style={styles.backText}>← Volver a la tienda</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tu carrito</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isEmpty ? (
          <Text style={styles.empty}>Tu carrito está vacío. Añade productos de la tienda para enviar una solicitud.</Text>
        ) : (
          <>
            {cart.map((item, index) => {
              const imgSrc = toImageSource(item.image);
              const lineTotal = (item.price != null ? Number(item.price) * (item.quantity || 1) : null);
              const stock = typeof item.countInStock === "number" ? item.countInStock : null;
              const qty = item.quantity || 1;
              return (
                <View key={`${item.productId}-${index}`} style={styles.cartRow}>
                  {imgSrc ? (
                    <Image source={imgSrc} style={styles.cartImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cartImage, styles.cartImagePlaceholder]}>
                      <Text style={styles.cartImagePlaceholderText}>—</Text>
                    </View>
                  )}
                  <View style={styles.cartRowInfo}>
                    <Text style={styles.cartItemName}>{item.productName || "Producto"}</Text>
                    {item.description ? (
                      <Text style={styles.cartItemDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                    {stock != null && (
                      <Text style={[styles.cartStock, stock === 0 && styles.cartStockZero]}>
                        {stock === 0 ? "Agotado" : `${stock} en stock`}
                        {stock > 0 && stock <= 5 ? ` · Solo quedan ${stock}` : ""}
                      </Text>
                    )}
                    <View style={styles.cartRowMeta}>
                      {item.price != null && !Number.isNaN(Number(item.price)) && (
                        <Text style={styles.cartItemPrice}>
                          {formatPrice(item.price)}
                          {(item.quantity || 1) > 1 && (
                            <Text style={styles.cartItemQty}> × {item.quantity} = {formatPrice(lineTotal)}</Text>
                          )}
                        </Text>
                      )}
                      {(item.price == null || Number.isNaN(Number(item.price))) && (item.quantity || 1) > 1 && (
                        <Text style={styles.cartItemQty}>× {item.quantity}</Text>
                      )}
                    </View>
                    <View style={styles.qtyRow}>
                      <Text style={styles.qtyLabel}>Cant.</Text>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity
                          style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
                          onPress={() => setItemQty(index, qty - 1)}
                          disabled={qty <= 1}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{qty}</Text>
                        <TouchableOpacity
                          style={[
                            styles.qtyBtn,
                            stock != null && qty >= stock && styles.qtyBtnDisabled,
                          ]}
                          onPress={() => setItemQty(index, qty + 1)}
                          disabled={stock != null && qty >= stock}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeFromCart(index)}
                    >
                      <Text style={styles.removeBtnText}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {hasTotal && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.requestBtn, (isEmpty || hasStockIssues || submitting) && styles.requestBtnDisabled]}
              onPress={handleSubmitRequest}
              disabled={isEmpty || hasStockIssues || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.requestBtnText}>Enviar solicitud</Text>
              )}
            </TouchableOpacity>
            {hasStockIssues && (
              <Text style={styles.stockWarning}>
                Algunos productos superan el stock disponible. Ajusta las cantidades antes de enviar.
              </Text>
            )}
            <Text style={styles.requestHint}>
              La tienda revisará tu solicitud y te contactará por WhatsApp o SMS.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#1a1a1a",
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backText: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  empty: { fontSize: 15, color: "#555", marginTop: 24 },
  cartRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    alignItems: "flex-start",
  },
  cartImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginRight: 16,
  },
  cartImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cartImagePlaceholderText: { color: "#999", fontSize: 24 },
  cartRowInfo: { flex: 1, minWidth: 0 },
  cartItemName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  cartItemDesc: { fontSize: 13, color: "#666", lineHeight: 18, marginBottom: 6 },
  cartStock: { fontSize: 12, color: "#6b6b6b", fontWeight: "600", marginBottom: 6 },
  cartStockZero: { color: "#9b3c3c" },
  cartRowMeta: { marginBottom: 8 },
  cartItemPrice: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  cartItemQty: { fontSize: 14, color: "#555", fontWeight: "400" },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  qtyLabel: { fontSize: 12, color: "#777", fontWeight: "800", textTransform: "uppercase" },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyBtnText: { fontSize: 16, fontWeight: "900", color: "#111", marginTop: -1 },
  qtyValue: { minWidth: 18, textAlign: "center", fontSize: 13, fontWeight: "900", color: "#111" },
  removeBtn: { paddingVertical: 6, paddingHorizontal: 0 },
  removeBtnText: { fontSize: 13, color: "#c00", fontWeight: "600" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  totalAmount: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
  requestBtn: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    borderRadius: 8,
  },
  requestBtnDisabled: { opacity: 0.5 },
  requestBtnText: { color: "#fff", fontWeight: "700", fontSize: 14, letterSpacing: 1 },
  stockWarning: { fontSize: 12, color: "#9b3c3c", marginTop: 10, textAlign: "center", fontWeight: "700" },
  requestHint: { fontSize: 12, color: "#666", marginTop: 12, textAlign: "center" },
  successContainer: {
    minHeight: "100%",
    ...(Platform.OS === "web" && { minHeight: "100vh" }),
  },
  successWrapper: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  successWrapperWeb: {
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  successBox: {
    width: "100%",
    maxWidth: 440,
    padding: 28,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    ...(Platform.OS === "web" && {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 6,
    }),
  },
  successBoxWeb: {
    maxWidth: 480,
    padding: 40,
    borderRadius: 20,
  },
  successIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1a5f2a",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  successTitleWeb: { fontSize: 24, marginBottom: 14 },
  successSubtitle: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 24,
    textAlign: "center",
  },
  successSubtitleWeb: { fontSize: 15, lineHeight: 24, marginBottom: 28 },
  requestIdBlock: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  requestIdLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  requestIdValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  requestIdHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
  },
  successActions: {
    gap: 12,
    marginBottom: 24,
  },
  successActionsWeb: { marginBottom: 28 },
  whatsAppBtn: {
    backgroundColor: "#25D366",
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 10,
  },
  whatsAppBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  instagramBtn: {
    backgroundColor: "#E4405F",
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 0,
    borderRadius: 10,
  },
  instagramBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  storeLink: { alignItems: "center" },
  storeLinkText: { color: "#1a1a1a", fontSize: 14, fontWeight: "600" },
});
