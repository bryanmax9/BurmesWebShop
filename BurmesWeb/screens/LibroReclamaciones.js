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
} from "react-native";
import Footer from "../Shared/Footer";

const LibroReclamaciones = ({ onNavigate }) => {
  const [windowDimensions, setWindowDimensions] = useState(
    Dimensions.get("window")
  );
  const [tipoContratado, setTipoContratado] = useState("");
  const [tipoReclamacion, setTipoReclamacion] = useState("");
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    domicilio: "",
    dni: "",
    celular: "",
    email: "",
    montoReclamado: "",
    descripcionContratado: "",
    detalle: "",
    pedido: "",
  });

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setWindowDimensions(window);
    });
    return () => sub?.remove();
  }, []);

  const isSmall = windowDimensions.width < 768;
  const isMobile = windowDimensions.width < 600;
  const contentWidth = Math.min(windowDimensions.width - (isMobile ? 32 : 80), 860);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    if (!aceptaPrivacidad) return;
    setSubmitted(true);
  };

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
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, opts.multiline && { height: 90, textAlignVertical: "top" }]}
        value={form[key]}
        onChangeText={(v) => setField(key, v)}
        placeholder={opts.placeholder || ""}
        placeholderTextColor="#888"
        multiline={!!opts.multiline}
        keyboardType={opts.keyboard || "default"}
      />
    </View>
  );

  const optionBtn = (label, current, onSelect) => (
    <TouchableOpacity
      style={[styles.optionBtn, current === label && styles.optionBtnActive]}
      onPress={() => onSelect(label)}
      activeOpacity={0.8}
    >
      <View style={[styles.radio, current === label && styles.radioActive]} />
      <Text style={[styles.optionBtnText, current === label && styles.optionBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (submitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.successBox, { width: contentWidth, alignSelf: "center", marginTop: 140, marginBottom: 60 }]}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Reclamo enviado</Text>
          <Text style={styles.successBody}>
            Hemos recibido tu reclamo. Nos comunicaremos contigo en un plazo máximo de 30 días calendario a través del correo electrónico proporcionado.
          </Text>
          <TouchableOpacity style={styles.submitBtn} onPress={() => { setSubmitted(false); setForm({ nombre:"",domicilio:"",dni:"",celular:"",email:"",montoReclamado:"",descripcionContratado:"",detalle:"",pedido:"" }); setAceptaPrivacidad(false); setTipoContratado(""); setTipoReclamacion(""); }}>
            <Text style={styles.submitBtnText}>Enviar otro reclamo</Text>
          </TouchableOpacity>
        </View>
        <Footer onNavigate={onNavigate} />
      </ScrollView>
    );
  }

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
            style={[styles.heroImage, { width: isMobile ? 120 : 160, height: isMobile ? 120 : 160 }]}
            resizeMode="contain"
          />
          <Text style={[styles.heroTitle, { fontSize: isMobile ? 28 : isSmall ? 36 : 44 }]}>
            Libro de Reclamaciones Virtual
          </Text>
          <View style={styles.heroDivider} />
          <Text style={[styles.heroSubtitle, { fontSize: isMobile ? 13 : 15 }]}>
            En caso desee presentar un reclamo o queja puede hacerlo a continuación.
          </Text>
        </View>
      </View>

      {/* Company Info */}
      <View style={[styles.infoBar, { paddingHorizontal: isMobile ? 20 : 60 }]}>
        <View style={[styles.infoGrid, { flexDirection: isMobile ? "column" : "row" }]}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Razón Social</Text>
            <Text style={styles.infoValue}>BURMES & CO. S.A.C.</Text>
          </View>
          <View style={[styles.infoSep, isMobile && { display: "none" }]} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Correo de contacto</Text>
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

          {/* Section 1 */}
          {sectionLabel("1", "IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE")}
          <View style={[styles.row, { flexDirection: isMobile ? "column" : "row" }]}>
            {field("Nombre y Apellidos", "nombre")}
          </View>
          <View style={[styles.row, { flexDirection: isMobile ? "column" : "row" }]}>
            {field("Domicilio", "domicilio")}
          </View>
          <View style={[styles.row, { flexDirection: isMobile ? "column" : "row", gap: 16 }]}>
            {field("DNI / C.E.", "dni", { half: true })}
            {field("Celular", "celular", { half: true, keyboard: "phone-pad" })}
          </View>
          <View style={styles.row}>
            {field("Email", "email", { keyboard: "email-address" })}
          </View>

          <View style={styles.formDivider} />

          {/* Section 2 */}
          {sectionLabel("2", "IDENTIFICACIÓN DE LO CONTRATADO")}
          <Text style={styles.fieldLabel}>Tipo</Text>
          <View style={[styles.optionRow, { flexDirection: isMobile ? "column" : "row" }]}>
            {optionBtn("Producto", tipoContratado, setTipoContratado)}
            {optionBtn("Servicio", tipoContratado, setTipoContratado)}
          </View>
          <View style={[styles.row, { flexDirection: isMobile ? "column" : "row", gap: 16 }]}>
            {field("Monto Reclamado (de aplicar)", "montoReclamado", { half: true, keyboard: "numeric" })}
            {field("N° de Pedido", "pedido", { half: true })}
          </View>
          <View style={styles.row}>
            {field("Descripción del bien contratado", "descripcionContratado", { multiline: true })}
          </View>

          <View style={styles.formDivider} />

          {/* Section 3 */}
          {sectionLabel("3", "DETALLE DE LA RECLAMACIÓN")}
          <Text style={styles.fieldLabel}>Tipo de reclamación</Text>
          <View style={[styles.optionRow, { flexDirection: isMobile ? "column" : "row" }]}>
            {optionBtn("Reclamo", tipoReclamacion, setTipoReclamacion)}
            {optionBtn("Queja", tipoReclamacion, setTipoReclamacion)}
          </View>
          <Text style={[styles.optionNote, { marginTop: 4 }]}>
            <Text style={{ color: "#C9A961" }}>Reclamo: </Text>Disconformidad relacionada a los productos o servicios.{"\n"}
            <Text style={{ color: "#C9A961" }}>Queja: </Text>Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.
          </Text>
          <View style={styles.row}>
            {field("Detalle de la reclamación", "detalle", { multiline: true })}
          </View>

          <View style={styles.formDivider} />

          {/* Privacy */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAceptaPrivacidad((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, aceptaPrivacidad && styles.checkboxChecked]}>
              {aceptaPrivacidad && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>
              He leído y acepto la{" "}
              <Text style={{ color: "#C9A961", textDecorationLine: "underline" }}>
                política de privacidad de datos
              </Text>
              .
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, !aceptaPrivacidad && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={aceptaPrivacidad ? 0.8 : 1}
          >
            <Text style={styles.submitBtnText}>Enviar Reclamo</Text>
          </TouchableOpacity>
        </View>

        {/* Legal notice */}
        <View style={[styles.legalBox, { width: contentWidth }]}>
          <Text style={styles.legalTitle}>OBSERVACIONES Y ACCIONES ADOPTADAS POR EL PROVEEDOR</Text>
          <Text style={styles.legalText}>
            El proveedor deberá dar respuesta al reclamo en un plazo no mayor de treinta (30) días calendario, pudiendo ampliar el plazo hasta por treinta (30) días más, previa comunicación al consumidor.
          </Text>
          <Text style={styles.legalText}>
            La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.
          </Text>
          <Text style={styles.legalText}>
            En caso no consigne como mínimo su nombre, DNI, domicilio o correo electrónico, reclamo o queja y el detalle del mismo, de conformidad con el artículo 5 del Reglamento del Libro de Reclamaciones, su reclamo o queja se considera como no presentado.
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

  /* Hero */
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
  heroDivider: {
    width: 60,
    height: 2,
    backgroundColor: "#C9A961",
    marginVertical: 20,
  },
  heroSubtitle: {
    color: "#cccccc",
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "sans-serif",
  },

  /* Info bar */
  infoBar: {
    backgroundColor: "#111111",
    paddingVertical: 28,
  },
  infoGrid: {
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  infoItem: { alignItems: "center", paddingHorizontal: 20 },
  infoLabel: {
    color: "#C9A961",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "sans-serif",
    marginBottom: 4,
  },
  infoValue: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "sans-serif",
    fontWeight: "500",
  },
  infoSep: { width: 1, height: 40, backgroundColor: "#333" },

  /* Form card */
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

  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionNumberText: {
    color: "#C9A961",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "sans-serif",
  },
  sectionLabelText: {
    color: "#1a1a1a",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: "sans-serif",
    flex: 1,
  },

  row: { marginBottom: 16 },
  fieldGroup: { flex: 1 },
  fieldLabel: {
    color: "#555",
    fontSize: 12,
    fontWeight: "600",
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

  optionRow: { gap: 12, marginBottom: 16, marginTop: 8 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d8d0c8",
    borderRadius: 3,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#faf9f7",
    gap: 10,
  },
  optionBtnActive: {
    borderColor: "#C9A961",
    backgroundColor: "#fdf8ee",
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#bbb",
  },
  radioActive: { borderColor: "#C9A961", backgroundColor: "#C9A961" },
  optionBtnText: { fontSize: 14, color: "#555", fontFamily: "sans-serif" },
  optionBtnTextActive: { color: "#1a1a1a", fontWeight: "600" },
  optionNote: {
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
    fontFamily: "sans-serif",
    marginBottom: 16,
  },

  formDivider: {
    height: 1,
    backgroundColor: "#ece6dd",
    marginVertical: 28,
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: "#bbb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#faf9f7",
  },
  checkboxChecked: { borderColor: "#C9A961", backgroundColor: "#C9A961" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  checkLabel: {
    fontSize: 13,
    color: "#555",
    fontFamily: "sans-serif",
    flex: 1,
    lineHeight: 20,
  },

  submitBtn: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    borderRadius: 3,
    alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: "#aaa" },
  submitBtnText: {
    color: "#C9A961",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "sans-serif",
    textTransform: "uppercase",
  },

  /* Legal box */
  legalBox: {
    marginTop: 32,
    padding: 28,
    backgroundColor: "#f0ebe4",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#C9A961",
    marginBottom: 8,
  },
  legalTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#1a1a1a",
    marginBottom: 14,
    fontFamily: "sans-serif",
    textTransform: "uppercase",
  },
  legalText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: "sans-serif",
  },

  /* Success */
  successBox: {
    backgroundColor: "#fff",
    borderRadius: 4,
    padding: 48,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e0d5",
  },
  successIcon: {
    fontSize: 48,
    color: "#C9A961",
    marginBottom: 16,
    fontFamily: "sans-serif",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
    fontFamily: "'Cinzel', Georgia, serif",
  },
  successBody: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    fontFamily: "sans-serif",
    marginBottom: 32,
    maxWidth: 460,
  },
});

export default LibroReclamaciones;
