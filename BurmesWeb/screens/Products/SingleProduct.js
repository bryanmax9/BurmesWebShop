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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {!!onBack && (
        <TouchableOpacity
          style={[styles.backBtn, { top: isSmall ? 60 : 120, left: padding }]}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.row,
          {
            paddingHorizontal: padding,
            paddingTop: isSmall ? 90 : 140,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 0 : 48,
          },
        ]}
      >
        {/* ── Left: image gallery ── */}
        <View style={{ width: isMobile ? "100%" : "50%" }}>

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

          {/* ── Thumbnail strip (all media) ── */}
          {allMedia.length > 1 && (
            <View style={styles.thumbs}>
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
                      <Ionicons name="play-circle" size={26} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Right: product info ── */}
        <View style={{ width: isMobile ? "100%" : "50%", marginTop: isMobile ? 24 : 0 }}>
          {!!product.brand && (
            <Text style={styles.brand}>{String(product.brand).toUpperCase()}</Text>
          )}
          <Text style={[styles.title, { fontSize: isSmall ? 26 : 34 }]}>
            {product.name}
          </Text>

          <Text style={styles.price}>{formatPrice(product.price)}</Text>

          {typeof product.countInStock === "number" && (
            <View style={styles.stockRow}>
              <View style={[styles.stockDot, { backgroundColor: product.countInStock > 0 ? "#2d7a4a" : "#c0392b" }]} />
              <Text style={[styles.stockLabel, { color: product.countInStock > 0 ? "#2d7a4a" : "#c0392b" }]}>
                {product.countInStock > 0 ? `En stock (${product.countInStock})` : "Agotado"}
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
    borderRadius: 24,
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }
      : { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 }),
  },

  imageBox: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f4f4f2",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    ...(Platform.OS === "web" ? { cursor: "zoom-in" } : {}),
  },
  image: { width: "100%", height: "100%" },

  // Arrow navigation
  arrowLeft: {
    position: "absolute",
    left: 10,
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web" ? { boxShadow: "0 2px 8px rgba(0,0,0,0.15)", cursor: "pointer" } : { elevation: 3 }),
  },
  arrowRight: {
    position: "absolute",
    right: 10,
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web" ? { boxShadow: "0 2px 8px rgba(0,0,0,0.15)", cursor: "pointer" } : { elevation: 3 }),
  },
  mediaCounter: {
    position: "absolute",
    bottom: 10,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  mediaCounterText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  // Magnifier hint icon
  zoomHint: {
    position: "absolute",
    bottom: 10,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.7,
  },

  // Video fallback (non-web)
  videoFallback: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  videoFallbackText: { color: "#aaa", fontSize: 13 },

  thumbs: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 8 },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbVideo: {
    flex: 1,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
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
    color: "#aaa",
    letterSpacing: 2.5,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: { fontWeight: "700", color: "#111", marginBottom: 10, lineHeight: 42 },
  price: { fontSize: 28, fontWeight: "800", color: "#1a1a1a", marginBottom: 16, letterSpacing: -0.5 },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockLabel: { fontSize: 13, fontWeight: "700" },
  stockValueZero: { color: "#9b3c3c" },
  stockLow: { fontSize: 12, color: "#9b3c3c", fontWeight: "600" },
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

  // Delivery message
  deliveryBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f0f0ef",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  deliveryText: {
    flex: 1,
    fontSize: 13,
    color: "#1a1a1a",
    fontWeight: "600",
    lineHeight: 19,
  },

  // Pulseras / Cadenas customization selectors
  customizationBlock: {
    marginBottom: 20,
    gap: 14,
  },
  customField: {
    gap: 8,
  },
  customFieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1.5,
  },
  customPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  customPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    backgroundColor: "#fff",
  },
  customPillActive: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },
  customPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
  },
  customPillTextActive: {
    color: "#fff",
  },
});
