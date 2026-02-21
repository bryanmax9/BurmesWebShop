import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (_) {
    return iso;
  }
};

const statusLabel = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "completed" || v === "shipped") return "Completado";
  if (v === "pending" || v === "in review") return "En revisión";
  return s || "Solicitado";
};

const toImageSource = (img) => {
  if (!img) return null;
  if (typeof img === "number") return img;
  if (typeof img === "string" && /^https?:\/\//i.test(img)) return { uri: img };
  return null;
};

function RequestItemRow({ item }) {
  const imgSrc = toImageSource(item.image);
  return (
    <View style={styles.cardItemRow}>
      <View style={styles.cardItemImageWrap}>
        {imgSrc ? (
          <Image source={imgSrc} style={styles.cardItemImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardItemImagePlaceholder}>
            <Text style={styles.cardItemImagePlaceholderText}>📷</Text>
          </View>
        )}
      </View>
      <View style={styles.cardItemInfo}>
        <Text style={styles.cardItemLine}>
          {(item.quantity || 1) > 1 ? `${item.quantity}× ` : ""}{item.productName || "Artículo"}
        </Text>
        {item.price != null && (
          <Text style={styles.cardItemPrice}>
            ${Number(item.price).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, profileNeedsCompletion, getMyRequests, signOut, deleteUserAccount } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const isGoogleUser = user?.providerData?.some((p) => p?.providerId === "google.com");

  const inReviewRequests = requests.filter(
    (r) => !["completed", "shipped"].includes((r.status || "").toLowerCase())
  );
  const completedRequests = requests.filter((r) =>
    ["completed", "shipped"].includes((r.status || "").toLowerCase())
  );

  useEffect(() => {
    if (!user) {
      navigate("/sign-in", { replace: true });
      return;
    }
    if (profileNeedsCompletion) {
      navigate("/complete-profile", { replace: true });
      return;
    }
    let cancelled = false;
    (getMyRequests?.() ?? Promise.resolve([]))
      .then((requestList) => {
        if (!cancelled) setRequests(requestList || []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, profileNeedsCompletion, getMyRequests, navigate]);

  const runDeleteAccount = async (password) => {
    setDeleting(true);
    try {
      await deleteUserAccount(password);
      setDeleteModalVisible(false);
      setDeletePassword("");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err?.message || "No se pudo eliminar la cuenta.";
      if (typeof alert !== "undefined") alert(msg);
      else Alert.alert("Error", msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteConfirmVisible(true);
  };

  const onConfirmDeleteContinue = () => {
    setDeleteConfirmVisible(false);
    if (isGoogleUser) {
      runDeleteAccount();
    } else {
      setDeleteModalVisible(true);
    }
  };

  if (authLoading || !user || profileNeedsCompletion) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis pedidos</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.storeLink} onPress={() => navigate("/")}>
            <Text style={styles.storeLinkText}>← Volver a la tienda</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {loading ? (
          <ActivityIndicator size="large" color="#1a1a1a" style={styles.loader} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Solicitudes (en revisión)</Text>
              <Text style={styles.sectionSubtitle}>Se convertirán en pedidos completados cuando la tienda los confirme.</Text>
              {inReviewRequests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No hay solicitudes en revisión.</Text>
                  <Text style={styles.emptySubtext}>Añade productos al carrito y envía una solicitud desde la tienda para verlas aquí.</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => navigate("/")}>
                    <Text style={styles.emptyBtnText}>Ir a la tienda</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                inReviewRequests.map((req) => (
                  <View key={req.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardDate}>{formatDate(req.createdAt)}</Text>
                      <View style={[styles.badge, styles.badgePending]}>
                        <Text style={styles.badgeText}>{statusLabel(req.status)}</Text>
                      </View>
                    </View>
                    {(req.requestNumber || req.id) && (
                      <Text style={styles.requestNumber} selectable>Solicitud # {req.requestNumber || req.id}</Text>
                    )}
                    <View style={styles.cardBody}>
                      {(req.items || []).map((item, idx) => (
                        <RequestItemRow key={idx} item={item} />
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pedidos completados</Text>
              <Text style={styles.sectionSubtitle}>Solicitudes que la tienda ha marcado como completadas.</Text>
              {completedRequests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Aún no hay pedidos completados.</Text>
                  <Text style={styles.emptySubtext}>Cuando la tienda confirme tus solicitudes, aparecerán aquí.</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => navigate("/")}>
                    <Text style={styles.emptyBtnText}>Ir a la tienda</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                completedRequests.map((req) => (
                  <View key={req.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardDate}>{formatDate(req.createdAt)}</Text>
                      <View style={[styles.badge, styles.badgeDone]}>
                        <Text style={styles.badgeText}>{statusLabel(req.status)}</Text>
                      </View>
                    </View>
                    {(req.requestNumber || req.id) && (
                      <Text style={styles.requestNumber} selectable>Solicitud # {req.requestNumber || req.id}</Text>
                    )}
                    <View style={styles.cardBody}>
                      {(req.items || []).map((item, idx) => (
                        <RequestItemRow key={idx} item={item} />
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.dangerZone}>
              <Text style={styles.dangerZoneTitle}>Cuenta</Text>
              <Text style={styles.dangerZoneSubtitle}>Eliminar permanentemente tu cuenta y todos los datos. No se puede deshacer.</Text>
              <TouchableOpacity
                style={[styles.deleteAccountBtn, deleting && styles.deleteAccountBtnDisabled]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteAccountBtnText}>Eliminar cuenta</Text>
                )}
              </TouchableOpacity>
            </View>

            <Modal visible={deleteConfirmVisible} transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setDeleteConfirmVisible(false)}>
                <Pressable style={styles.confirmModalContent} onPress={(e) => e.stopPropagation()}>
                  <Text style={styles.confirmModalTitle}>¿Eliminar cuenta?</Text>
                  <Text style={styles.confirmModalSubtitle}>
                    Se eliminará permanentemente tu cuenta y datos. Tendrás que registrarte de nuevo para usar la tienda. No se puede deshacer.
                  </Text>
                  <View style={styles.confirmModalActions}>
                    <TouchableOpacity style={styles.confirmModalCancel} onPress={() => setDeleteConfirmVisible(false)}>
                      <Text style={styles.confirmModalCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmModalContinue} onPress={onConfirmDeleteContinue} disabled={deleting}>
                      <Text style={styles.confirmModalContinueText}>Continuar</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>

            <Modal
              visible={deleteModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setDeleteModalVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setDeleteModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalContentWrap}>
                  <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.modalTitle}>Confirmar con contraseña</Text>
                    <Text style={styles.modalSubtitle}>Ingresa tu contraseña para eliminar permanentemente tu cuenta.</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Contraseña"
                      placeholderTextColor="#999"
                      value={deletePassword}
                      onChangeText={setDeletePassword}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!deleting}
                    />
                    <View style={styles.modalActions}>
                      <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setDeleteModalVisible(false); setDeletePassword(""); }} disabled={deleting}>
                        <Text style={styles.modalCancelText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalConfirmBtn, deleting && styles.modalConfirmBtnDisabled]}
                        onPress={() => runDeleteAccount(deletePassword)}
                        disabled={deleting || !deletePassword.trim()}
                      >
                        {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalConfirmText}>Eliminar cuenta</Text>}
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                </KeyboardAvoidingView>
              </Pressable>
            </Modal>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f0" },
  header: {
    backgroundColor: "#1a1a1a",
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  email: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 6,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 16,
  },
  signOutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
  },
  signOutText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  storeLink: {},
  storeLinkText: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "500" },
  content: { flex: 1 },
  contentInner: { padding: 24, paddingBottom: 48 },
  loader: { marginTop: 48 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cardDate: { fontSize: 13, color: "#666" },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  badgePending: { backgroundColor: "#fff3e0" },
  badgeRequested: { backgroundColor: "#e3f2fd" },
  badgeDone: { backgroundColor: "#e8f5e9" },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#1a1a1a", textTransform: "uppercase" },
  requestNumber: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  cardBody: {},
  cardItemRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
    alignItems: "center",
  },
  cardItemImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
  },
  cardItemImage: {
    width: "100%",
    height: "100%",
  },
  cardItemImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8e6e2",
  },
  cardItemImagePlaceholderText: { fontSize: 22 },
  cardItemInfo: { flex: 1 },
  cardItemLine: {
    fontSize: 15,
    color: "#1a1a1a",
    fontWeight: "500",
    marginBottom: 2,
  },
  cardItemPrice: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 22, marginBottom: 18 },
  emptyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
  },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  dangerZone: {
    marginTop: 32,
    padding: 24,
    backgroundColor: "#fafafa",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    maxWidth: 420,
  },
  dangerZoneTitle: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 6, letterSpacing: 0.3 },
  dangerZoneSubtitle: { fontSize: 13, color: "#666", lineHeight: 20, marginBottom: 18 },
  deleteAccountBtn: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b71c1c",
    alignSelf: "flex-start",
  },
  deleteAccountBtnDisabled: { opacity: 0.6 },
  deleteAccountBtnText: { color: "#b71c1c", fontWeight: "600", fontSize: 14 },
  confirmModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    margin: 24,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmModalTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  confirmModalSubtitle: { fontSize: 15, color: "#555", lineHeight: 22, marginBottom: 24 },
  confirmModalActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  confirmModalCancel: { paddingVertical: 12, paddingHorizontal: 20 },
  confirmModalCancelText: { fontSize: 15, color: "#666", fontWeight: "600" },
  confirmModalContinue: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: "#b71c1c", borderRadius: 10 },
  confirmModalContinueText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContentWrap: { width: "100%", maxWidth: 360 },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { fontSize: 15, color: "#666", fontWeight: "600" },
  modalConfirmBtn: {
    backgroundColor: "#c62828",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalConfirmBtnDisabled: { opacity: 0.7 },
  modalConfirmText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
