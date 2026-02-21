import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Footer from "../../Shared/Footer";
import ProductCard from "./ProductCard";
import { useAuth } from "../../contexts/AuthContext";

const WHATSAPP_NUMBER = "51969762316"; // +51 969 762 316

const getId = (x) => x?._id?.$oid || x?._id || x?.id;
const getCat = (x) => x?.category?.$oid || x?.category;

const toSource = (img) => {
  if (!img) return null;
  if (typeof img === "number") return img; // require(...)
  if (typeof img === "string" && /^https?:\/\//i.test(img)) return { uri: img }; // remote URL
  return null; // prevent broken {uri:"../assets/.."}
};

const INSTAGRAM_URL = "https://www.instagram.com/burmesandco/";

const openWhatsAppOrder = (productName) => {
  const name = productName || "este artículo";
  const text = `Hola! Me gustaría recibir asesoría sobre el siguiente artículo que vi en su página: *${name}*. ¿Podrían indicarme disponibilidad y opciones de personalización? Gracias.`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  Linking.openURL(url).catch(() => {});
};

const openInstagramOrder = () => {
  Linking.openURL(INSTAGRAM_URL).catch(() => {});
};

export default function SingleProduct({
  product,
  onBack,
  onNavigate,
  onProductPress,
  navigate,
}) {
  const { user, isAdmin, createOrder, getCart, setCart, getProducts } = useAuth();
  const cart = user ? (getCart() || []) : [];
  const cartCount = cart.length;
  const { width } = useWindowDimensions();
  const isSmall = width < 768;
  const isMobile = width < 600;
  const padding = width < 600 ? 20 : width < 1024 ? 40 : 80;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [related, setRelated] = useState([]);
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedQty(1);

    if (!product) return setRelated([]);

    const cat = getCat(product);
    const pid = getId(product);

    let cancelled = false;
    (async () => {
      try {
        const list = await (getProducts ? getProducts(cat) : Promise.resolve([]));
        const rel = (list || [])
          .filter((p) => getId(p) !== pid && (p.countInStock || 0) > 0)
          .slice(0, 4);
        if (!cancelled) setRelated(rel);
      } catch (_) {
        if (!cancelled) setRelated([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product, getProducts]);

  // Admins are only previewing – they should not order or add to cart
  const canOrder = !isAdmin;

  const handleWhatsAppOrder = () => {
    if (user && createOrder && product) {
      createOrder(getId(product), product.name).catch(() => {});
    }
    openWhatsAppOrder(product?.name);
  };

  const handleAddToCart = () => {
    if (!user || !product || !setCart) return;
    const id = getId(product);
    const name = product.name;
    const image = product.image || (Array.isArray(product.images) && product.images[0]) || null;
    const description = product.description || null;
    const price = product.price != null ? Number(product.price) : null;
    const stock = typeof product.countInStock === "number" ? product.countInStock : null;
    if (stock === 0) return;
    const addQty = Math.max(1, Number(selectedQty) || 1);
    const existing = cart.find((i) => (i.productId || i.id) === id);
    const baseItem = { productId: id, productName: name, image, description, price, quantity: addQty, countInStock: stock };
    let next;
    if (existing) {
      next = cart.map((i) =>
        (i.productId || i.id) === id
          ? (() => {
              const current = i.quantity || 1;
              const desired = current + addQty;
              const max = typeof stock === "number" ? stock : desired;
              return {
                ...i,
                productId: id,
                productName: name,
                image: i.image || image,
                description: i.description || description,
                price: i.price != null ? i.price : price,
                countInStock: typeof stock === "number" ? stock : i.countInStock,
                quantity: typeof max === "number" ? Math.min(desired, max) : desired,
              };
            })()
          : i
      );
    } else {
      next = [...cart, baseItem];
    }
    setCart(next);
    setSelectedQty(1);
  };

  const images = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length)
      return product.images;
    return product.image ? [product.image] : [];
  }, [product]);

  const mainSource = useMemo(() => {
    const selected = images[selectedImageIndex] || product?.image;
    return toSource(selected) || toSource(product?.image);
  }, [images, selectedImageIndex, product]);

  const formatPrice = (price) => {
    if (price == null) return "Precio a consultar";
    const n = Number(price);
    if (Number.isNaN(n)) return "Precio a consultar";
    return `$${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };


  if (!product) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.muted}>Product not found</Text>
        {!!onBack && (
          <TouchableOpacity style={styles.simpleBtn} onPress={onBack}>
            <Text style={styles.simpleBtnText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {!!onBack && (
        <TouchableOpacity
          style={[styles.backBtn, { top: isSmall ? 60 : 120, left: padding }]}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.row,
          {
            paddingHorizontal: padding,
            paddingTop: isSmall ? 90 : 150,
            flexDirection: isMobile ? "column" : "row",
          },
        ]}
      >
        <View
          style={{
            width: isMobile ? "100%" : "50%",
            marginRight: isMobile ? 0 : 28,
          }}
        >
          <View style={styles.imageBox}>
            {mainSource ? (
              <Image
                source={mainSource}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.center}>
                <Ionicons name="image-outline" size={48} color="#bbb" />
                <Text style={styles.muted}>Image unavailable</Text>
              </View>
            )}
          </View>

          {images.length > 1 && (
            <View style={styles.thumbs}>
              {images.map((img, i) => {
                const src = toSource(img);
                return (
                  <TouchableOpacity
                    key={`${i}`}
                    style={[
                      styles.thumb,
                      i === selectedImageIndex && styles.thumbActive,
                      !src && { opacity: 0.5 },
                    ]}
                    onPress={() => src && setSelectedImageIndex(i)}
                    disabled={!src}
                  >
                    {src ? (
                      <Image source={src} style={styles.thumbImg} />
                    ) : (
                      <View style={styles.thumbFallback}>
                        <Ionicons name="image-outline" size={18} color="#bbb" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View
          style={{
            width: isMobile ? "100%" : "50%",
            marginTop: isMobile ? 18 : 0,
          }}
        >
          {!!product.brand && (
            <Text style={styles.brand}>
              {String(product.brand).toUpperCase()}
            </Text>
          )}
          <Text style={[styles.title, { fontSize: isSmall ? 28 : 36 }]}>
            {product.name}
          </Text>

          <Text style={styles.price}>{formatPrice(product.price)}</Text>

          {typeof product.countInStock === "number" && (
            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>En stock</Text>
              <Text style={[styles.stockValue, product.countInStock === 0 && styles.stockValueZero]}>
                {product.countInStock}
              </Text>
              {product.countInStock > 0 && product.countInStock <= 5 && (
                <Text style={styles.stockLow}>Solo quedan {product.countInStock}</Text>
              )}
            </View>
          )}

          {!!product.description && (
            <View style={styles.descBlock}>
              <Text style={styles.descLabel}>Descripción</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          )}

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              {isAdmin
                ? "Solo vista previa de administrador. Pedidos y carrito deshabilitados para cuentas de administrador."
                : "Todos los pedidos se realizan por WhatsApp para la seguridad de comprador y vendedor. Nuestra joyería se hace bajo pedido según tus indicaciones (talla, tipo de oro y otros detalles)."}
            </Text>
          </View>

          {canOrder && (
            <View style={styles.orderButtons}>
              {user ? (
                <>
                  {typeof product.countInStock === "number" && product.countInStock > 0 && (
                    <View style={styles.qtyRow}>
                      <Text style={styles.qtyLabel}>Cantidad</Text>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity
                          style={[styles.qtyBtn, selectedQty <= 1 && styles.qtyBtnDisabled]}
                          onPress={() => setSelectedQty((q) => Math.max(1, (Number(q) || 1) - 1))}
                          disabled={selectedQty <= 1}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{selectedQty}</Text>
                        <TouchableOpacity
                          style={[
                            styles.qtyBtn,
                            selectedQty >= product.countInStock && styles.qtyBtnDisabled,
                          ]}
                          onPress={() =>
                            setSelectedQty((q) =>
                              Math.min(product.countInStock, (Number(q) || 1) + 1)
                            )
                          }
                          disabled={selectedQty >= product.countInStock}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.orderBtn,
                      typeof product.countInStock === "number" && product.countInStock === 0 && styles.orderBtnDisabled,
                    ]}
                    onPress={handleAddToCart}
                    activeOpacity={0.85}
                    disabled={typeof product.countInStock === "number" && product.countInStock === 0}
                  >
                    <Text style={styles.orderBtnText}>
                      {typeof product.countInStock === "number" && product.countInStock === 0 ? "Agotado" : "Añadir al carrito"}
                    </Text>
                  </TouchableOpacity>
                  {cartCount > 0 && navigate && (
                    <TouchableOpacity
                      style={styles.orderBtnSecondary}
                      onPress={() => navigate("/cart")}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.orderBtnTextSecondary}>Ver carrito ({cartCount})</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.contactHint}>O contáctanos directamente:</Text>
                  <View style={styles.contactRow}>
                    <TouchableOpacity
                      style={styles.contactLink}
                      onPress={() => handleWhatsAppOrder()}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.contactLinkText}>WhatsApp</Text>
                    </TouchableOpacity>
                    <Text style={styles.contactDivider}>·</Text>
                    <TouchableOpacity
                      style={styles.contactLink}
                      onPress={openInstagramOrder}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.contactLinkText}>Instagram</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.orderBtn}
                  onPress={() => navigate && navigate("/sign-up")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.orderBtnText}>Inicia sesión para añadir al carrito</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {related.length > 0 && (
        <View style={[styles.relatedSection, { paddingHorizontal: padding }]}>
          <Text style={styles.relatedTitle}>También te puede gustar</Text>
          <View style={styles.relatedGrid}>
            {related.map((item, idx) => (
              <View
                key={getId(item) || `r-${idx}`}
                style={[
                  styles.relatedCardWrapper,
                  {
                    width: isMobile ? "48%" : "23%",
                    marginRight: isMobile ? "4%" : "2.66%",
                  },
                ]}
              >
                <ProductCard
                  name={item.name}
                  image={item.image}
                  price={item.price}
                  countInStock={item.countInStock}
                  onPress={() => onProductPress?.(item)}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      <Footer onNavigate={onNavigate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: { width: "100%" },

  backBtn: {
    position: "absolute",
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 25,
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  imageBox: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: "100%", height: "100%" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  thumbs: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 10 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: { borderColor: "#111" },
  thumbImg: { width: "100%", height: "100%" },
  thumbFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f3f3",
  },

  brand: {
    color: "#757575",
    letterSpacing: 1.5,
    fontSize: 12,
    marginBottom: 8,
  },
  title: { fontWeight: "700", color: "#111", marginBottom: 10 },
  price: { fontSize: 26, fontWeight: "800", marginBottom: 16 },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -6,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  stockLabel: { fontSize: 12, color: "#777", fontWeight: "800", textTransform: "uppercase" },
  stockValue: { fontSize: 13, color: "#111", fontWeight: "900" },
  stockValueZero: { color: "#9b3c3c" },
  stockLow: { fontSize: 12, color: "#9b3c3c", fontWeight: "800" },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  qtyLabel: { fontSize: 13, color: "#333", fontWeight: "800" },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyBtnText: { fontSize: 18, fontWeight: "900", color: "#111", marginTop: -1 },
  qtyValue: { minWidth: 24, textAlign: "center", fontSize: 14, fontWeight: "900", color: "#111" },
  descBlock: {
    backgroundColor: "#f2f2f2",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderLeftWidth: 4,
    borderLeftColor: "#1a1a1a",
    borderRadius: 8,
    paddingVertical: 22,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  descLabel: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#1a1a1a",
    marginBottom: 14,
    textTransform: "uppercase",
  },
  desc: {
    color: "#1a1a1a",
    fontSize: 18,
    lineHeight: 30,
    fontWeight: "400",
  },

  noticeBox: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#1a1a1a",
  },
  noticeText: {
    color: "#555",
    fontSize: 13,
    lineHeight: 20,
  },

  orderButtons: {},
  contactHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 14,
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactLink: { paddingVertical: 4, paddingRight: 8 },
  contactLinkText: { fontSize: 13, color: "#1a1a1a", fontWeight: "600", textDecorationLine: "underline" },
  contactDivider: { fontSize: 13, color: "#999", marginRight: 8 },
  orderBtn: {
    backgroundColor: "#5c5c5c",
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
  },
  orderBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#5c5c5c",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  orderBtnText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  orderBtnTextSecondary: {
    color: "#5c5c5c",
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  orderBtnDisabled: { opacity: 0.55 },

  relatedSection: { paddingTop: 32, paddingBottom: 24 },
  relatedTitle: { fontSize: 20, fontWeight: "800", marginBottom: 18 },
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  relatedCardWrapper: {
    marginBottom: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  muted: { marginTop: 10, color: "#757575" },

  simpleBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  simpleBtnText: { fontWeight: "700" },
});
