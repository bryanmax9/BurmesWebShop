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
} from "react-native";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    return iso;
  }
};

const formatDateShort = (iso) => {
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

const statusLabel = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "completed" || v === "shipped") return "Completed";
  if (v === "pending" || v === "in review") return "In review";
  return s || "Pending";
};

const toImageSource = (img) => {
  if (!img) return null;
  if (typeof img === "number") return img;
  if (typeof img === "string" && /^https?:\/\//i.test(img)) return { uri: img };
  return null;
};

function ItemDetailModal({ item, visible, onClose }) {
  if (!item) return null;
  const imgSrc = toImageSource(item.image);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.itemModalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.itemModalHeader}>
            <Text style={styles.itemModalTitle}>Item details</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.itemModalScroll} showsVerticalScrollIndicator={false}>
            {imgSrc ? (
              <View style={styles.itemModalImageContainer}>
                <Image source={imgSrc} style={styles.itemModalImage} resizeMode="contain" />
              </View>
            ) : (
              <View style={[styles.itemModalImageContainer, styles.itemModalImagePlaceholder]}>
                <Text style={styles.itemModalImagePlaceholderText}>No image</Text>
              </View>
            )}
            <View style={styles.itemModalInfo}>
              <Text style={styles.itemModalName}>
                {(item.quantity || 1) > 1 ? `${item.quantity}× ` : ""}{item.productName || "Product"}
              </Text>
              {item.price != null && (
                <Text style={styles.itemModalPrice}>
                  ${Number(item.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              )}
              {item.description && (
                <View style={styles.itemModalDescriptionBlock}>
                  <Text style={styles.itemModalDescriptionLabel}>Description</Text>
                  <Text style={styles.itemModalDescription}>{item.description}</Text>
                </View>
              )}
              {item.productId && (
                <Text style={styles.itemModalId}>Product ID: {item.productId}</Text>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RequestCard({ req, onStatusChange, updatingId }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const isCompleted = ["completed", "shipped"].includes((req.status || "").toLowerCase());
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestCardTop}>
        <View style={styles.requestMeta}>
          <Text style={styles.requestDate}>{formatDate(req.createdAt)}</Text>
          {(req.requestNumber || req.id) && (
            <Text style={styles.requestNumber} selectable>
              #{req.requestNumber || req.id}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusPending]}>
          <Text style={styles.statusText}>{statusLabel(req.status)}</Text>
        </View>
      </View>
      {(req.fullName || req.userEmail) && (
        <Text style={styles.requestContact}>
          {[req.fullName, req.userEmail].filter(Boolean).join(" · ")}
        </Text>
      )}
      {req.phone && (
        <Text style={styles.requestPhone}>
          {req.phone}
          {req.hasWhatsApp === false ? " (SMS)" : " (WhatsApp)"}
        </Text>
      )}
      {req.address ? <Text style={styles.requestAddress}>{req.address}</Text> : null}
      <View style={styles.itemsBlock}>
        <Text style={styles.itemsLabel}>Items</Text>
        {(req.items || []).map((item, idx) => {
          const imgSrc = toImageSource(item.image);
          return (
            <TouchableOpacity
              key={idx}
              style={styles.itemRow}
              onPress={() => setSelectedItem(item)}
              activeOpacity={0.7}
            >
              <View style={styles.itemImageContainer}>
                {imgSrc ? (
                  <Image source={imgSrc} style={styles.itemImage} resizeMode="cover" />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Text style={styles.itemImagePlaceholderText}>📷</Text>
                  </View>
                )}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {(item.quantity || 1) > 1 ? `${item.quantity}× ` : ""}{item.productName || "Product"}
                </Text>
                {item.price != null && (
                  <Text style={styles.itemPrice}>
                    ${Number(item.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                )}
                {item.description && (
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <Text style={styles.itemClickHint}>Tap to view details →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <ItemDetailModal item={selectedItem} visible={!!selectedItem} onClose={() => setSelectedItem(null)} />
      {onStatusChange && (
        <View style={styles.statusActions}>
          <TouchableOpacity
            style={[styles.statusBtn, isCompleted && styles.statusBtnActive]}
            onPress={() => onStatusChange(req, "completed")}
            disabled={updatingId === req.id}
          >
            {updatingId === req.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.statusBtnText}>Mark completed</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusBtnOutline, !isCompleted && styles.statusBtnOutlineActive]}
            onPress={() => onStatusChange(req, "pending")}
            disabled={updatingId === req.id}
          >
            <Text style={styles.statusBtnOutlineText}>In review</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function UserDetailCard({ user, requestCount, onClose }) {
  return (
    <View style={styles.userDetailCard}>
      <View style={styles.userDetailHeader}>
        <Text style={styles.userDetailTitle}>Client details</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.userDetailContent}>
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Name</Text>
          <Text style={styles.userDetailValue}>{user.fullName || "—"}</Text>
        </View>
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Email</Text>
          <Text style={styles.userDetailValue}>{user.email || "—"}</Text>
        </View>
        {user.phone && (
          <View style={styles.userDetailRow}>
            <Text style={styles.userDetailLabel}>Phone</Text>
            <Text style={styles.userDetailValue}>
              {user.phone}
              {user.hasWhatsApp === false ? " (SMS)" : " (WhatsApp)"}
            </Text>
          </View>
        )}
        {user.address && (
          <View style={styles.userDetailRow}>
            <Text style={styles.userDetailLabel}>Address</Text>
            <Text style={styles.userDetailValue}>{user.address}</Text>
          </View>
        )}
        {user.workTitle && (
          <View style={styles.userDetailRow}>
            <Text style={styles.userDetailLabel}>Work title</Text>
            <Text style={styles.userDetailValue}>{user.workTitle}</Text>
          </View>
        )}
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Account created</Text>
          <Text style={styles.userDetailValue}>{formatDateShort(user.createdAt)}</Text>
        </View>
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Total requests</Text>
          <Text style={styles.userDetailValue}>{requestCount}</Text>
        </View>
      </View>
    </View>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    signOut,
    getRequestsForAdmin,
    getUsersForAdmin,
    updateRequestStatus,
  } = useAuth();
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [requestsError, setRequestsError] = useState(null);
  const [searchClientName, setSearchClientName] = useState("");
  const [searchRequestNumber, setSearchRequestNumber] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState("requests"); // "requests" or "clients"
  const [updatingId, setUpdatingId] = useState(null);

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
    if (!user || !isAdmin) return;
    let cancelled = false;
    setUsersError(null);
    setRequestsError(null);
    setLoadingUsers(true);
    setLoadingRequests(true);

    (getUsersForAdmin?.() ?? Promise.resolve([]))
      .then((list) => {
        if (!cancelled) setUsers(list || []);
      })
      .catch((err) => {
        if (!cancelled) setUsersError(err?.message || "Could not load clients.");
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });

    (getRequestsForAdmin?.() ?? Promise.resolve([]))
      .then((list) => {
        if (!cancelled) setRequests(list || []);
      })
      .catch((err) => {
        if (!cancelled) setRequestsError(err?.message || "Could not load requests.");
      })
      .finally(() => {
        if (!cancelled) setLoadingRequests(false);
      });

    return () => { cancelled = true; };
  }, [user, isAdmin, getRequestsForAdmin, getUsersForAdmin]);

  const handleStatusChange = async (req, status) => {
    const uid = req.userId;
    if (!uid || !updateRequestStatus) return;
    setUpdatingId(req.id);
    try {
      await updateRequestStatus(uid, req.id, status);
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id && r.userId === uid ? { ...r, status } : r))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const matchClientName = (name, email) => {
    const q = (searchClientName || "").trim().toLowerCase();
    if (!q) return true;
    const n = (name || "").toLowerCase();
    const e = (email || "").toLowerCase();
    return n.includes(q) || e.includes(q);
  };

  const matchRequestNumber = (req) => {
    const q = (searchRequestNumber || "").trim().toLowerCase();
    if (!q) return true;
    const id = (req.id || "").toLowerCase();
    const num = (req.requestNumber || "").toLowerCase();
    return id.includes(q) || num.includes(q);
  };

  const filteredUsers = users.filter((u) => matchClientName(u.fullName, u.email));
  const filteredRequests = requests.filter(
    (req) => matchRequestNumber(req) && matchClientName(req.fullName, req.userEmail)
  );
  const selectedUserRequests = selectedUser
    ? filteredRequests.filter((r) => r.userId === selectedUser.id)
    : [];

  const getUserRequestCount = (userId) => requests.filter((r) => r.userId === userId).length;

  const loading = loadingUsers || loadingRequests;
  const hasError = usersError || requestsError;

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

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, viewMode === "requests" && styles.tabActive]}
          onPress={() => {
            setViewMode("requests");
            setSelectedUser(null);
          }}
        >
          <Text style={[styles.tabText, viewMode === "requests" && styles.tabTextActive]}>
            All requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === "clients" && styles.tabActive]}
          onPress={() => {
            setViewMode("clients");
            setSelectedUser(null);
          }}
        >
          <Text style={[styles.tabText, viewMode === "clients" && styles.tabTextActive]}>
            Clients ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigate("/admin/listings")}
        >
          <Text style={styles.tabText}>Listings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            {viewMode === "requests" ? "All requests" : "Clients"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {viewMode === "requests"
              ? "Search by client name or request number. Mark requests completed when done."
              : "View client information and their requests. Click a client to see details."}
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder={viewMode === "requests" ? "Search by client name or email" : "Search clients"}
            placeholderTextColor="#8a8a8a"
            value={searchClientName}
            onChangeText={setSearchClientName}
          />
          {viewMode === "requests" && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search by request number"
              placeholderTextColor="#8a8a8a"
              value={searchRequestNumber}
              onChangeText={setSearchRequestNumber}
            />
          )}
        </View>

        {(usersError || requestsError) && (
          <View style={styles.errorBox}>
            {usersError && (
              <View style={styles.errorItem}>
                <Text style={styles.errorLabel}>Clients</Text>
                <Text style={styles.errorText}>{usersError}</Text>
                <Text style={styles.errorHint}>
                  In Firestore, ensure your user document (users/{user?.uid}) has the field{" "}
                  <Text style={styles.errorCode}>role: "admin"</Text>. Deploy rules: firebase deploy --only firestore:rules
                </Text>
              </View>
            )}
            {requestsError && (
              <View style={[styles.errorItem, usersError && styles.errorItemLast]}>
                <Text style={styles.errorLabel}>Requests</Text>
                <Text style={styles.errorText}>{requestsError}</Text>
                <Text style={styles.errorHint}>
                  Ensure your Firestore user document has role: "admin" and that rules are deployed.
                </Text>
              </View>
            )}
          </View>
        )}

        {loading && users.length === 0 && requests.length === 0 ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#1a1a1a" />
            <Text style={styles.loaderText}>Loading…</Text>
          </View>
        ) : viewMode === "requests" ? (
          <View style={styles.section}>
            {loadingRequests && requests.length === 0 ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.emptyText}>Loading requests…</Text>
              </View>
            ) : filteredRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No requests yet</Text>
                <Text style={styles.emptySubtext}>
                  {requestsError ? "Fix the error above." : "Customer requests will appear here."}
                </Text>
              </View>
            ) : (
              filteredRequests.map((req) => (
                <RequestCard
                  key={`${req.userId}-${req.id}`}
                  req={req}
                  onStatusChange={handleStatusChange}
                  updatingId={updatingId}
                />
              ))
            )}
          </View>
        ) : (
          <>
            {selectedUser ? (
              <View style={styles.section}>
                <UserDetailCard
                  user={selectedUser}
                  requestCount={getUserRequestCount(selectedUser.id)}
                  onClose={() => setSelectedUser(null)}
                />
                <Text style={styles.sectionTitle}>Requests for {selectedUser.fullName || selectedUser.email}</Text>
                {selectedUserRequests.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No requests for this client</Text>
                  </View>
                ) : (
                  selectedUserRequests.map((req) => (
                    <RequestCard
                      key={`${req.userId}-${req.id}`}
                      req={req}
                      onStatusChange={handleStatusChange}
                      updatingId={updatingId}
                    />
                  ))
                )}
              </View>
            ) : (
              <View style={styles.section}>
                {loadingUsers && users.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <ActivityIndicator size="small" color="#666" />
                    <Text style={styles.emptyText}>Loading clients…</Text>
                  </View>
                ) : filteredUsers.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No clients found</Text>
                    <Text style={styles.emptySubtext}>
                      {usersError ? "Fix the error above to load clients." : "Clients appear here after they sign up."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.userGrid}>
                    {filteredUsers.map((u) => {
                      const reqCount = getUserRequestCount(u.id);
                      return (
                        <TouchableOpacity
                          key={u.id}
                          style={styles.userCard}
                          onPress={() => setSelectedUser(u)}
                        >
                          <View style={styles.userCardHeader}>
                            <Text style={styles.userName}>{u.fullName || "—"}</Text>
                            {reqCount > 0 && (
                              <View style={styles.requestBadge}>
                                <Text style={styles.requestBadgeText}>{reqCount}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.userEmail} numberOfLines={1}>{u.email || "—"}</Text>
                          {u.phone && <Text style={styles.userPhone}>{u.phone}</Text>}
                          {u.address && <Text style={styles.userAddress} numberOfLines={1}>{u.address}</Text>}
                          <Text style={styles.userCreated}>Joined {formatDateShort(u.createdAt)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
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
  email: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 10,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e6e2",
    paddingHorizontal: 24,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 24,
  },
  tabActive: {
    borderBottomColor: "#1c1c1c",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#1c1c1c",
  },
  content: { flex: 1 },
  contentInner: { padding: 24, paddingBottom: 48, maxWidth: 900 },
  hero: { marginBottom: 28 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#5c5c5c",
    lineHeight: 22,
  },
  searchWrap: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
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
  errorBox: {
    backgroundColor: "#fdf2f0",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f5d5d0",
  },
  errorItem: { marginBottom: 16 },
  errorItemLast: { marginBottom: 0 },
  errorLabel: { fontSize: 12, fontWeight: "700", color: "#9b2c2c", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  errorText: { fontSize: 14, color: "#9b2c2c", fontWeight: "600" },
  errorHint: { fontSize: 13, color: "#6b5b5b", marginTop: 8, lineHeight: 20 },
  errorCode: { fontFamily: Platform.OS === "web" ? "monospace" : undefined, fontWeight: "600" },
  loaderWrap: { alignItems: "center", paddingVertical: 48 },
  loaderText: { marginTop: 12, fontSize: 14, color: "#666" },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d2d2d",
    marginBottom: 14,
    letterSpacing: 0.3,
  },
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
  userGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  userCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e6e2",
    minWidth: 280,
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  userCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  userName: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", flex: 1 },
  requestBadge: {
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  requestBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  userEmail: { fontSize: 14, color: "#555", marginBottom: 4 },
  userPhone: { fontSize: 13, color: "#666", marginBottom: 2 },
  userAddress: { fontSize: 12, color: "#777", marginBottom: 6 },
  userCreated: { fontSize: 11, color: "#999", marginTop: 4 },
  userDetailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e8e6e2",
  },
  userDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userDetailTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 20, color: "#666" },
  userDetailContent: { gap: 16 },
  userDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  userDetailLabel: { fontSize: 13, fontWeight: "600", color: "#666", minWidth: 100 },
  userDetailValue: { fontSize: 14, color: "#1a1a1a", flex: 1, textAlign: "right" },
  requestCard: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e6e2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  requestCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  requestMeta: { flex: 1 },
  requestDate: { fontSize: 12, color: "#6a6a6a", marginBottom: 4 },
  requestNumber: { fontSize: 12, color: "#555", fontFamily: Platform.OS === "web" ? "monospace" : undefined },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusPending: { backgroundColor: "#fef3e2" },
  statusCompleted: { backgroundColor: "#e6f4ea" },
  statusText: { fontSize: 11, fontWeight: "700", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: 0.5 },
  requestContact: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", marginBottom: 4 },
  requestPhone: { fontSize: 14, color: "#555", marginBottom: 2 },
  requestAddress: { fontSize: 13, color: "#666", marginBottom: 10 },
  itemsBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#eee" },
  itemsLabel: { fontSize: 11, fontWeight: "700", color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  itemRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 14,
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e8e6e2",
  },
  itemImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8e6e2",
  },
  itemImagePlaceholderText: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 14,
    color: "#2d2d2d",
    fontWeight: "600",
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 4,
  },
  itemClickHint: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  itemModalContent: {
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
  itemModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: "#666",
  },
  itemModalScroll: {
    maxHeight: 600,
  },
  itemModalImageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemModalImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemModalImagePlaceholderText: {
    fontSize: 16,
    color: "#999",
  },
  itemModalImage: {
    width: "100%",
    height: "100%",
  },
  itemModalInfo: {
    padding: 20,
  },
  itemModalName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  itemModalPrice: {
    fontSize: 18,
    color: "#2d2d2d",
    fontWeight: "600",
    marginBottom: 16,
  },
  itemModalDescriptionBlock: {
    marginBottom: 16,
  },
  itemModalDescriptionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  itemModalDescription: {
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
  },
  itemModalId: {
    fontSize: 12,
    color: "#999",
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  statusActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  statusBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#e8e6e2",
  },
  statusBtnActive: { backgroundColor: "#1b5e20" },
  statusBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  statusBtnOutline: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0cec8",
  },
  statusBtnOutlineActive: { borderColor: "#1c1c1c", backgroundColor: "#f5f4f0" },
  statusBtnOutlineText: { fontSize: 13, color: "#333", fontWeight: "600" },
});
