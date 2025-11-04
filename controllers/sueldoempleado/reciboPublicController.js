// Sirve el PDF del recibo verificando HMAC + exp
import PDFDocument from "pdfkit";
import crypto from "crypto";
// IMPORTA TUS MODELOS
import LiquidacionRecibo from "../../models/sueldoempleado/recibo.js";
import LiquidacionItem from "../../models/sueldoempleado/reciboitem.js";
import PeriodoLiquidacion from "../../models/sueldoempleado/periodoliquidacion.js";
import Empleado from "../../models/tablas/empleadoModel.js";

/** verifica HMAC + expiración (+5min gracia) */
function verifySignedPath(pathWithQuery, secret, grace = 300) {
  const url = new URL("http://dummy" + pathWithQuery); // parsear
  const exp = Number(url.searchParams.get("exp"));
  const sig = url.searchParams.get("sig");
  if (!exp || !sig) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now > exp + grace) return false;

  url.searchParams.delete("sig");
  const base = url.pathname + "?" + url.searchParams.toString();

  const expected = crypto.createHmac("sha256", secret).update(base).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/** helper número a 2 decimales */
const n2 = (v) => Number(v ?? 0).toFixed(2);

/**
 * GET /public/recibo/:id.pdf?exp=...&sig=...
 * Devuelve el PDF (inline) si la firma es válida
 */
export async function getReciboPdfPublic(req, res) {
  try {
    const secret = process.env.PDF_SIGN_SECRET;
    if (!secret) return res.status(500).send("Falta PDF_SIGN_SECRET");

    // Verificar firma + exp
    const fullPath = req.originalUrl; // path+query exacto
    if (!verifySignedPath(fullPath, secret)) {
      return res.status(403).send("Link inválido o expirado.");
    }

    const id = Number(req.params.id);
    if (!id) return res.status(400).send("ID inválido.");

    // Traer recibo con todo lo necesario para el PDF
    const recibo = await LiquidacionRecibo.findByPk(id, {
      include: [
        { model: PeriodoLiquidacion, as: "Periodo" },
        { model: Empleado, as: "Empleado" },
        { model: LiquidacionItem, as: "Items" },
      ],
    });

    if (!recibo) return res.status(404).send("Recibo no encontrado.");

    const periodoStr = recibo?.Periodo
      ? `${recibo.Periodo.anio}-${String(recibo.Periodo.mes).padStart(2, "0")}`
      : `#${recibo.periodo_id}`;

    // Armar nombre empleado (ajusta campos según tu esquema real)
    const empleadoNombre = [
      recibo?.Empleado?.apellido || "",
      recibo?.Empleado?.nombre || "",
    ].join(" ").trim() || `Empleado #${recibo.empleado_id}`;

    // Responder PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="recibo-${id}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    // Encabezado
    doc.fontSize(16).text("Recibo de Sueldo");
    doc.fontSize(10).fillColor("#666").text(`ID #${id}  •  Período: ${periodoStr}`).moveDown();

    doc.fillColor("#000").fontSize(12).text(`Empleado: ${empleadoNombre}`);
    doc.text(`Estado: ${String(recibo.estado).toUpperCase()}`);
    doc.moveDown();

    // Totales
    doc.text(`Sueldo: $${n2(recibo.sueldo)}`);
    doc.text(`A cobrar por banco: $${n2(recibo.acobrarporbanco)}`);
    doc.text(`Total haberes: $${n2(recibo.totalhaberes)}`);
    doc.text(`Descuentos: $${n2(recibo.descuentos)}`);
    doc.text(`A cobrar en sucursal: $${n2(recibo.acobrarporsucursal)}`);
    doc.moveDown();

    // Fijos
    doc.fontSize(12).text("Adicionales fijos vigentes", { underline: true });
    (recibo.Items || []).filter(i => i.tipo === "FIJO").forEach(i => {
      doc.fontSize(10).text(`#${i.id}  ${i.descripcion || "—"}  $${n2(i.monto_total)}`);
    });
    doc.moveDown();
    // Variables / Descuentos (sin columna "tipo")
    doc.fontSize(12).text("Adicionales y Descuentos del período", { underline: true });
    (recibo.Items || []).filter(i => i.tipo !== "FIJO").forEach(i => {
      doc.fontSize(10).text(`#${i.id}  ${i.descripcion || "—"}  $${n2(i.monto_total)}`);
    });

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).send("Error generando PDF.");
  }
}
