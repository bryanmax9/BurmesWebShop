import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import Footer from "../Shared/Footer";

const LAST_UPDATED = "14 de mayo de 2026";

const Section = ({ number, title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{number}. {title}</Text>
    {children}
  </View>
);

const P = ({ children, style }) => (
  <Text style={[styles.paragraph, style]}>{children}</Text>
);

const Li = ({ children }) => (
  <View style={styles.listItem}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.listText}>{children}</Text>
  </View>
);

const TerminosCondiciones = ({ onNavigate }) => {
  const width = Dimensions.get("window").width;
  const isMobile = width < 600;
  const contentWidth = Math.min(width - (isMobile ? 32 : 80), 860);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={[styles.heroEyebrow]}>BURMES & CO S.A.C.</Text>
        <Text style={[styles.heroTitle, { fontSize: isMobile ? 28 : 38 }]}>
          Términos y Condiciones
        </Text>
        <View style={styles.heroDivider} />
        <Text style={styles.heroSub}>
          Última actualización: {LAST_UPDATED}
        </Text>
      </View>

      <View style={{ alignItems: "center", paddingHorizontal: isMobile ? 16 : 40, paddingBottom: 80 }}>
        <View style={[styles.card, { width: contentWidth }]}>

          {/* Intro notice */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              LEA ESTOS TÉRMINOS DETENIDAMENTE ANTES DE CONTINUAR.{" "}
              Al acceder o utilizar este sitio web usted declara que ha leído,
              entendido y acepta la totalidad de estos Términos y Condiciones.
            </Text>
          </View>

          {/* 1 */}
          <Section number="1" title="Introducción">
            <P>
              Bienvenido al sitio web de <Text style={styles.bold}>BURMES & CO S.A.C.</Text> ("BURMES & CO", "nosotros", "nos" o "nuestro").
              Para los efectos de los presentes Términos y Condiciones ("los TyC"), "usuario" y "su" se refieren a usted como visitante o usuario registrado de este sitio web.
            </P>
            <P>
              Los presentes TyC regulan el acceso y uso del sitio web de BURMES & CO.
              Si usted no los acepta en su totalidad, deberá interrumpir inmediatamente su uso.
              El simple uso del sitio web implica la aceptación íntegra de los presentes TyC.
            </P>
          </Section>

          {/* 2 */}
          <Section number="2" title="Identificación del proveedor">
            <P>En cumplimiento del artículo 2 del Código de Protección y Defensa del Consumidor (Ley 29571), ponemos a disposición nuestra información de contacto:</P>
            <View style={styles.infoTable}>
              {[
                ["Razón Social",        "BURMES & CO SOCIEDAD ANÓNIMA CERRADA"],
                ["RUC",                 "20613752367"],
                ["Domicilio",           "Av. La Encalada 1415, Tienda 203-B, Santiago de Surco, Lima"],
                ["Correo de contacto",  "burmes.jewelry@gmail.com"],
                ["Teléfono / WhatsApp", "+51 969 762 316"],
              ].map(([label, value]) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* 3 */}
          <Section number="3" title="Objeto del sitio web">
            <P>
              El sitio web de BURMES & CO funciona exclusivamente como una{" "}
              <Text style={styles.bold}>vitrina digital de productos</Text>. En él se exhiben joyas, relojes y otros artículos de lujo con fines informativos y de consulta.
            </P>
            <P>
              <Text style={styles.bold}>No se realizan transacciones económicas a través de este sitio web.</Text>{" "}
              Toda adquisición de productos se concreta de forma presencial en nuestra tienda física, previa coordinación de una cita a través de WhatsApp.
            </P>
          </Section>

          {/* 4 */}
          <Section number="4" title="Proceso de adquisición y sistema de citas">
            <P>Dado que BURMES & CO atiende exclusivamente mediante citas presenciales, el proceso es el siguiente:</P>
            <View style={styles.stepList}>
              {[
                "Registre una cuenta en nuestro sitio web con sus datos personales verídicos. El registro sirve para identificar al cliente y garantizar la legitimidad de la consulta.",
                "Explore nuestro catálogo y seleccione el o los productos de su interés.",
                "Contáctenos a través de WhatsApp al +51 969 762 316 indicando su nombre registrado y los productos de interés.",
                "Nuestro equipo coordinará con usted una cita en nuestra tienda ubicada en Av. La Encalada 1415, Tienda 203-B, Santiago de Surco.",
                "La transacción, pago y entrega del producto se realizan íntegramente de forma presencial en la tienda durante la cita acordada.",
              ].map((step, i) => (
                <View key={i} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
            <P style={{ marginTop: 12 }}>
              BURMES & CO se reserva el derecho de rechazar o cancelar una cita si los datos del usuario registrado no coinciden con su identidad real o si existen indicios de uso indebido del servicio.
            </P>
          </Section>

          {/* 5 */}
          <Section number="5" title="Registro de usuario y obligaciones">
            <P>El registro de una cuenta en el sitio web es voluntario pero necesario para acceder a la coordinación de citas. Al registrarse, usted declara y garantiza que:</P>
            <Li>Es mayor de 18 años.</Li>
            <Li>No utiliza la identidad de otra persona.</Li>
            <Li>La información proporcionada es veraz, completa y actualizada.</Li>
            <Li>Ha leído y acepta íntegramente estos TyC y la Política de Privacidad.</Li>
            <P style={{ marginTop: 12 }}>Asimismo, usted se compromete a:</P>
            <Li>Utilizar el sitio web de forma lícita y conforme a estos TyC.</Li>
            <Li>No compartir sus credenciales de acceso con terceros.</Li>
            <Li>Notificar a BURMES & CO ante cualquier uso no autorizado de su cuenta.</Li>
            <Li>Mantener un trato respetuoso en todas las comunicaciones con nuestro equipo.</Li>
          </Section>

          {/* 6 */}
          <Section number="6" title="Política de cambios y devoluciones">
            <P>
              Todas las condiciones de cambio o devolución se coordinan y ejecutan de forma presencial en nuestra tienda de Santiago de Surco.
              Para gestionar cualquier solicitud de cambio o devolución:
            </P>
            <Li>Envíe un mensaje a nuestro WhatsApp (+51 969 762 316) o correo electrónico indicando el motivo de la solicitud y adjuntando copia del comprobante de pago.</Li>
            <Li>BURMES & CO coordinará con usted una cita en nuestra tienda en un plazo máximo de cinco (5) días hábiles.</Li>
            <Li>Los cambios se aceptan dentro de los siete (7) días hábiles desde la entrega del producto, siempre que este se encuentre en las mismas condiciones en que fue recibido, con todos sus accesorios y empaques originales.</Li>
            <Li>En caso de defecto de fabricación confirmado, se procederá a la reparación, cambio de pieza o devolución del monto pagado, según corresponda y a elección del cliente.</Li>
            <Li>Las devoluciones en efectivo se realizarán en un plazo máximo de diez (10) días hábiles desde la aprobación de la solicitud.</Li>
          </Section>

          {/* 7 */}
          <Section number="7" title="Propiedad intelectual">
            <P>
              Todos los contenidos del sitio web de BURMES & CO (incluyendo textos, imágenes, logotipos, íconos, diseños y bases de datos) son propiedad exclusiva de BURMES & CO S.A.C. y están protegidos por la legislación peruana e internacional de propiedad intelectual.
            </P>
            <P>
              Queda prohibida su reproducción, distribución, comunicación pública o cualquier otra forma de uso no autorizado sin el consentimiento previo y por escrito de BURMES & CO.
            </P>
          </Section>

          {/* 8 */}
          <Section number="8" title="Normas de uso">
            <P>El usuario se compromete a utilizar el sitio web de forma lícita. Queda expresamente prohibido:</P>
            <Li>Usar el sitio web con fines fraudulentos, ilícitos o contrarios a estos TyC.</Li>
            <Li>Suplantar la identidad de terceros al registrarse o al contactar a BURMES & CO.</Li>
            <Li>Intentar obtener acceso no autorizado a sistemas o datos del sitio web.</Li>
            <Li>Introducir software malicioso o realizar acciones que perjudiquen el funcionamiento del sitio.</Li>
            <Li>Usar el sitio web para actividades distintas a la consulta de productos y coordinación de citas.</Li>
          </Section>

          {/* 9 */}
          <Section number="9" title="Privacidad y protección de datos personales">
            <P>
              BURMES & CO S.A.C. actúa como responsable del tratamiento de los datos personales recabados a través del registro de usuarios, conforme a la Ley N° 29733 (Ley de Protección de Datos Personales) y su Reglamento aprobado mediante DS 016-2024-JUS.
            </P>
            <P>
              Los datos personales del usuario (nombre, correo electrónico, teléfono y demás información provista) se utilizan exclusivamente para la verificación de identidad, coordinación de citas y comunicación relacionada con los productos de BURMES & CO.
              No compartimos esta información con terceros sin su consentimiento, salvo obligación legal.
            </P>
            <P>Consulte nuestra Política de Privacidad para mayor detalle.</P>
          </Section>

          {/* 10 */}
          <Section number="10" title="Responsabilidad">
            <P>
              BURMES & CO no será responsable por interrupciones, errores o limitaciones del sitio web derivadas de caso fortuito, fuerza mayor, fallas en el servicio de internet del usuario o actuaciones de terceros ajenas a su control.
            </P>
            <P>
              Las imágenes y descripciones de los productos en el sitio web tienen fines ilustrativos. BURMES & CO realiza sus mejores esfuerzos para que sean precisas, pero el usuario deberá verificar las características del producto en la cita presencial antes de realizar cualquier transacción.
            </P>
          </Section>

          {/* 11 */}
          <Section number="11" title="Libro de Reclamaciones">
            <P>
              BURMES & CO S.A.C. pone a disposición de sus usuarios un{" "}
              <Text style={styles.bold}>Libro de Reclamaciones Virtual</Text> conforme a la Ley N° 29571 y el DS 011-2011-PCM.
              Los reclamos o quejas serán atendidos en un plazo máximo de treinta (30) días calendario.
            </P>
            <P>
              Acceda al Libro de Reclamaciones desde el enlace en el pie de página de este sitio web o directamente desde la sección "Atención al cliente".
            </P>
          </Section>

          {/* 12 */}
          <Section number="12" title="Resolución de controversias">
            <P>
              Los presentes TyC se rigen por las leyes de la República del Perú.
              Cualquier controversia derivada del uso del sitio web o de la relación comercial entre el usuario y BURMES & CO será sometida a los jueces y tribunales de Lima, Perú, con renuncia expresa al fuero de sus domicilios.
              Lo anterior es sin perjuicio de la competencia del INDECOPI y demás autoridades administrativas pertinentes.
            </P>
          </Section>

          {/* 13 */}
          <Section number="13" title="Actualizaciones">
            <P>
              BURMES & CO se reserva el derecho de actualizar estos TyC en cualquier momento, respetando la legislación vigente.
              Los cambios serán efectivos desde la fecha indicada al pie de este documento.
              El uso continuado del sitio web tras la publicación de cambios implica la aceptación de los nuevos TyC.
            </P>
          </Section>

          {/* 14 */}
          <Section number="14" title="Contacto">
            <P>
              Para cualquier duda, reclamo o consulta relacionada con estos TyC o con nuestros productos, puede contactarnos a través de:
            </P>
            <Li>WhatsApp: +51 969 762 316</Li>
            <Li>Correo: burmes.jewelry@gmail.com</Li>
            <Li>Tienda: Av. La Encalada 1415, Tienda 203-B, Santiago de Surco, Lima</Li>

            <View style={styles.updateNote}>
              <Text style={styles.updateNoteText}>
                Fecha de actualización: <Text style={styles.bold}>{LAST_UPDATED}</Text>
              </Text>
            </View>
          </Section>

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
    paddingHorizontal: 24,
  },
  heroEyebrow: {
    color: "#C9A961",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 14,
    fontFamily: "sans-serif",
  },
  heroTitle: {
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    fontFamily: "'Cinzel', Georgia, serif",
  },
  heroDivider: { width: 50, height: 2, backgroundColor: "#C9A961", marginVertical: 20 },
  heroSub: {
    color: "#aaaaaa",
    fontSize: 13,
    fontFamily: "sans-serif",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 4,
    padding: 40,
    marginTop: 48,
    borderWidth: 1,
    borderColor: "#e8e0d5",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 32px rgba(0,0,0,0.07)" }
      : { shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 16, elevation: 4 }),
  },

  noticeBox: {
    backgroundColor: "#fff8ec",
    borderLeftWidth: 4,
    borderLeftColor: "#C9A961",
    padding: 16,
    borderRadius: 2,
    marginBottom: 32,
  },
  noticeText: {
    fontSize: 13,
    color: "#5a4a2a",
    fontFamily: "sans-serif",
    lineHeight: 20,
    fontWeight: "600",
  },

  section: {
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#ece6dd",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 14,
    letterSpacing: 0.5,
    fontFamily: "sans-serif",
    textTransform: "uppercase",
  },
  paragraph: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    fontFamily: "sans-serif",
    marginBottom: 10,
  },
  bold: { fontWeight: "700", color: "#1a1a1a" },

  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 14,
    color: "#C9A961",
    fontWeight: "700",
    marginRight: 10,
    marginTop: 1,
    fontFamily: "sans-serif",
  },
  listText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    fontFamily: "sans-serif",
    flex: 1,
  },

  infoTable: {
    borderWidth: 1,
    borderColor: "#e8e0d5",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e0d5",
  },
  infoLabel: {
    width: "35%",
    backgroundColor: "#f0ebe4",
    padding: 12,
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    fontFamily: "sans-serif",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 12,
    fontSize: 13,
    color: "#1a1a1a",
    fontFamily: "sans-serif",
  },

  stepList: { marginTop: 10 },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    color: "#C9A961",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "sans-serif",
  },
  stepText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    fontFamily: "sans-serif",
    flex: 1,
  },

  updateNote: {
    marginTop: 24,
    padding: 14,
    backgroundColor: "#f9f7f4",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#e8e0d5",
  },
  updateNoteText: {
    fontSize: 12,
    color: "#888",
    fontFamily: "sans-serif",
    textAlign: "center",
  },
});

export default TerminosCondiciones;
