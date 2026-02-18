import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Image,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  uploadImageToDrive, 
  deleteFileFromDrive,
  extractDriveFileId, 
  getDriveImageUrl 
} from "../services/googleDrive";

const categoriesData = require("../assets/data/categories.json");

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (_) {
    return iso;
  }
};

const toImageSource = (img) => {
  if (!img) return null;
  if (typeof img === "number") return img;
  if (typeof img === "string" && /^https?:\/\//i.test(img)) return { uri: img };
  return null;
};

const DEFAULT_BRAND = "Burmes & Co";

function ProductFormModal({ product, visible, onClose, onSave, onDelete }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [countInStock, setCountInStock] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  // Up to 3 images
  const [images, setImages] = useState([null, null, null]); // each: { previewUrl, imageUrl, driveFileId }
  const [activeUploadIndex, setActiveUploadIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadNotice, setUploadNotice] = useState(null); // { type: "success" | "error", text: string }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setBrand(product.brand || DEFAULT_BRAND);
      setDescription(product.description || "");
      setPrice(product.price != null ? String(product.price) : "");
      setCountInStock(product.countInStock != null ? String(product.countInStock) : "");
      setIsFeatured(product.isFeatured === true);
      setCategoryId(product.category || "");

      const urls = Array.isArray(product.images) && product.images.length
        ? product.images
        : (product.image ? [product.image] : []);
      const ids = Array.isArray(product.driveFileIds) && product.driveFileIds.length
        ? product.driveFileIds
        : (product.driveFileId ? [product.driveFileId] : []);

      const next = [0, 1, 2].map((idx) => {
        const imageUrl = urls[idx] || null;
        const driveFileId = ids[idx] || (imageUrl ? extractDriveFileId(imageUrl) : null);
        return imageUrl
          ? { previewUrl: imageUrl, imageUrl, driveFileId }
          : null;
      });
      setImages(next);
    } else {
      setName("");
      setBrand(DEFAULT_BRAND);
      setDescription("");
      setPrice("");
      setCountInStock("");
      setIsFeatured(false);
      setCategoryId("");
      setImages([null, null, null]);
    }
    setCategoryPickerOpen(false);
    setActiveUploadIndex(null);
    setUploading(false);
    setUploadProgress(0);
    setUploadNotice(null);
  }, [product, visible]);

  const pickAndUploadImage = async (slotIndex) => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          // Show preview
          const reader = new FileReader();
          reader.onloadend = () => {
            const previewUrl = reader.result;
            setImages((prev) => {
              const next = [...prev];
              next[slotIndex] = { ...(next[slotIndex] || {}), previewUrl };
              return next;
            });
          };
          reader.readAsDataURL(file);
          
          // Upload to Google Drive
          setUploading(true);
          setActiveUploadIndex(slotIndex);
          setUploadNotice(null);
          try {
            const result = await uploadImageToDrive(file, (progress) => {
              setUploadProgress(progress);
            });
            setImages((prev) => {
              const next = [...prev];
              next[slotIndex] = {
                previewUrl: result.imageUrl,
                imageUrl: result.imageUrl,
                driveFileId: result.fileId,
              };
              return next;
            });
            const msg = `Image ${slotIndex + 1} uploaded successfully.`;
            setUploadNotice({ type: "success", text: msg });
            if (Platform.OS === "web" && typeof window !== "undefined" && window.alert) {
              // Alert.alert is inconsistent on web
              window.alert(msg);
            } else {
              Alert.alert("Success", msg);
            }
          } catch (err) {
            const msg = err?.message || "Could not upload image to Google Drive";
            setUploadNotice({ type: "error", text: `Upload failed for image ${slotIndex + 1}: ${msg}` });
            if (Platform.OS === "web" && typeof window !== "undefined" && window.alert) {
              window.alert(`Upload failed: ${msg}`);
            } else {
              Alert.alert("Upload Failed", msg);
            }
            setImages((prev) => {
              const next = [...prev];
              next[slotIndex] = null;
              return next;
            });
          } finally {
            setUploading(false);
            setActiveUploadIndex(null);
            setUploadProgress(0);
          }
        }
      };
      input.click();
    } else {
      Alert.alert("Info", "File upload is only available on web. Please use the web version.");
    }
  };


  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Product name is required.");
      return;
    }
    if (!categoryId) {
      Alert.alert("Error", "Please select a category.");
      return;
    }
    
    setSaving(true);
    try {
      const imageUrls = images.map((x) => x?.imageUrl).filter(Boolean);
      const driveFileIds = images.map((x) => x?.driveFileId).filter(Boolean);
      if (imageUrls.length === 0) {
        Alert.alert("Error", "Please upload at least 1 image.");
        setSaving(false);
        return;
      }

      const productData = {
        name: name.trim(),
        brand: DEFAULT_BRAND,
        description: description.trim() || null,
        price: price.trim() ? Number(price.trim()) : null,
        countInStock: countInStock.trim() ? Number(countInStock.trim()) : 0,
        isFeatured,
        category: categoryId,
        image: imageUrls[0],
        images: imageUrls.slice(0, 3),
        driveFileId: driveFileIds[0] || null,
        driveFileIds: driveFileIds.slice(0, 3),
      };
      
      if (product) {
        await onSave(product.id, productData);
      } else {
        await onSave(null, productData);
      }
      onClose();
    } catch (err) {
      Alert.alert("Error", err.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // On web, use a simple native confirm because React Native's Alert
    // can be flaky in some browsers.
    if (Platform.OS === "web" && typeof window !== "undefined" && window.confirm) {
      const ok = window.confirm(
        "Delete this product? This will also delete its images from Google Drive."
      );
      if (!ok) return;
      try {
        const ids = Array.isArray(product.driveFileIds) && product.driveFileIds.length
          ? product.driveFileIds
          : (product.driveFileId ? [product.driveFileId] : []);
        for (const id of ids) {
          try {
            await deleteFileFromDrive(id);
          } catch (err) {
            console.warn("Could not delete from Google Drive:", err);
          }
        }
        await onDelete(product.id);
        onClose();
      } catch (err) {
        window.alert(err?.message || "Could not delete product.");
      }
      return;
    }

    // Native / non-web: use React Native Alert
    Alert.alert(
      "Delete product",
      "Are you sure you want to delete this product? This will also delete the images from Google Drive.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const ids = Array.isArray(product.driveFileIds) && product.driveFileIds.length
                ? product.driveFileIds
                : (product.driveFileId ? [product.driveFileId] : []);
              for (const id of ids) {
                try {
                  await deleteFileFromDrive(id);
                } catch (err) {
                  console.warn("Could not delete from Google Drive:", err);
                }
              }
              await onDelete(product.id);
              onClose();
            } catch (err) {
              Alert.alert("Error", err.message || "Could not delete product.");
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.formModalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.formModalHeader}>
            <Text style={styles.formModalTitle}>{product ? "Edit product" : "Create product"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.formModalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Product name *</Text>
              <TextInput
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g., FUTURE KING PENDANT"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Brand</Text>
              <View style={styles.brandPill}>
                <Text style={styles.brandPillText}>{DEFAULT_BRAND}</Text>
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Category *</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setCategoryPickerOpen(true)}
                disabled={saving || uploading}
              >
                <Text style={styles.selectInputText}>
                  {(() => {
                    const c = (categoriesData || []).find((x) => (x?._id?.$oid || x?._id) === categoryId);
                    return c ? c.name : "Select a category…";
                  })()}
                </Text>
                <Text style={styles.selectChevron}>▾</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Product description..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.formLabel}>Price</Text>
                <TextInput
                  style={styles.formInput}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.formLabel}>Stock</Text>
                <TextInput
                  style={styles.formInput}
                  value={countInStock}
                  onChangeText={setCountInStock}
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Product images (1–3) *</Text>
              <Text style={styles.formHint}>
                Upload at least 1 image (you can add up to 3). The first image will be used as the cover in the product grid.
              </Text>
              <View style={styles.imageSlotsRow}>
                {[0, 1, 2].map((idx) => {
                  const slot = images[idx];
                  const preview = slot?.previewUrl || slot?.imageUrl;
                  const isActive = uploading && activeUploadIndex === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.imageSlot}
                      onPress={() => pickAndUploadImage(idx)}
                      disabled={saving || uploading}
                      activeOpacity={0.85}
                    >
                      <View style={styles.slotIndexBadge}>
                        <Text style={styles.slotIndexBadgeText}>{idx + 1}</Text>
                      </View>
                      {preview ? (
                        <Image
                          source={toImageSource(preview)}
                          style={styles.imageSlotImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.imageSlotPlaceholder}>
                          <Text style={styles.imageSlotPlus}>+</Text>
                          <Text style={styles.imageSlotLabel}>Image {idx + 1}</Text>
                        </View>
                      )}
                      {!!slot?.driveFileId && !isActive && (
                        <View style={styles.uploadedBadge}>
                          <Text style={styles.uploadedBadgeText}>Uploaded ✓</Text>
                        </View>
                      )}
                      {isActive && (
                        <View style={styles.imageSlotOverlay}>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={styles.imageSlotOverlayText}>
                            {Math.round(uploadProgress)}%
                          </Text>
                        </View>
                      )}
                      {idx === 0 && (
                        <View style={styles.coverBadge}>
                          <Text style={styles.coverBadgeText}>Cover</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!!uploadNotice && (
                <View style={[styles.uploadNotice, uploadNotice.type === "error" && styles.uploadNoticeError]}>
                  <Text style={[styles.uploadNoticeText, uploadNotice.type === "error" && styles.uploadNoticeTextError]}>
                    {uploadNotice.text}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.formField}>
              <TouchableOpacity
                style={[styles.checkbox, isFeatured && styles.checkboxChecked]}
                onPress={() => setIsFeatured(!isFeatured)}
              >
                <Text style={styles.checkboxText}>Show in “Most popular”</Text>
                {isFeatured && <Text style={styles.checkboxCheck}>✓</Text>}
              </TouchableOpacity>
            </View>
            <View style={styles.formActions}>
              {product && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDelete}
                  disabled={saving}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
              <View style={styles.formActionsRight}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, (saving || uploading) && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
      <Modal
        visible={categoryPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryPickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryPickerOpen(false)}>
          <Pressable style={styles.categoryModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Select category</Text>
              <TouchableOpacity onPress={() => setCategoryPickerOpen(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
              {(categoriesData || []).map((c) => {
                const id = c?._id?.$oid || c?._id;
                const isSelected = id === categoryId;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.categoryRow, isSelected && styles.categoryRowSelected]}
                    onPress={() => {
                      setCategoryId(id);
                      setCategoryPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.categoryRowText, isSelected && styles.categoryRowTextSelected]}>
                      {c.name}
                    </Text>
                    {isSelected && <Text style={styles.categoryRowCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

export default function AdminListings() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, getProducts, createProduct, updateProduct, deleteProduct } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/admin/sign-in", { replace: true });
      return;
    }
    if (!isAdmin) {
      signOut();
      navigate("/admin/sign-in", { replace: true });
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (!user || !isAdmin || !getProducts) return;
    let cancelled = false;
    getProducts()
      .then((list) => {
        if (!cancelled) setProducts(list || []);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load products:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, isAdmin, getProducts]);

  const handleSave = async (productId, productData) => {
    if (productId) {
      await updateProduct(productId, productData);
    } else {
      await createProduct(productData);
    }
    const list = await getProducts();
    setProducts(list || []);
  };

  const handleDelete = async (productId) => {
    await deleteProduct(productId);
    const list = await getProducts();
    setProducts(list || []);
  };

  const filteredProducts = products.filter((p) => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return true;
    const name = (p.name || "").toLowerCase();
    const brand = (p.brand || "").toLowerCase();
    return name.includes(q) || brand.includes(q);
  });

  if (!user || !isAdmin) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Admin</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.storeLink} onPress={() => navigate("/")}>
              <Text style={styles.storeLinkText}>← Store</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Product listings</Text>
          <Text style={styles.heroSubtitle}>
            Create and manage products for the store. Images are stored in Google Drive.
          </Text>
        </View>

        <View style={styles.actionsBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#8a8a8a"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => {
              setEditingProduct(null);
              setFormVisible(true);
            }}
          >
            <Text style={styles.createBtnText}>+ Create product</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#1a1a1a" />
            <Text style={styles.loaderText}>Loading products…</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {products.length === 0 ? "No products yet" : "No products found"}
            </Text>
            <Text style={styles.emptySubtext}>
              {products.length === 0
                ? "Create your first product to start selling."
                : "Try a different search term."}
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => {
              const coverUrl =
                product.image ||
                (Array.isArray(product.images) && product.images[0]) ||
                null;
              const imgSrc = toImageSource(coverUrl);
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => {
                    setEditingProduct(product);
                    setFormVisible(true);
                  }}
                >
                  <View style={styles.productImageContainer}>
                    {imgSrc ? (
                      <Image source={imgSrc} style={styles.productImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Text style={styles.productImagePlaceholderText}>📷</Text>
                      </View>
                    )}
                    {product.isFeatured && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>Most popular</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name || "—"}
                    </Text>
                    {product.brand && (
                      <Text style={styles.productBrand} numberOfLines={1}>
                        {product.brand}
                      </Text>
                    )}
                    {product.price != null && (
                      <Text style={styles.productPrice}>
                        ${Number(product.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    )}
                    <Text style={styles.productStock}>
                      Stock: {product.countInStock || 0}
                    </Text>
                    <Text style={styles.productDate}>
                      {formatDate(product.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <ProductFormModal
        product={editingProduct}
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f7f5" },
  header: {
    backgroundColor: "#1c1c1c",
    paddingTop: Platform.OS === "web" ? 32 : 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  storeLink: {},
  storeLinkText: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "500" },
  signOutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
  },
  signOutText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  email: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 10 },
  content: { flex: 1, padding: 24 },
  hero: { marginBottom: 24 },
  heroTitle: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", letterSpacing: 0.3, marginBottom: 6 },
  heroSubtitle: { fontSize: 15, color: "#5c5c5c", lineHeight: 22 },
  actionsBar: { flexDirection: "row", gap: 12, marginBottom: 24 },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#e0ddd8",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  createBtn: {
    paddingHorizontal: 20,
    height: 48,
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  loaderWrap: { alignItems: "center", paddingVertical: 48 },
  loaderText: { marginTop: 12, fontSize: 14, color: "#666" },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e6e2",
  },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#4a4a4a", marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: "#7a7a7a", textAlign: "center" },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e6e2",
    width: "100%",
    maxWidth: 280,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  productImageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  productImage: { width: "100%", height: "100%" },
  productImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8e6e2",
  },
  productImagePlaceholderText: { fontSize: 48 },
  featuredBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#1c1c1c",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff", textTransform: "uppercase" },
  productInfo: { padding: 16 },
  productName: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 4 },
  productBrand: { fontSize: 13, color: "#666", marginBottom: 6 },
  productPrice: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  productStock: { fontSize: 12, color: "#999", marginBottom: 2 },
  productDate: { fontSize: 11, color: "#bbb" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  formModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 600,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  formModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  formModalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  modalCloseBtn: { padding: 4 },
  modalCloseText: { fontSize: 24, color: "#666" },
  formModalScroll: { maxHeight: 600 },
  formField: { marginBottom: 20, paddingHorizontal: 20 },
  formLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 8 },
  formHint: { fontSize: 12, color: "#666", marginBottom: 8, lineHeight: 16 },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  formTextArea: { minHeight: 100, textAlignVertical: "top" },
  formRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 20 },
  brandPill: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f7f7f7",
  },
  brandPillText: { fontSize: 14, color: "#333", fontWeight: "700" },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  selectInputText: { fontSize: 15, color: "#333", fontWeight: "500", textTransform: "capitalize" },
  selectChevron: { fontSize: 16, color: "#777", marginLeft: 12 },
  imageUploadBtn: { marginTop: 8 },
  imageSlotsRow: { flexDirection: "row", gap: 12, paddingTop: 6, flexWrap: "wrap" },
  imageSlot: {
    width: 120,
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e0dc",
    backgroundColor: "#fafafa",
    position: "relative",
  },
  imageSlotImg: { width: "100%", height: "100%" },
  imageSlotPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  imageSlotPlus: { fontSize: 28, color: "#888", marginBottom: 2 },
  imageSlotLabel: { fontSize: 12, color: "#666", fontWeight: "700" },
  imageSlotOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageSlotOverlayText: { color: "#fff", fontSize: 12, fontWeight: "800", marginTop: 6 },
  slotIndexBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 3,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  slotIndexBadgeText: { fontSize: 11, fontWeight: "900", color: "#1a1a1a" },
  uploadedBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  uploadedBadgeText: { fontSize: 10, fontWeight: "900", color: "#1a1a1a", textTransform: "uppercase" },
  coverBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(28,28,28,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coverBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  imagePreviewImg: { width: "100%", height: "100%" },
  imagePreviewHint: { 
    fontSize: 12, 
    color: "#666", 
    marginTop: 8, 
    textAlign: "center",
    fontStyle: "italic",
  },
  imagePreviewOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 12,
    alignItems: "center",
  },
  imagePreviewText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  imageUploadPlaceholder: {
    width: "100%",
    height: 200,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  imageUploadIcon: { fontSize: 48, marginBottom: 8 },
  imageUploadText: { fontSize: 14, color: "#666", fontWeight: "500" },
  uploadProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  uploadProgressText: { fontSize: 13, color: "#666" },
  uploadNotice: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(18, 122, 84, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(18, 122, 84, 0.18)",
  },
  uploadNoticeError: {
    backgroundColor: "rgba(155, 60, 60, 0.08)",
    borderColor: "rgba(155, 60, 60, 0.18)",
  },
  uploadNoticeText: { fontSize: 12, fontWeight: "700", color: "#127a54", lineHeight: 16 },
  uploadNoticeTextError: { color: "#9b3c3c" },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  checkboxChecked: { borderColor: "#1c1c1c", backgroundColor: "#f5f5f5" },
  checkboxText: { fontSize: 15, color: "#333" },
  checkboxCheck: { fontSize: 18, color: "#1c1c1c", fontWeight: "700" },
  formActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  formActionsRight: { flexDirection: "row", gap: 12 },
  deleteBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c62828",
  },
  deleteBtnText: { color: "#c62828", fontWeight: "600", fontSize: 15 },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelBtnText: { color: "#666", fontWeight: "600", fontSize: 15 },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#1c1c1c",
    borderRadius: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },

  categoryModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 520,
    maxHeight: "80%",
    overflow: "hidden",
  },
  categoryModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryModalTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  categoryList: { padding: 8 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  categoryRowSelected: { backgroundColor: "#f3f3f3" },
  categoryRowText: { fontSize: 15, color: "#222", fontWeight: "700", textTransform: "capitalize" },
  categoryRowTextSelected: { color: "#000" },
  categoryRowCheck: { fontSize: 16, color: "#111", fontWeight: "900" },
});
