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
import useSEO from "../hooks/useSEO";
import { db } from "../config/firebase";
import {
  collection, getDocs, orderBy, query, doc, updateDoc,
} from "firebase/firestore";

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
  if (v === "completed" || v === "shipped") return "Completado";
  if (v === "pending" || v === "in review") return "En revisión";
  return s || "Pendiente";
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
            <Text style={styles.itemModalTitle}>Detalles del artículo</Text>
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
                <Text style={styles.itemModalImagePlaceholderText}>Sin imagen</Text>
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

// ─── Reclamación status helpers ───────────────────────────────────────────────
const reclamoStatusLabel = (s) => {
  if (s === "respondido")  return "Respondido";
  if (s === "en_proceso")  return "En proceso";
  return "Pendiente";
};

const reclamoStatusStyle = (s) => {
  if (s === "respondido") return styles.reclamoRespondido;
  if (s === "en_proceso") return styles.reclamoEnProceso;
  return styles.reclamoPendiente;
};

function ReclamacionCard({ reclamo, onStatusChange, updatingId }) {
  const isUpdating = updatingId === reclamo.id;
  const createdAt = reclamo.createdAt?.toDate
    ? reclamo.createdAt.toDate().toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <View style={styles.reclamoCard}>
      <View style={styles.reclamoCardTop}>
        <View>
          <Text style={styles.reclamoCodigo} selectable>{reclamo.codigoReclamo || reclamo.id}</Text>
          <Text style={styles.reclamoDate}>{createdAt}</Text>
        </View>
        <View style={[styles.reclamoBadge, reclamoStatusStyle(reclamo.status)]}>
          <Text style={styles.reclamoBadgeText}>{reclamoStatusLabel(reclamo.status)}</Text>
        </View>
      </View>

      <View style={styles.reclamoSection}>
        <Text style={styles.reclamoSectionTitle}>CONSUMIDOR</Text>
        <Text style={styles.reclamoName}>{reclamo.nombre || "—"}</Text>
        <Text style={styles.reclamoMeta}>DNI: {reclamo.dni || "—"} · {reclamo.celular || "—"}</Text>
        <Text style={styles.reclamoMeta}>{reclamo.email || "—"}</Text>
        {(reclamo.departamento || reclamo.provincia) && (
          <Text style={styles.reclamoMeta}>
            {[reclamo.distrito, reclamo.provincia, reclamo.departamento].filter(Boolean).join(", ")}
          </Text>
        )}
      </View>

      <View style={styles.reclamoSection}>
        <Text style={styles.reclamoSectionTitle}>BIEN CONTRATADO</Text>
        <Text style={styles.reclamoMeta}>
          {reclamo.tipoContratado || "—"}
          {reclamo.nroPedido ? ` · Pedido: ${reclamo.nroPedido}` : ""}
          {reclamo.montoReclamado ? ` · S/ ${reclamo.montoReclamado}` : ""}
        </Text>
        {reclamo.descripcionContratado ? (
          <Text style={styles.reclamoDetalle} numberOfLines={2}>{reclamo.descripcionContratado}</Text>
        ) : null}
      </View>

      <View style={styles.reclamoSection}>
        <Text style={styles.reclamoSectionTitle}>
          {reclamo.tipoReclamacion === "Queja" ? "QUEJA" : "RECLAMO"}
        </Text>
        <Text style={styles.reclamoDetalle}>{reclamo.detalle || "—"}</Text>
      </View>

      <View style={styles.statusActions}>
        {["pendiente", "en_proceso", "respondido"].map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.reclamoStatusBtn,
              reclamo.status === s && styles.reclamoStatusBtnActive,
            ]}
            onPress={() => onStatusChange(reclamo, s)}
            disabled={isUpdating || reclamo.status === s}
          >
            {isUpdating && reclamo.status !== s ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.reclamoStatusBtnText, reclamo.status === s && { color: "#fff" }]}>
                {reclamoStatusLabel(s)}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
              <Text style={styles.statusBtnText}>Marcar completado</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusBtnOutline, !isCompleted && styles.statusBtnOutlineActive]}
            onPress={() => onStatusChange(req, "pending")}
            disabled={updatingId === req.id}
          >
            <Text style={styles.statusBtnOutlineText}>En revisión</Text>
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
        <Text style={styles.userDetailTitle}>Datos del cliente</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.userDetailContent}>
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Nombre</Text>
          <Text style={styles.userDetailValue}>{user.fullName || "—"}</Text>
        </View>
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Correo</Text>
          <Text style={styles.userDetailValue}>{user.email || "—"}</Text>
        </View>
        {user.phone && (
          <View style={styles.userDetailRow}>
            <Text style={styles.userDetailLabel}>Teléfono</Text>
            <Text style={styles.userDetailValue}>
              {user.phone}
              {user.hasWhatsApp === false ? " (SMS)" : " (WhatsApp)"}
            </Text>
          </View>
        )}
        {user.address && (
          <View style={styles.userDetailRow}>
            <Text style={styles.userDetailLabel}>Dirección</Text>
            <Text style={styles.userDetailValue}>{user.address}</Text>
          </View>
        )}
        {user.workTitle && (
          <View style={styles.userDetailRow}>
            <Text style={styles.userDetailLabel}>Cargo</Text>
            <Text style={styles.userDetailValue}>{user.workTitle}</Text>
          </View>
        )}
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Cuenta creada</Text>
          <Text style={styles.userDetailValue}>{formatDateShort(user.createdAt)}</Text>
        </View>
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Total solicitudes</Text>
          <Text style={styles.userDetailValue}>{requestCount}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Reclamaciones export helpers ────────────────────────────────────────────
function exportReclamacionesCSV(reclamaciones) {
  const headers = [
    "Código","Fecha","Estado","Nombre","DNI","Email","Teléfono",
    "Departamento","Provincia","Distrito","Tipo Bien","N° Pedido",
    "Monto","Tipo Reclamo","Detalle",
  ];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = reclamaciones.map((r) => [
    r.codigoReclamo || r.id,
    r.createdAt?.toDate?.()?.toLocaleDateString("es-PE") || "",
    r.status || "pendiente",
    r.nombre, r.dni, r.email, r.celular,
    r.departamento, r.provincia, r.distrito || "",
    r.tipoContratado, r.nroPedido || "", r.montoReclamado || "",
    r.tipoReclamacion, r.detalle,
  ].map(escape).join(","));
  const csv = [headers.map(escape).join(","), ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reclamaciones_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReclamacionesReport(reclamaciones) {
  const fmtDate = (r) =>
    r.createdAt?.toDate?.()?.toLocaleString("es-PE", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }) || "—";

  const pages = reclamaciones.map((r) => `
    <div class="page">
      <div class="header">
        <div class="header-left">
          <div class="logo-bar"></div>
          <div>
            <div class="header-title">LIBRO DE RECLAMACIONES VIRTUAL</div>
            <div class="header-sub">Ley N° 29571 — DS 011-2011-PCM</div>
          </div>
        </div>
        <div class="header-right">
          <div class="codigo">${r.codigoReclamo || r.id}</div>
          <div class="fecha">${fmtDate(r)}</div>
        </div>
      </div>

      <div class="company-bar">
        <span class="company-name">BURMES &amp; CO S.A.C.</span>
        <span class="company-ruc">RUC 20613752367</span>
        <span class="status status-${r.status || "pendiente"}">${
          r.status === "respondido" ? "RESPONDIDO" :
          r.status === "en_proceso" ? "EN PROCESO" : "PENDIENTE"
        }</span>
      </div>

      <div class="section-title">I. IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE</div>
      <table class="data-table">
        <tr><td class="label">Nombre completo</td><td>${r.nombre || "—"}</td><td class="label">DNI / C.E.</td><td>${r.dni || "—"}</td></tr>
        <tr><td class="label">Correo electrónico</td><td>${r.email || "—"}</td><td class="label">Teléfono</td><td>${r.celular || "—"}</td></tr>
        <tr><td class="label">Domicilio</td><td colspan="3">${[r.domicilio, r.distrito, r.provincia, r.departamento].filter(Boolean).join(", ") || "—"}</td></tr>
      </table>

      <div class="section-title">II. IDENTIFICACIÓN DEL BIEN CONTRATADO</div>
      <table class="data-table">
        <tr><td class="label">Tipo</td><td>${r.tipoContratado || "—"}</td><td class="label">N° Pedido</td><td>${r.nroPedido || "—"}</td></tr>
        <tr><td class="label">Monto reclamado</td><td>S/ ${r.montoReclamado || "—"}</td><td class="label">&nbsp;</td><td>&nbsp;</td></tr>
        <tr><td class="label">Descripción</td><td colspan="3">${r.descripcionContratado || "—"}</td></tr>
      </table>

      <div class="section-title section-title-red">III. DETALLE DE LA ${(r.tipoReclamacion || "RECLAMACIÓN").toUpperCase()}</div>
      <div class="detalle-box">${r.detalle || "—"}</div>

      <div class="footer-note">
        El proveedor deberá dar respuesta en un plazo no mayor de <strong>30 días calendario</strong>.
        La formulación del reclamo no impide acudir al INDECOPI.
      </div>
    </div>
  `).join("");

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Libro de Reclamaciones — BURMES &amp; CO S.A.C.</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
      .page { width: 210mm; min-height: 297mm; padding: 16mm; page-break-after: always; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0056AC; padding-bottom: 10px; margin-bottom: 10px; }
      .header-left { display: flex; align-items: center; gap: 10px; }
      .logo-bar { width: 6px; height: 50px; background: #D91023; border-radius: 3px; }
      .header-title { font-size: 13px; font-weight: bold; color: #0056AC; letter-spacing: 1px; }
      .header-sub { font-size: 9px; color: #666; margin-top: 3px; }
      .header-right { text-align: right; }
      .codigo { font-size: 16px; font-weight: bold; font-family: monospace; color: #0056AC; }
      .fecha { font-size: 9px; color: #666; margin-top: 3px; }
      .company-bar { background: #0d1e3a; color: #fff; padding: 7px 12px; display: flex; gap: 16px; align-items: center; margin-bottom: 14px; border-radius: 3px; }
      .company-name { font-weight: bold; font-size: 12px; }
      .company-ruc { font-size: 10px; opacity: 0.7; }
      .status { margin-left: auto; font-size: 9px; font-weight: bold; padding: 3px 8px; border-radius: 2px; letter-spacing: 1px; }
      .status-pendiente { background: #F6C90E; color: #111; }
      .status-en_proceso { background: #63b3ed; color: #fff; }
      .status-respondido { background: #48bb78; color: #fff; }
      .section-title { background: #1e3a5f; color: #fff; font-size: 9px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 10px; margin: 12px 0 6px; }
      .section-title-red { background: #7b1a1a; }
      .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
      .data-table td { padding: 6px 8px; border: 1px solid #dde3ed; }
      .label { background: #dce6f4; font-weight: bold; color: #1e3a5f; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; width: 20%; }
      .detalle-box { border: 1px solid #fca5a5; border-left: 4px solid #D91023; padding: 12px; background: #fff5f5; font-size: 11px; line-height: 1.6; min-height: 60px; }
      .footer-note { margin-top: 20px; padding: 10px; background: #f0f5ff; border-left: 3px solid #0056AC; font-size: 10px; color: #444; line-height: 1.6; }
      @media print { .page { page-break-after: always; } }
    </style>
  </head><body>${pages}</body></html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
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
  const [viewMode, setViewMode] = useState("requests"); // "requests" | "clients" | "reclamaciones"
  const [updatingId, setUpdatingId] = useState(null);

  const [reclamaciones,      setReclamaciones]      = useState([]);
  const [loadingReclamos,    setLoadingReclamos]    = useState(false);
  const [reclamosError,      setReclamosError]      = useState(null);
  const [updatingReclamoId,  setUpdatingReclamoId]  = useState(null);
  const [reclamoSearch,      setReclamoSearch]      = useState("");

  useSEO({
    title: "Control de Administración",
    description: "Gestión de solicitudes y clientes - Burmes & Co.",
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
        if (!cancelled) setUsersError(err?.message || "No se pudieron cargar los clientes.");
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });

    (getRequestsForAdmin?.() ?? Promise.resolve([]))
      .then((list) => {
        if (!cancelled) setRequests(list || []);
      })
      .catch((err) => {
        if (!cancelled) setRequestsError(err?.message || "No se pudieron cargar las solicitudes.");
      })
      .finally(() => {
        if (!cancelled) setLoadingRequests(false);
      });

    return () => { cancelled = true; };
  }, [user, isAdmin, getRequestsForAdmin, getUsersForAdmin]);

  useEffect(() => {
    if (!user || !isAdmin || viewMode !== "reclamaciones" || !db) return;
    let cancelled = false;
    setLoadingReclamos(true);
    setReclamosError(null);
    getDocs(query(collection(db, "reclamaciones"), orderBy("createdAt", "desc")))
      .then((snap) => {
        if (!cancelled) {
          setReclamaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      })
      .catch((err) => {
        if (!cancelled) setReclamosError(err?.message || "No se pudieron cargar las reclamaciones.");
      })
      .finally(() => { if (!cancelled) setLoadingReclamos(false); });
    return () => { cancelled = true; };
  }, [user, isAdmin, viewMode]);

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

  const handleReclamacionStatusChange = async (reclamo, newStatus) => {
    if (!db) return;
    setUpdatingReclamoId(reclamo.id);
    try {
      await updateDoc(doc(db, "reclamaciones", reclamo.id), { status: newStatus });
      setReclamaciones((prev) =>
        prev.map((r) => (r.id === reclamo.id ? { ...r, status: newStatus } : r))
      );
    } finally {
      setUpdatingReclamoId(null);
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
            Todas las solicitudes
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
            Clientes ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === "reclamaciones" && styles.tabActive]}
          onPress={() => { setViewMode("reclamaciones"); setSelectedUser(null); }}
        >
          <Text style={[styles.tabText, viewMode === "reclamaciones" && styles.tabTextActive]}>
            Reclamaciones{reclamaciones.length > 0 ? ` (${reclamaciones.length})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigate("/admin/listings")}
        >
          <Text style={styles.tabText}>Productos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            {viewMode === "requests"
              ? "Todas las solicitudes"
              : viewMode === "reclamaciones"
              ? "Libro de Reclamaciones"
              : "Clientes"}
          </Text>
          <Text style={styles.heroSubtitle}>
            {viewMode === "reclamaciones"
              ? "Gestiona los reclamos y quejas recibidos. Actualiza el estado según avances en la atención."
              : viewMode === "requests"
              ? "Busca por nombre de cliente o número de solicitud. Marca las solicitudes como completadas cuando termines."
              : "Consulta la información de los clientes y sus solicitudes. Haz clic en un cliente para ver detalles."}
          </Text>
        </View>

        {viewMode !== "reclamaciones" && <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder={viewMode === "requests" ? "Buscar por nombre o correo del cliente" : "Buscar clientes"}
            placeholderTextColor="#8a8a8a"
            value={searchClientName}
            onChangeText={setSearchClientName}
          />
          {viewMode === "requests" && (
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por número de solicitud"
              placeholderTextColor="#8a8a8a"
              value={searchRequestNumber}
              onChangeText={setSearchRequestNumber}
            />
          )}
        </View>}

        {(usersError || requestsError) && viewMode !== "reclamaciones" && (
          <View style={styles.errorBox}>
            {usersError && (
              <View style={styles.errorItem}>
                <Text style={styles.errorLabel}>Clientes</Text>
                <Text style={styles.errorText}>{usersError}</Text>
                <Text style={styles.errorHint}>
                  En Firestore, asegúrate de que tu documento de usuario (users/{user?.uid}) tenga el campo{" "}
                  <Text style={styles.errorCode}>role: "admin"</Text>. Despliega reglas: firebase deploy --only firestore:rules
                </Text>
              </View>
            )}
            {requestsError && (
              <View style={[styles.errorItem, usersError && styles.errorItemLast]}>
                <Text style={styles.errorLabel}>Solicitudes</Text>
                <Text style={styles.errorText}>{requestsError}</Text>
                <Text style={styles.errorHint}>
                  Asegúrate de que tu documento de usuario en Firestore tenga role: "admin" y que las reglas estén desplegadas.
                </Text>
              </View>
            )}
          </View>
        )}

        {viewMode === "reclamaciones" ? (
          <View style={styles.section}>
            {/* Search + Download buttons */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <TextInput
                style={[styles.searchInput, { flex: 1, minWidth: 200, marginBottom: 0 }]}
                placeholder="Buscar por nombre, código o correo"
                placeholderTextColor="#8a8a8a"
                value={reclamoSearch}
                onChangeText={setReclamoSearch}
              />
              {reclamaciones.length > 0 && Platform.OS === "web" && (
                <>
                  <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() => exportReclamacionesCSV(reclamaciones)}
                  >
                    <Text style={styles.exportBtnText}>⬇ CSV</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.exportBtn, { backgroundColor: "#1e3a5f" }]}
                    onPress={() => printReclamacionesReport(reclamaciones)}
                  >
                    <Text style={styles.exportBtnText}>🖨 Imprimir / PDF</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            {loadingReclamos ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#1a1a1a" />
                <Text style={styles.loaderText}>Cargando reclamaciones…</Text>
              </View>
            ) : reclamosError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{reclamosError}</Text>
                <Text style={styles.errorHint}>
                  Verifica que las reglas de Firestore permitan leer /reclamaciones a usuarios admin.
                </Text>
              </View>
            ) : reclamaciones.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No hay reclamaciones aún</Text>
                <Text style={styles.emptySubtext}>Cuando un cliente envíe un reclamo aparecerá aquí.</Text>
              </View>
            ) : (
              reclamaciones
                .filter((r) => {
                  const q = reclamoSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (r.nombre || "").toLowerCase().includes(q) ||
                    (r.codigoReclamo || "").toLowerCase().includes(q) ||
                    (r.email || "").toLowerCase().includes(q)
                  );
                })
                .map((r) => (
                  <ReclamacionCard
                    key={r.id}
                    reclamo={r}
                    onStatusChange={handleReclamacionStatusChange}
                    updatingId={updatingReclamoId}
                  />
                ))
            )}
          </View>
        ) : loading && users.length === 0 && requests.length === 0 ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#1a1a1a" />
            <Text style={styles.loaderText}>Cargando…</Text>
          </View>
        ) : viewMode === "requests" ? (
          <View style={styles.section}>
            {loadingRequests && requests.length === 0 ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator size="small" color="#666" />
                <Text style={styles.emptyText}>Cargando solicitudes…</Text>
              </View>
            ) : filteredRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Aún no hay solicitudes</Text>
                <Text style={styles.emptySubtext}>
                  {requestsError ? "Corrige el error de arriba." : "Las solicitudes de clientes aparecerán aquí."}
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
                <Text style={styles.sectionTitle}>Solicitudes de {selectedUser.fullName || selectedUser.email}</Text>
                {selectedUserRequests.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No hay solicitudes de este cliente</Text>
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
                    <Text style={styles.emptyText}>Cargando clientes…</Text>
                  </View>
                ) : filteredUsers.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No se encontraron clientes</Text>
                    <Text style={styles.emptySubtext}>
                      {usersError ? "Corrige el error de arriba para cargar clientes." : "Los clientes aparecen aquí después de registrarse."}
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
                          <Text style={styles.userCreated}>Registrado {formatDateShort(u.createdAt)}</Text>
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

  // Reclamaciones
  reclamoCard: {
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
  reclamoCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0ece6",
  },
  reclamoCodigo: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
    marginBottom: 2,
  },
  reclamoDate: { fontSize: 12, color: "#888" },
  reclamoBadge: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6,
  },
  reclamoBadgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  reclamoPendiente:  { backgroundColor: "#fef9e7", borderWidth: 1, borderColor: "#f6c90e" },
  reclamoEnProceso:  { backgroundColor: "#ebf8ff", borderWidth: 1, borderColor: "#63b3ed" },
  reclamoRespondido: { backgroundColor: "#e6f4ea", borderWidth: 1, borderColor: "#68d391" },
  reclamoSection: { marginBottom: 12 },
  reclamoSectionTitle: {
    fontSize: 10, fontWeight: "700", letterSpacing: 1.5,
    color: "#aaa", textTransform: "uppercase", marginBottom: 4,
  },
  reclamoName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", marginBottom: 2 },
  reclamoMeta: { fontSize: 13, color: "#555", marginBottom: 1 },
  reclamoDetalle: { fontSize: 13, color: "#333", lineHeight: 20 },
  reclamoStatusBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#d0cec8",
    alignItems: "center",
    backgroundColor: "#f8f7f5",
  },
  reclamoStatusBtnActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  reclamoStatusBtnText: { fontSize: 12, fontWeight: "600", color: "#444" },

  exportBtn: {
    backgroundColor: "#2d5a1b",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  exportBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
