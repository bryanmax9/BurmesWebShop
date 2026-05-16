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
import useSEO from "../hooks/useSEO";
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

const CATEGORY_LABELS = {
  pendants: "Dijes",
  chains: "Cadenas",
  rings: "Anillos",
  bracelets: "Pulseras",
  aretes: "Aretes",
  relojes: "Relojes",
};

const INV_STATUS_CYCLE = { available: "sold", sold: "reserved", reserved: "available" };
const INV_STATUS_LABELS = { available: "Disponible", sold: "Vendido", reserved: "Reservado" };
const INV_STATUS_COLORS = { available: "#2d7a4a", sold: "#c0392b", reserved: "#b8620a" };
const INV_STATUS_BG = { available: "#e8f5ee", sold: "#fde8e6", reserved: "#fef3e6" };

function ProductFormModal({ product, visible, onClose, onSave, onDelete }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [sku, setSku] = useState("");
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
      setSku(product.sku || "");
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
      setSku("");
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
              Alert.alert("Éxito", msg);
            }
          } catch (err) {
            const msg = err?.message || "No se pudo subir la imagen a Google Drive";
            setUploadNotice({ type: "error", text: `Upload failed for image ${slotIndex + 1}: ${msg}` });
            if (Platform.OS === "web" && typeof window !== "undefined" && window.alert) {
              window.alert(`Error al subir: ${msg}`);
            } else {
              Alert.alert("Error al subir", msg);
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
      Alert.alert("Info", "La subida de archivos solo está disponible en la web. Usa la versión web.");
    }
  };


  const SKU_REGEX = /^[A-Z]{3}-\d{5}$/;

  const showError = (msg) => {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.alert) {
      window.alert(msg);
    } else {
      Alert.alert("Error", msg);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError("El nombre del producto es obligatorio.");
      return;
    }
    if (!categoryId) {
      showError("Selecciona una categoría.");
      return;
    }
    const skuValue = sku.trim().toUpperCase();
    if (!skuValue) {
      showError("El SKU es obligatorio.");
      return;
    }
    if (!SKU_REGEX.test(skuValue)) {
      showError("El SKU debe tener el formato AAA-12345 (3 letras mayúsculas, guión, 5 dígitos).");
      return;
    }

    setSaving(true);
    try {
      const imageUrls = images.map((x) => x?.imageUrl).filter(Boolean);
      const driveFileIds = images.map((x) => x?.driveFileId).filter(Boolean);
      if (imageUrls.length === 0) {
        showError("Sube al menos 1 imagen.");
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
        sku: skuValue,
      };

      if (product) {
        await onSave(product.id, productData);
      } else {
        await onSave(null, productData);
      }
      onClose();
    } catch (err) {
      showError(err.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // On web, use a simple native confirm because React Native's Alert
    // can be flaky in some browsers.
    if (Platform.OS === "web" && typeof window !== "undefined" && window.confirm) {
      const ok = window.confirm(
        "¿Eliminar este producto? También se eliminarán sus imágenes de Google Drive."
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
        window.alert(err?.message || "No se pudo eliminar el producto.");
      }
      return;
    }

    // Native / non-web: use React Native Alert
    Alert.alert(
      "Eliminar producto",
      "¿Seguro que quieres eliminar este producto? También se eliminarán las imágenes de Google Drive.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
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
              Alert.alert("Error", err.message || "No se pudo eliminar el producto.");
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
            <Text style={styles.formModalTitle}>{product ? "Editar producto" : "Crear producto"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.formModalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Nombre del producto *</Text>
              <TextInput
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g., FUTURE KING PENDANT"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Marca</Text>
              <View style={styles.brandPill}>
                <Text style={styles.brandPillText}>{DEFAULT_BRAND}</Text>
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>SKU *</Text>
              <TextInput
                style={[styles.formInput, styles.skuInput]}
                value={sku}
                onChangeText={(v) => setSku(v.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                placeholder="AAA-12345"
                placeholderTextColor="#bbb"
                maxLength={9}
              />
              <Text style={styles.skuHint}>Formato: 3 letras + guión + 5 dígitos (ej. ARE-78445)</Text>
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Categoría *</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setCategoryPickerOpen(true)}
                disabled={saving || uploading}
              >
                <Text style={styles.selectInputText}>
                  {(() => {
                    const c = (categoriesData || []).find((x) => (x?._id?.$oid || x?._id) === categoryId);
                    return c ? (c.name === "pendants" ? "Dijes" : c.name === "chains" ? "Cadenas" : c.name === "rings" ? "Anillos" : c.name === "bracelets" ? "Pulseras" : c.name) : "Selecciona una categoría…";
                  })()}
                </Text>
                <Text style={styles.selectChevron}>▾</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Descripción</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción del producto..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.formLabel}>Precio</Text>
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
              <Text style={styles.formLabel}>Imágenes del producto (1–3) *</Text>
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
                  <Text style={styles.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
              )}
              <View style={styles.formActionsRight}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, (saving || uploading) && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Guardar</Text>
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
              <Text style={styles.categoryModalTitle}>Seleccionar categoría</Text>
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
                      {c.name === "pendants" ? "Dijes" : c.name === "chains" ? "Cadenas" : c.name === "rings" ? "Anillos" : c.name === "bracelets" ? "Pulseras" : c.name}
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
  const { user, isAdmin, signOut, getProducts, createProduct, updateProduct, updateInventory, deleteProduct } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Inventario tab state
  const [activeTab, setActiveTab] = useState("productos");
  const [invSearch, setInvSearch] = useState("");
  const [invCategory, setInvCategory] = useState("all");
  const [localNotes, setLocalNotes] = useState({});
  const [savingInv, setSavingInv] = useState({});

  useSEO({
    title: "Gestión de Productos",
    description: "Crea y gestiona el inventario de Burmes & Co.",
  });

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
    const sku = (p.sku || "").toLowerCase();
    return name.includes(q) || brand.includes(q) || sku.includes(q);
  });

  const getCategoryName = (p) => {
    const cat = (categoriesData || []).find((c) => {
      const oid = c?._id?.$oid;
      return p.category === oid || p.category === c.name;
    });
    return cat ? (CATEGORY_LABELS[cat.name] || cat.name) : "—";
  };

  const filteredInventory = products.filter((p) => {
    if (invCategory !== "all") {
      const cat = (categoriesData || []).find((c) => c.name === invCategory);
      const oid = cat?._id?.$oid;
      if (p.category !== invCategory && p.category !== oid) return false;
    }
    const q = invSearch.trim().toLowerCase();
    if (!q) return true;
    return (p.name || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q);
  });

  const handleStatusToggle = async (product) => {
    const current = product.inventoryStatus || "available";
    const next = INV_STATUS_CYCLE[current] || "available";
    setSavingInv((s) => ({ ...s, [product.id]: true }));
    try {
      const note = localNotes[product.id] ?? (product.inventoryNote || "");
      await updateInventory(product.id, { inventoryStatus: next, inventoryNote: note });
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, inventoryStatus: next } : p)
      );
    } catch (err) {
      window.alert(err.message || "No se pudo actualizar el estado.");
    } finally {
      setSavingInv((s) => ({ ...s, [product.id]: false }));
    }
  };

  const handleSaveNote = async (product) => {
    const note = localNotes[product.id] ?? (product.inventoryNote || "");
    const status = product.inventoryStatus || "available";
    setSavingInv((s) => ({ ...s, [product.id]: true }));
    try {
      await updateInventory(product.id, { inventoryStatus: status, inventoryNote: note });
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, inventoryNote: note } : p)
      );
    } catch (err) {
      window.alert(err.message || "No se pudo guardar la nota.");
    } finally {
      setSavingInv((s) => ({ ...s, [product.id]: false }));
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Administración</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.storeLink} onPress={() => navigate("/")}>
              <Text style={styles.storeLinkText}>← Tienda</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
              <Text style={styles.signOutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.email}>{user?.email}</Text>

        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "productos" && styles.tabBtnActive]}
            onPress={() => setActiveTab("productos")}
          >
            <Text style={[styles.tabBtnText, activeTab === "productos" && styles.tabBtnTextActive]}>
              Productos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "inventario" && styles.tabBtnActive]}
            onPress={() => setActiveTab("inventario")}
          >
            <Text style={[styles.tabBtnText, activeTab === "inventario" && styles.tabBtnTextActive]}>
              Inventario
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── PRODUCTOS TAB ── */}
      {activeTab === "productos" && (
        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Productos</Text>
            <Text style={styles.heroSubtitle}>
              Crea y gestiona los productos de la tienda. Las imágenes se guardan en Google Drive.
            </Text>
          </View>

          <View style={styles.actionsBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
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
              <Text style={styles.createBtnText}>+ Crear producto</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#1a1a1a" />
              <Text style={styles.loaderText}>Cargando productos…</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {products.length === 0 ? "Aún no hay productos" : "No se encontraron productos"}
              </Text>
              <Text style={styles.emptySubtext}>
                {products.length === 0
                  ? "Crea tu primer producto para empezar a vender."
                  : "Prueba con otro término de búsqueda."}
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
                          <Text style={styles.featuredBadgeText}>Más popular</Text>
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
                      {product.sku && (
                        <View style={styles.skuBadge}>
                          <Text style={styles.skuBadgeText}>{product.sku}</Text>
                        </View>
                      )}
                      <Text style={styles.productStock}>
                        Stock: {product.countInStock ?? 0}
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
      )}

      {/* ── INVENTARIO TAB ── */}
      {activeTab === "inventario" && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Inventario</Text>
            <Text style={styles.heroSubtitle}>
              Registra el estado de cada pieza. Busca por SKU o nombre y filtra por categoría.
            </Text>
          </View>

          {/* Search + category filters */}
          <TextInput
            style={[styles.searchInput, { marginBottom: 12 }]}
            placeholder="Buscar por SKU o nombre..."
            placeholderTextColor="#8a8a8a"
            value={invSearch}
            onChangeText={setInvSearch}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsRow}>
            {[{ name: "all", label: "Todas" }, ...(categoriesData || []).map((c) => ({ name: c.name, label: CATEGORY_LABELS[c.name] || c.name }))].map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={[styles.catChip, invCategory === cat.name && styles.catChipActive]}
                onPress={() => setInvCategory(cat.name)}
              >
                <Text style={[styles.catChipText, invCategory === cat.name && styles.catChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#1a1a1a" />
              <Text style={styles.loaderText}>Cargando inventario…</Text>
            </View>
          ) : filteredInventory.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Sin resultados</Text>
              <Text style={styles.emptySubtext}>Prueba con otro filtro o término.</Text>
            </View>
          ) : (
            <View style={styles.invList}>
              {filteredInventory.map((product) => {
                const coverUrl = product.image || (Array.isArray(product.images) && product.images[0]) || null;
                const imgSrc = toImageSource(coverUrl);
                const status = product.inventoryStatus || "available";
                const isSaving = !!savingInv[product.id];
                const noteDraft = localNotes[product.id] ?? (product.inventoryNote || "");
                const noteChanged = noteDraft !== (product.inventoryNote || "");
                return (
                  <View key={product.id} style={styles.invRow}>
                    {/* Thumbnail */}
                    <View style={styles.invThumb}>
                      {imgSrc ? (
                        <Image source={imgSrc} style={styles.invThumbImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.invThumbPlaceholder}>
                          <Text style={{ fontSize: 22 }}>📷</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.invInfo}>
                      <View style={styles.invInfoTop}>
                        {product.sku ? (
                          <View style={styles.skuBadge}>
                            <Text style={styles.skuBadgeText}>{product.sku}</Text>
                          </View>
                        ) : (
                          <Text style={styles.invNoSku}>Sin SKU</Text>
                        )}
                        <Text style={styles.invCatLabel}>{getCategoryName(product)}</Text>
                      </View>
                      <Text style={styles.invProductName} numberOfLines={1}>{product.name || "—"}</Text>
                      {product.price != null && (
                        <Text style={styles.invPrice}>
                          ${Number(product.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      )}

                      {/* Status toggle */}
                      <TouchableOpacity
                        style={[styles.invStatusBtn, { backgroundColor: INV_STATUS_BG[status] }]}
                        onPress={() => handleStatusToggle(product)}
                        disabled={isSaving}
                      >
                        <View style={[styles.invStatusDot, { backgroundColor: INV_STATUS_COLORS[status] }]} />
                        <Text style={[styles.invStatusText, { color: INV_STATUS_COLORS[status] }]}>
                          {INV_STATUS_LABELS[status]}
                        </Text>
                        <Text style={styles.invStatusArrow}>↻</Text>
                      </TouchableOpacity>

                      {/* Note field */}
                      <View style={styles.invNoteRow}>
                        <TextInput
                          style={styles.invNoteInput}
                          placeholder="Agregar nota (ej. vendido a cliente X, en reparación…)"
                          placeholderTextColor="#bbb"
                          value={noteDraft}
                          onChangeText={(v) => setLocalNotes((n) => ({ ...n, [product.id]: v }))}
                          multiline
                        />
                        {noteChanged && (
                          <TouchableOpacity
                            style={styles.invSaveNoteBtn}
                            onPress={() => handleSaveNote(product)}
                            disabled={isSaving}
                          >
                            <Text style={styles.invSaveNoteBtnText}>
                              {isSaving ? "…" : "Guardar"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {product.inventoryUpdatedAt && (
                        <Text style={styles.invUpdatedAt}>
                          Actualizado: {formatDate(product.inventoryUpdatedAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

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
  skuBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0ede8",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e0ddd8",
  },
  skuBadgeText: { fontSize: 11, fontWeight: "700", color: "#5a5550", letterSpacing: 0.8, fontFamily: Platform.OS === "web" ? "monospace" : "Courier" },
  skuInput: { fontFamily: Platform.OS === "web" ? "monospace" : "Courier", letterSpacing: 1.2, fontWeight: "700", textTransform: "uppercase" },
  skuHint: { fontSize: 11, color: "#aaa", marginTop: 5 },
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
