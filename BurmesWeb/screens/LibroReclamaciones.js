import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { DEPARTAMENTOS, PROVINCIAS } from "../assets/data/ubigeo";
import Footer from "../Shared/Footer";

// ─── Native HTML select rendered on web ───────────────────────────────────────
const PeruSelect = ({ value, onChange, options, placeholder }) => {
  if (Platform.OS === "web") {
    return React.createElement(
      "select",
      {
        value: value || "",
        onChange: (e) => onChange(e.target.value),
        style: {
          border: "1px solid #d8d0c8",
          borderRadius: 3,
          padding: "11px 14px",
          fontSize: 14,
          color: value ? "#1a1a1a" : "#888",
          backgroundColor: "#faf9f7",
          width: "100%",
          cursor: "pointer",
          fontFamily: "sans-serif",
          appearance: "auto",
          outlineColor: "#C9A961",
        },
      },
      [
        React.createElement("option", { key: "__ph", value: "" }, placeholder || "Seleccionar…"),
        ...options.map((opt) =>
          React.createElement("option", { key: opt, value: opt }, opt)
        ),
      ]
    );
  }
  // Native fallback: plain text input
  return (
    <TextInput
      style={nativeSelectStyle}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#888"
    />
  );
};

const nativeSelectStyle = {
  borderWidth: 1,
  borderColor: "#d8d0c8",
  borderRadius: 3,
  paddingHorizontal: 14,
  paddingVertical: 11,
  fontSize: 14,
  color: "#1a1a1a",
  backgroundColor: "#faf9f7",
};

// ─── Email notification via EmailJS REST (no SDK needed) ─────────────────────
const sendEmailNotification = async (data) => {
  const serviceId  = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;
  if (!serviceId || !templateId || !publicKey) return;

  await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:      serviceId,
      template_id:     templateId,
      user_id:         publicKey,
      template_params: {
        codigo:       data.codigoReclamo,
        nombre:       data.nombre,
        email_cliente: data.email,
        telefono:     data.celular,
        departamento: data.departamento,
        provincia:    data.provincia,
        distrito:     data.distrito,
        tipo_bien:    data.tipoContratado,
        nro_pedido:   data.nroPedido || "—",
        monto:        data.montoReclamado || "—",
        descripcion_bien: data.descripcionContratado,
        tipo_reclamo: data.tipoReclamacion,
        detalle:      data.detalle,
      },
    }),
  });
};

// ─── Main component ───────────────────────────────────────────────────────────
const LibroReclamaciones = ({ onNavigate }) => {
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get("window"));
  const [tipoContratado,   setTipoContratado]   = useState("");
  const [tipoReclamacion,  setTipoReclamacion]   = useState("");
  const [departamento,     setDepartamento]      = useState("");
  const [provincia,        setProvincia]         = useState("");
  const [aceptaPrivacidad, setAceptaPrivacidad]  = useState(false);
  const [submitted,        setSubmitted]         = useState(false);
  const [submitting,       setSubmitting]        = useState(false);
  const [submitError,      setSubmitError]       = useState(null);
  const [codigoReclamo,    setCodigoReclamo]     = useState("");
  const [errors,           setErrors]            = useState({});

  const [form, setForm] = useState({
    nombre: "", dni: "", celular: "", email: "",
    domicilio: "", distrito: "",
    montoReclamado: "", nroPedido: "",
    descripcionContratado: "", detalle: "",
  });

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) =>
      setWindowDimensions(window)
    );
    return () => sub?.remove();
  }, []);

  // Reset provincia when departamento changes
  useEffect(() => { setProvincia(""); }, [departamento]);

  const isSmall  = windowDimensions.width < 768;
  const isMobile = windowDimensions.width < 600;
  const contentWidth = Math.min(windowDimensions.width - (isMobile ? 32 : 80), 860);

  const setField = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.nombre.trim())               e.nombre    = "Requerido";
    if (!form.dni.trim())                  e.dni       = "Requerido";
    if (!form.celular.trim())              e.celular   = "Requerido";
    if (!form.email.trim())                e.email     = "Requerido";
    if (!departamento)                     e.departamento = "Selecciona un departamento";
    if (!provincia)                        e.provincia  = "Selecciona una provincia";
    if (!tipoContratado)                   e.tipoContratado = "Selecciona un tipo";
    if (!form.descripcionContratado.trim()) e.descripcionContratado = "Requerido";
    if (!tipoReclamacion)                  e.tipoReclamacion = "Selecciona un tipo";
    if (!form.detalle.trim())              e.detalle   = "Requerido";
    if (!aceptaPrivacidad)                 e.privacidad = "Debes aceptar la política de privacidad";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    const year = new Date().getFullYear();
    const seq  = Date.now().toString().slice(-6);
    const codigo = `REC-${year}-${seq}`;

    const payload = {
      codigoReclamo:         codigo,
      createdAt:             serverTimestamp(),
      status:                "pendiente",
      // Consumer
      nombre:                form.nombre.trim(),
      dni:                   form.dni.trim(),
      celular:               form.celular.trim(),
      email:                 form.email.trim(),
      domicilio:             form.domicilio.trim(),
      departamento,
      provincia,
      distrito:              form.distrito.trim(),
      // What was bought
      tipoContratado,
      montoReclamado:        form.montoReclamado.trim(),
      nroPedido:             form.nroPedido.trim(),
      descripcionContratado: form.descripcionContratado.trim(),
      // Claim
      tipoReclamacion,
      detalle:               form.detalle.trim(),
    };

    try {
      if (db) {
        await addDoc(collection(db, "reclamaciones"), payload);
      }
      await sendEmailNotification(payload).catch(() => {});
      setCodigoReclamo(codigo);
      setSubmitted(true);
    } catch (err) {
      setSubmitError("No se pudo enviar el reclamo. Inténtalo nuevamente o escríbenos a burmes.jewelry@gmail.com");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setCodigoReclamo("");
    setForm({ nombre:"",dni:"",celular:"",email:"",domicilio:"",distrito:"",montoReclamado:"",nroPedido:"",descripcionContratado:"",detalle:"" });
    setTipoContratado("");
    setTipoReclamacion("");
    setDepartamento("");
    setProvincia("");
    setAceptaPrivacidad(false);
    setErrors({});
  };

  // ─── Helper renderers ────────────────────────────────────────────────────────
  const sectionLabel = (n, text) => (
    <View style={styles.sectionLabelRow}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>{n}</Text>
      </View>
      <Text style={styles.sectionLabelText}>{text}</Text>
    </View>
  );

  const field = (label, key, opts = {}) => (
    <View style={[styles.fieldGroup, opts.half && !isMobile && { width: "48%" }]}>
      <Text style={styles.fieldLabel}>{label}{opts.required !== false ? " *" : ""}</Text>
      <TextInput
        style={[
          styles.input,
          opts.multiline && { height: 90, textAlignVertical: "top" },
          errors[key] && styles.inputError,
        ]}
        value={form[key]}
        onChangeText={(v) => setField(key, v)}
        placeholder={opts.placeholder || ""}
        placeholderTextColor="#aaa"
        multiline={!!opts.multiline}
        keyboardType={opts.keyboard || "default"}
      />
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

  const optionBtn = (label, current, onSelect, errorKey) => (
    <TouchableOpacity
      style={[styles.optionBtn, current === label && styles.optionBtnActive]}
      onPress={() => { onSelect(label); setErrors((e) => ({ ...e, [errorKey]: undefined })); }}
      activeOpacity={0.8}
    >
      <View style={[styles.radio, current === label && styles.radioActive]} />
      <Text style={[styles.optionBtnText, current === label && styles.optionBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  // ─── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.successBox, { width: contentWidth, alignSelf: "center", marginTop: 140, marginBottom: 60 }]}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Reclamo registrado</Text>
          <View style={styles.codigoBox}>
            <Text style={styles.codigoLabel}>Código de reclamo</Text>
            <Text style={styles.codigoCodigo} selectable>{codigoReclamo}</Text>
          </View>
          <Text style={styles.successBody}>
            Hemos recibido tu reclamo. Guarda el código de referencia y nos comunicaremos contigo en un plazo máximo de{" "}
            <Text style={{ fontWeight: "700" }}>30 días calendario</Text> al correo electrónico proporcionado.
          </Text>
          <TouchableOpacity style={styles.submitBtn} onPress={resetForm}>
            <Text style={styles.submitBtnText}>Enviar otro reclamo</Text>
          </TouchableOpacity>
        </View>
        <Footer onNavigate={onNavigate} />
      </ScrollView>
    );
  }

  // ─── Main form ───────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.heroInner, { paddingHorizontal: isMobile ? 20 : 60 }]}>
          <Image
            source={require("../assets/libroReclamaciones.png")}
            style={[styles.heroImage, { width: isMobile ? 100 : 140, height: isMobile ? 100 : 140 }]}
            resizeMode="contain"
          />
          <Text style={[styles.heroTitle, { fontSize: isMobile ? 24 : isSmall ? 32 : 40 }]}>
            Libro de Reclamaciones Virtual
          </Text>
          <View style={styles.heroDivider} />
          <Text style={[styles.heroSubtitle, { fontSize: isMobile ? 13 : 15 }]}>
            En caso desee presentar un reclamo o queja puede hacerlo a continuación.{"\n"}
            Ley N° 29571 — Código de Protección y Defensa del Consumidor
          </Text>
        </View>
      </View>

      {/* Company Info Bar */}
      <View style={[styles.infoBar, { paddingHorizontal: isMobile ? 20 : 60 }]}>
        <View style={[styles.infoGrid, { flexDirection: isMobile ? "column" : "row" }]}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Razón Social</Text>
            <Text style={styles.infoValue}>BURMES & CO S.A.C.</Text>
          </View>
          <View style={[styles.infoSep, isMobile && { display: "none" }]} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>RUC</Text>
            <Text style={styles.infoValue}>20613752367</Text>
          </View>
          <View style={[styles.infoSep, isMobile && { display: "none" }]} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Correo</Text>
            <Text style={styles.infoValue}>burmes.jewelry@gmail.com</Text>
          </View>
          <View style={[styles.infoSep, isMobile && { display: "none" }]} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>+51 969 762 316</Text>
          </View>
        </View>
      </View>

      {/* Form */}
      <View style={{ alignItems: "center", paddingHorizontal: isMobile ? 16 : 40, paddingBottom: 60 }}>
        <View style={[styles.formCard, { width: contentWidth }]}>

          {/* ── SECCIÓN 1: Identificación del consumidor ── */}
          {sectionLabel("1", "IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE")}

          <View style={[styles.row, { flexDirection: isMobile ? "column" : "row", gap: 16 }]}>
            {field("Nombre y Apellidos", "nombre", { required: true })}
          </View>
          <View style={[styles.row, { flexDirection: isMobile ? "column" : "row", gap: 16 }]}>
            {field("DNI / C.E.", "dni", { half: true })}
            {field("Celular", "celular", { half: true, keyboard: "phone-pad" })}
          </View>
          <View style={styles.row}>
            {field("Correo electrónico", "email", { keyboard: "email-address" })}
          </View>
          <View style={styles.row}>
            {field("Dirección / Domicilio", "domicilio", { placeholder: "Calle, número, referencia", required: false })}
          </View>

          {/* UBIGEO */}
          <View style={[styles.row, { flexDirection: isMobile ? "column" : "row", gap: 16 }]}>
            <View style={[styles.fieldGroup, !isMobile && { width: "48%" }]}>
              <Text style={styles.fieldLabel}>Departamento *</Text>
              <PeruSelect
                value={departamento}
                onChange={(v) => { setDepartamento(v); setErrors((e) => ({ ...e, departamento: undefined })); }}
                options={DEPARTAMENTOS}
                placeholder="Seleccionar departamento"
              />
              {errors.departamento && <Text style={styles.errorText}>{errors.departamento}</Text>}
            </View>
            <View style={[styles.fieldGroup, !isMobile && { width: "48%" }]}>
              <Text style={styles.fieldLabel}>Provincia *</Text>
              <PeruSelect
                value={provincia}
                onChange={(v) => { setProvincia(v); setErrors((e) => ({ ...e, provincia: undefined })); }}
                options={departamento ? (PROVINCIAS[departamento] || []) : []}
                placeholder={departamento ? "Seleccionar provincia" : "Primero elige departamento"}
              />
              {errors.provincia && <Text style={styles.errorText}>{errors.provincia}</Text>}
            </View>
          </View>
          <View style={styles.row}>
            {field("Distrito", "distrito", { placeholder: "Ej: Miraflores", required: false })}
          </View>

          <View style={styles.formDivider} />

          {/* ── SECCIÓN 2: Identificación del bien contratado ── */}
          {sectionLabel("2", "IDENTIFICACIÓN DEL BIEN CONTRATADO")}

          <Text style={styles.fieldLabel}>Tipo *</Text>
          <View style={[styles.optionRow, { flexDirection: isMobile ? "column" : "row" }]}>
            {optionBtn("Producto", tipoContratado, setTipoContratado, "tipoContratado")}
            {optionBtn("Servicio", tipoContratado, setTipoContratado, "tipoContratado")}
          </View>
          {errors.tipoContratado && <Text style={[styles.errorText, { marginTop: -8, marginBottom: 12 }]}>{errors.tipoContratado}</Text>}

          <View style={[styles.row, { flexDirection: isMobile ? "column" : "row", gap: 16 }]}>
            {field("Monto reclamado (S/)", "montoReclamado", { half: true, keyboard: "numeric", required: false })}
            {field("N° de Pedido / Orden", "nroPedido", { half: true, required: false })}
          </View>
          <View style={styles.row}>
            {field("Descripción del bien contratado", "descripcionContratado", { multiline: true })}
          </View>

          <View style={styles.formDivider} />

          {/* ── SECCIÓN 3: Detalle de la reclamación ── */}
          {sectionLabel("3", "DETALLE DE LA RECLAMACIÓN")}

          <Text style={styles.fieldLabel}>Tipo de reclamación *</Text>
          <View style={[styles.optionRow, { flexDirection: isMobile ? "column" : "row" }]}>
            {optionBtn("Reclamo", tipoReclamacion, setTipoReclamacion, "tipoReclamacion")}
            {optionBtn("Queja",   tipoReclamacion, setTipoReclamacion, "tipoReclamacion")}
          </View>
          {errors.tipoReclamacion && <Text style={[styles.errorText, { marginTop: -8, marginBottom: 12 }]}>{errors.tipoReclamacion}</Text>}

          <Text style={styles.optionNote}>
            <Text style={{ color: "#C9A961", fontWeight: "600" }}>Reclamo: </Text>Disconformidad relacionada a los productos o servicios.{"\n"}
            <Text style={{ color: "#C9A961", fontWeight: "600" }}>Queja: </Text>Disconformidad no relacionada a los productos o servicios, o malestar en la atención al público.
          </Text>

          <View style={styles.row}>
            {field("Detalle del reclamo o queja", "detalle", { multiline: true })}
          </View>

          <View style={styles.formDivider} />

          {/* Privacy + Submit */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => { setAceptaPrivacidad((v) => !v); setErrors((e) => ({ ...e, privacidad: undefined })); }}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, aceptaPrivacidad && styles.checkboxChecked]}>
              {aceptaPrivacidad && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>
              He leído y acepto la{" "}
              <Text style={{ color: "#C9A961", textDecorationLine: "underline" }}>
                política de privacidad de datos
              </Text>{" "}
              de BURMES & CO S.A.C.
            </Text>
          </TouchableOpacity>
          {errors.privacidad && <Text style={[styles.errorText, { marginBottom: 12 }]}>{errors.privacidad}</Text>}

          {submitError && (
            <View style={styles.submitErrorBox}>
              <Text style={styles.submitErrorText}>{submitError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={submitting ? 1 : 0.8}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#C9A961" />
              : <Text style={styles.submitBtnText}>Enviar Reclamo</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Legal notice */}
        <View style={[styles.legalBox, { width: contentWidth }]}>
          <Text style={styles.legalTitle}>AVISO AL CONSUMIDOR</Text>
          <Text style={styles.legalText}>
            • El proveedor deberá dar respuesta al reclamo en un plazo no mayor de{" "}
            <Text style={{ fontWeight: "600" }}>30 días calendario</Text>, pudiendo ampliarse hasta 30 días más con previa comunicación al consumidor.
          </Text>
          <Text style={styles.legalText}>
            • La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el{" "}
            <Text style={{ fontWeight: "600" }}>INDECOPI</Text>.
          </Text>
          <Text style={styles.legalText}>
            • En caso no consigne como mínimo su nombre, DNI, domicilio o correo electrónico, y el detalle del reclamo, de conformidad con el Art. 5 del Reglamento del Libro de Reclamaciones (DS 011-2011-PCM), su reclamo se considera como no presentado.
          </Text>
        </View>
      </View>

      <Footer onNavigate={onNavigate} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f7f4" },
  scrollContent: { flexGrow: 1 },

  hero: {
    backgroundColor: "#1a1a1a",
    paddingTop: 120,
    paddingBottom: 60,
    alignItems: "center",
  },
  heroInner: { alignItems: "center", maxWidth: 700, width: "100%" },
  heroImage: { marginBottom: 28 },
  heroTitle: {
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    fontFamily: "'Cinzel', Georgia, serif",
  },
  heroDivider: { width: 60, height: 2, backgroundColor: "#C9A961", marginVertical: 20 },
  heroSubtitle: {
    color: "#cccccc",
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "sans-serif",
  },

  infoBar: { backgroundColor: "#111111", paddingVertical: 28 },
  infoGrid: {
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  infoItem: { alignItems: "center", paddingHorizontal: 20 },
  infoLabel: {
    color: "#C9A961",
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
    marginBottom: 4,
  },
  infoValue: { color: "#ffffff", fontSize: 13, fontFamily: "sans-serif", fontWeight: "500" },
  infoSep: { width: 1, height: 40, backgroundColor: "#333" },

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 4,
    padding: 40,
    marginTop: 48,
    borderWidth: 1,
    borderColor: "#e8e0d5",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }
      : { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }),
  },

  sectionLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 24, marginTop: 8 },
  sectionNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#1a1a1a",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  sectionNumberText: { color: "#C9A961", fontSize: 13, fontWeight: "700" },
  sectionLabelText: { color: "#1a1a1a", fontSize: 12, fontWeight: "700", letterSpacing: 1.5, flex: 1 },

  row: { marginBottom: 16 },
  fieldGroup: { flex: 1 },
  fieldLabel: {
    color: "#555",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: "sans-serif",
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d8d0c8",
    borderRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#1a1a1a",
    backgroundColor: "#faf9f7",
    fontFamily: "sans-serif",
    outlineColor: "#C9A961",
  },
  inputError: { borderColor: "#e53e3e" },
  errorText: { color: "#e53e3e", fontSize: 11, marginTop: 4, fontFamily: "sans-serif" },

  optionRow: { gap: 12, marginBottom: 16, marginTop: 8 },
  optionBtn: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#d8d0c8", borderRadius: 3,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: "#faf9f7", gap: 10,
  },
  optionBtnActive: { borderColor: "#C9A961", backgroundColor: "#fdf8ee" },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#bbb" },
  radioActive: { borderColor: "#C9A961", backgroundColor: "#C9A961" },
  optionBtnText: { fontSize: 14, color: "#555", fontFamily: "sans-serif" },
  optionBtnTextActive: { color: "#1a1a1a", fontWeight: "600" },
  optionNote: {
    fontSize: 12, color: "#777", lineHeight: 18,
    fontFamily: "sans-serif", marginBottom: 16,
  },

  formDivider: { height: 1, backgroundColor: "#ece6dd", marginVertical: 28 },

  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 20, marginTop: 4 },
  checkbox: {
    width: 20, height: 20, borderRadius: 3,
    borderWidth: 2, borderColor: "#bbb",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#faf9f7", marginTop: 2,
  },
  checkboxChecked: { borderColor: "#C9A961", backgroundColor: "#C9A961" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  checkLabel: { fontSize: 13, color: "#555", fontFamily: "sans-serif", flex: 1, lineHeight: 20 },

  submitErrorBox: {
    backgroundColor: "#fff5f5",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#feb2b2",
    padding: 14,
    marginBottom: 16,
  },
  submitErrorText: { color: "#c53030", fontSize: 13, fontFamily: "sans-serif", lineHeight: 20 },

  submitBtn: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    borderRadius: 3,
    alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: "#aaa" },
  submitBtnText: {
    color: "#C9A961", fontSize: 14, fontWeight: "700",
    letterSpacing: 2, fontFamily: "sans-serif", textTransform: "uppercase",
  },

  legalBox: {
    marginTop: 32, padding: 28,
    backgroundColor: "#f0ebe4", borderRadius: 4,
    borderLeftWidth: 3, borderLeftColor: "#C9A961",
    marginBottom: 8,
  },
  legalTitle: {
    fontSize: 11, fontWeight: "700", letterSpacing: 1.5,
    color: "#1a1a1a", marginBottom: 14,
    fontFamily: "sans-serif", textTransform: "uppercase",
  },
  legalText: { fontSize: 12, color: "#666", lineHeight: 20, marginBottom: 10, fontFamily: "sans-serif" },

  // Success
  successBox: {
    backgroundColor: "#fff", borderRadius: 4, padding: 48,
    alignItems: "center", borderWidth: 1, borderColor: "#e8e0d5",
  },
  successIcon: { fontSize: 48, color: "#C9A961", marginBottom: 16 },
  successTitle: {
    fontSize: 28, fontWeight: "700", color: "#1a1a1a",
    marginBottom: 20, fontFamily: "'Cinzel', Georgia, serif",
  },
  codigoBox: {
    backgroundColor: "#f9f5eb", borderWidth: 1, borderColor: "#d4b96a",
    borderRadius: 4, paddingVertical: 16, paddingHorizontal: 32,
    alignItems: "center", marginBottom: 20, width: "100%",
  },
  codigoLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: "#888", textTransform: "uppercase", marginBottom: 6 },
  codigoCodigo: {
    fontSize: 22, fontWeight: "700", color: "#1a1a1a",
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
    letterSpacing: 2,
  },
  successBody: {
    fontSize: 14, color: "#666", textAlign: "center",
    lineHeight: 22, fontFamily: "sans-serif",
    marginBottom: 32, maxWidth: 460,
  },
});

export default LibroReclamaciones;
