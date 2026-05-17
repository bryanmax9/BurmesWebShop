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
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Footer from "../../Shared/Footer";
import ProductCard from "./ProductCard";
import { useAuth } from "../../contexts/AuthContext";

const WHATSAPP_NUMBER = "51969762316"; // +51 969 762 316

const categoriesData = require("../../assets/data/categories.json");

const getCategoryName = (product) => {
  if (!product?.category) return null;
  const cat = (categoriesData || []).find((c) => {
    const oid = c?._id?.$oid || c?._id;
    return product.category === oid || product.category === c.name;
  });
  return cat?.name || null;
};

const TALLA_OPTIONS = ["XS", "S", "M", "L", "XL"];
const ORO_OPTIONS = ["Oro 14k", "Oro 18k", "Oro Blanco 14k", "Oro Blanco 18k", "Plata 925"];
const LARGO_PULSERA = [
  { cm: 14, label: '14 cm / 5.5"' },
  { cm: 16, label: '16 cm / 6.3"' },
  { cm: 17, label: '17 cm / 6.7"' },
  { cm: 18, label: '18 cm / 7.1"' },
  { cm: 19, label: '19 cm / 7.5"' },
  { cm: 20, label: '20 cm / 7.9"' },
];
const LARGO_CADENA = [
  { cm: 40, label: '40 cm / 15.7"' },
  { cm: 45, label: '45 cm / 17.7"' },
  { cm: 50, label: '50 cm / 19.7"' },
  { cm: 55, label: '55 cm / 21.7"' },
  { cm: 60, label: '60 cm / 23.6"' },
];

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

  const [mediaIndex, setMediaIndex] = useState(0);
  const [related, setRelated] = useState([]);
  const [selectedQty, setSelectedQty] = useState(1);
  const [lensPos, setLensPos] = useState(null); // { x: 0-1, y: 0-1 }
  const [containerW, setContainerW] = useState(400);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedGold, setSelectedGold] = useState(null);
  const [selectedLargo, setSelectedLargo] = useState(null);

  const categoryName = getCategoryName(product);
  const isBracelet = categoryName === "bracelets";
  const isChain = categoryName === "chains";
  const showCustomizers = isBracelet || isChain;
  const largoOptions = isBracelet ? LARGO_PULSERA : LARGO_CADENA;

  useEffect(() => {
    setMediaIndex(0);
    setSelectedQty(1);
    setSelectedSize(null);
    setSelectedGold(null);
    setSelectedLargo(null);
    setLensPos(null);

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
    const name = product?.name || "este artículo";
    let extras = "";
    if (selectedSize) extras += `\n• Talla: *${selectedSize}*`;
    if (selectedGold) extras += `\n• Material: *${selectedGold}*`;
    if (selectedLargo) extras += `\n• Largo: *${selectedLargo.label}*`;
    const text = `Hola! Me gustaría recibir asesoría sobre el siguiente artículo que vi en su página: *${name}*.${extras ? `\n\nOpciones seleccionadas:${extras}` : ""} ¿Podrían indicarme disponibilidad y opciones de personalización? Gracias.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {});
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

  // Combined media: images first, then videos
  const allMedia = useMemo(() => {
    const imgs = images.map((img) => ({ type: "image", src: toSource(img) })).filter((m) => m.src);
    const vids = (Array.isArray(product?.videos) ? product.videos : [])
      .filter(Boolean)
      .map((url) => ({ type: "video", url }));
    return [...imgs, ...vids];
  }, [images, product?.videos]);

  const currentMedia = allMedia[Math.min(mediaIndex, allMedia.length - 1)] || null;

  // Hover magnifier helpers (web only)
  const onImgLayout = (e) => setContainerW(e.nativeEvent.layout.width || 400);
  const onImgMouseMove = Platform.OS === "web" ? (e) => {
    const ne = e.nativeEvent;
    const x = Math.max(0, Math.min(1, (ne.offsetX || 0) / containerW));
    const y = Math.max(0, Math.min(1, (ne.offsetY || 0) / containerW));
    setLensPos({ x, y });
  } : undefined;
  const onImgMouseLeave = Platform.OS === "web" ? () => setLensPos(null) : undefined;

  const getMagTransform = () => {
    if (!lensPos) return undefined;
    const s = 2.2;
    const tx = (0.5 - lensPos.x) * containerW * (s - 1);
    const ty = (0.5 - lensPos.y) * containerW * (s - 1);
    return [{ translateX: tx }, { translateY: ty }, { scale: s }];
  };

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

  const hPad = isMobile ? 20 : isSmall ? 32 : 60;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.containerContent}
    >
      {!!onBack && (
        <TouchableOpacity
          style={[styles.backBtn, { marginHorizontal: hPad, marginBottom: 20 }]}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={18} color="#1a1a1a" />
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      )}

      <View style={[styles.pageInner, { paddingHorizontal: hPad, flexDirection: isMobile ? "column" : "row" }]}>
        {/* ── LEFT: gallery ── */}
        <View style={isMobile ? styles.galleryColMobile : styles.galleryColDesktop}>

          {/* ── Main media display (images + videos inline) ── */}
          <View
            style={styles.imageBox}
            onLayout={onImgLayout}
            onMouseMove={onImgMouseMove}
            onMouseLeave={onImgMouseLeave}
          >
            {currentMedia?.type === "video" ? (
              Platform.OS === "web" ? (
                <iframe
                  src={currentMedia.url}
                  style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  title="Video del producto"
                />
              ) : (
                <View style={styles.videoFallback}>
                  <Ionicons name="videocam-outline" size={40} color="#aaa" />
                  <Text style={styles.videoFallbackText}>Video</Text>
                </View>
              )
            ) : currentMedia?.src ? (
              <Image
                source={currentMedia.src}
                style={[styles.image, lensPos && { transform: getMagTransform() }]}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.center}>
                <Ionicons name="image-outline" size={48} color="#bbb" />
                <Text style={styles.muted}>Imagen no disponible</Text>
              </View>
            )}

            {/* Left arrow */}
            {mediaIndex > 0 && (
              <TouchableOpacity style={styles.arrowLeft} onPress={() => { setMediaIndex((i) => i - 1); setLensPos(null); }} activeOpacity={0.8}>
                <Ionicons name="chevron-back" size={20} color="#1a1a1a" />
              </TouchableOpacity>
            )}

            {/* Right arrow */}
            {mediaIndex < allMedia.length - 1 && (
              <TouchableOpacity style={styles.arrowRight} onPress={() => { setMediaIndex((i) => i + 1); setLensPos(null); }} activeOpacity={0.8}>
                <Ionicons name="chevron-forward" size={20} color="#1a1a1a" />
              </TouchableOpacity>
            )}

            {/* Media counter */}
            {allMedia.length > 1 && (
              <View style={styles.mediaCounter}>
                <Text style={styles.mediaCounterText}>{mediaIndex + 1} / {allMedia.length}</Text>
              </View>
            )}

            {/* Magnifier cursor hint (images only, desktop) */}
            {currentMedia?.type === "image" && !lensPos && Platform.OS === "web" && (
              <View style={styles.zoomHint}>
                <Ionicons name="search-outline" size={14} color="#fff" />
              </View>
            )}
          </View>

          {/* ── Thumbnail strip ── */}
          <View style={styles.thumbStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbStripContent}>
              {allMedia.map((media, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.thumb, i === mediaIndex && styles.thumbActive]}
                  onPress={() => { setMediaIndex(i); setLensPos(null); }}
                >
                  {media.type === "image" ? (
                    <Image source={media.src} style={styles.thumbImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.thumbVideo}>
                      <Ionicons name="play" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            {allMedia.length > 5 && (
              <View style={styles.thumbMore}>
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </View>
            )}
          </View>
        </View>

        {/* ── RIGHT: product info ── */}
        <View style={isMobile ? styles.infoColMobile : styles.infoColDesktop}>
          <Text style={[styles.title, { fontSize: isMobile ? 24 : 32 }]}>{product.name}</Text>

          <Text style={styles.price}>{formatPrice(product.price)}</Text>

          {typeof product.countInStock === "number" && (
            <View style={styles.stockRow}>
              <View style={[styles.stockDot, { backgroundColor: product.countInStock > 0 ? "#2d7a4a" : "#c0392b" }]} />
              <Text style={[styles.stockLabel, { color: product.countInStock > 0 ? "#2d7a4a" : "#c0392b" }]}>
                {product.countInStock > 0 ? "Disponible" : "Agotado"}
              </Text>
              {product.countInStock > 0 && product.countInStock <= 5 && (
                <Text style={styles.stockLow}>· Solo quedan {product.countInStock}</Text>
              )}
            </View>
          )}

          {/* Delivery message - all products */}
          <View style={styles.deliveryBox}>
            <Ionicons name="cube-outline" size={17} color="#1a1a1a" style={{ marginTop: 1 }} />
            <Text style={styles.deliveryText}>
              {(product.countInStock ?? 0) > 0
                ? "En stock — tu pedido se enviará el mismo día"
                : "Fabricado bajo pedido — tiempo de entrega: 2-3 semanas"}
            </Text>
          </View>

          {/* Size / Gold / Length selectors — only for pulseras & cadenas */}
          {showCustomizers && (
            <View style={styles.customizationBlock}>
              <View style={styles.customField}>
                <Text style={styles.customFieldLabel}>TALLA</Text>
                <View style={styles.customPillRow}>
                  {TALLA_OPTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.customPill, selectedSize === s && styles.customPillActive]}
                      onPress={() => setSelectedSize(s)}
                    >
                      <Text style={[styles.customPillText, selectedSize === s && styles.customPillTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.customField}>
                <Text style={styles.customFieldLabel}>MATERIAL / ORO</Text>
                <View style={styles.customPillRow}>
                  {ORO_OPTIONS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.customPill, selectedGold === g && styles.customPillActive]}
                      onPress={() => setSelectedGold(g)}
                    >
                      <Text style={[styles.customPillText, selectedGold === g && styles.customPillTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.customField}>
                <Text style={styles.customFieldLabel}>LARGO</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={[styles.customPillRow, { flexWrap: "nowrap" }]}>
                    {largoOptions.map((l) => (
                      <TouchableOpacity
                        key={l.cm}
                        style={[styles.customPill, selectedLargo?.cm === l.cm && styles.customPillActive]}
                        onPress={() => setSelectedLargo(l)}
                      >
                        <Text style={[styles.customPillText, selectedLargo?.cm === l.cm && styles.customPillTextActive]}>
                          {l.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {!!product.description && (
            <View style={styles.descBlock}>
              <Text style={styles.descLabel}>Descripción</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          )}

          {isAdmin && (
            <View style={styles.adminNotice}>
              <Text style={styles.adminNoticeText}>Vista previa — pedidos deshabilitados para admin.</Text>
            </View>
          )}

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
        <View style={[styles.relatedSection, { paddingHorizontal: hPad, marginTop: 64 }]}>
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
  // ── Page shell ──
  container: {
    flex: 1,
    backgroundColor: "#fff",
    ...(Platform.OS === "web" ? { minHeight: "100vh" } : {}),
  },
  containerContent: {
    paddingTop: 96,
    paddingBottom: 80,
  },

  // ── Layout ──
  pageInner: {
    width: "100%",
    alignItems: "flex-start",
  },
  // Desktop: flex ratio so columns fill evenly regardless of screen width
  galleryColDesktop: { flex: 11, marginRight: 48 },
  galleryColMobile: { width: "100%" },
  infoColDesktop: { flex: 9, paddingTop: 4 },
  infoColMobile: { width: "100%", marginTop: 32 },

  // ── Back button ──
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginTop: 16,
  },
  backBtnText: { fontSize: 13, fontWeight: "500", color: "#555" },

  // ── Main image box ──
  imageBox: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f5f4f2",
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    ...(Platform.OS === "web" ? { cursor: "crosshair" } : {}),
  },
  image: { width: "100%", height: "100%" },

  // ── Arrow nav ──
  arrowLeft: {
    position: "absolute",
    left: 12,
    top: "44%",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web" ? { boxShadow: "0 1px 6px rgba(0,0,0,0.18)", cursor: "pointer" } : { elevation: 2 }),
  },
  arrowRight: {
    position: "absolute",
    right: 12,
    top: "44%",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web" ? { boxShadow: "0 1px 6px rgba(0,0,0,0.18)", cursor: "pointer" } : { elevation: 2 }),
  },
  mediaCounter: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.38)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  mediaCounterText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  zoomHint: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.32)",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Video fallback ──
  videoFallback: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  videoFallbackText: { color: "#aaa", fontSize: 13 },

  // ── Thumbnail strip (Bobby White style) ──
  thumbStrip: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  thumbStripContent: { flexDirection: "row", gap: 8, paddingRight: 4 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f4f2",
  },
  thumbActive: { borderWidth: 2, borderColor: "#1a1a1a" },
  thumbImg: { width: "100%", height: "100%" },
  thumbVideo: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbMore: {
    width: 28,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Product info ──
  title: {
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
    lineHeight: 38,
    letterSpacing: -0.3,
  },
  price: {
    fontSize: 20,
    fontWeight: "400",
    color: "#1a1a1a",
    marginBottom: 20,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockLabel: { fontSize: 13, fontWeight: "600" },
  stockLow: { fontSize: 12, color: "#9b3c3c", fontWeight: "500" },

  // ── Delivery ──
  deliveryBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e8e8e8",
  },
  deliveryText: {
    flex: 1,
    fontSize: 13,
    color: "#444",
    lineHeight: 19,
  },

  // ── Description ──
  descBlock: { marginBottom: 24 },
  descLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  desc: {
    color: "#444",
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "400",
  },

  // ── Admin notice ──
  adminNotice: {
    backgroundColor: "#fff8e1",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#f0a500",
  },
  adminNoticeText: { color: "#7a5800", fontSize: 12 },

  // ── Qty ──
  orderButtons: { marginTop: 4 },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  qtyLabel: { fontSize: 13, color: "#333", fontWeight: "600" },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 16 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: { opacity: 0.35 },
  qtyBtnText: { fontSize: 18, fontWeight: "400", color: "#111" },
  qtyValue: { minWidth: 28, textAlign: "center", fontSize: 15, fontWeight: "600", color: "#111" },

  // ── Buttons ──
  orderBtn: {
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  orderBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  orderBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  orderBtnTextSecondary: {
    color: "#1a1a1a",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  orderBtnDisabled: { opacity: 0.45 },

  contactHint: { fontSize: 12, color: "#888", marginTop: 10, marginBottom: 6 },
  contactRow: { flexDirection: "row", alignItems: "center" },
  contactLink: { paddingVertical: 4, paddingRight: 8 },
  contactLinkText: { fontSize: 13, color: "#1a1a1a", fontWeight: "500", textDecorationLine: "underline" },
  contactDivider: { fontSize: 13, color: "#ccc", marginRight: 8 },

  // ── Customizers (pulseras/cadenas) ──
  customizationBlock: { marginBottom: 20, gap: 16 },
  customField: { gap: 8 },
  customFieldLabel: { fontSize: 11, fontWeight: "700", color: "#888", letterSpacing: 1.5 },
  customPillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  customPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  customPillActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  customPillText: { fontSize: 12, fontWeight: "500", color: "#444" },
  customPillTextActive: { color: "#fff" },

  // ── Related ──
  relatedSection: { paddingTop: 16, paddingBottom: 40 },
  relatedTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 20, letterSpacing: 0.3 },
  relatedGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
  relatedCardWrapper: { marginBottom: 20 },

  // ── Misc ──
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  muted: { marginTop: 10, color: "#aaa", fontSize: 13 },
  simpleBtn: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderRadius: 6 },
  simpleBtnText: { fontWeight: "600" },
});
