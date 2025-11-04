import { Router } from "express";
import PDFDocument from "pdfkit";
// Reemplaza por tus servicios reales:


// const router = Router();

// /**
//  * GET /public/recibo/:id.pdf?exp=...&sig=...
//  * Requiere firma HMAC válida + expiración.
//  */
// router.get("/public/recibo/:id.pdf", async (req, res) => {
//   try {
//     const secret = process.env.PDF_SIGN_SECRET;
//     if (!secret) return res.status(500).send("Falta PDF_SIGN_SECRET");

//     // Verificar firma
//     const fullPath = req.originalUrl; // incluye path+query
//     if (!verifySignedPath(fullPath, secret)) {
//       return res.status(403).send("Link inválido o expirado.");
//     }

//     const id = Number(req.params.id);
//     const detalle = await getReciboByIdConDetalles(id);
//     if (!detalle) return res.status(404).send("Recibo no encontrado.");

//     const periodoStr = detalle?.Periodo
//       ? `${detalle.Periodo.anio}-${String(detalle.Periodo.mes).padStart(2, "0")}`
//       : `#${detalle.periodo_id}`;
//     const empleadoNombre = await getEmpleadoNombre(detalle.empleado_id);

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `inline; filename="recibo-${id}.pdf"`);

//     const doc = new PDFDocument({ size: "A4", margin: 40 });
//     doc.pipe(res);

//     doc.fontSize(16).text("Recibo de Sueldo");
//     doc.fontSize(10).fillColor("#666")
//       .text(`ID #${id}  •  Período: ${periodoStr}`)
//       .moveDown();

//     doc.fillColor("#000").fontSize(12).text(`Empleado: ${empleadoNombre}`);
//     doc.text(`Estado: ${String(detalle.estado).toUpperCase()}`);
//     doc.moveDown();

//     const n2 = (v) => Number(v ?? 0).toFixed(2);
//     doc.text(`Sueldo: $${n2(detalle.sueldo)}`);
//     doc.text(`A cobrar por banco: $${n2(detalle.acobrarporbanco)}`);
//     doc.text(`Total haberes: $${n2(detalle.totalhaberes)}`);
//     doc.text(`Descuentos: $${n2(detalle.descuentos)}`);
//     doc.text(`A cobrar en sucursal: $${n2(detalle.acobrarporsucursal)}`);
//     doc.moveDown();

//     doc.fontSize(12).text("Adicionales fijos vigentes", { underline: true });
//     (detalle.Items || []).filter(i => i.tipo === "FIJO").forEach(i => {
//       doc.fontSize(10).text(`#${i.id}  ${i.descripcion || "—"}  $${n2(i.monto_total)}`);
//     });
//     doc.moveDown();

//     doc.fontSize(12).text("Adicionales y Descuentos del período", { underline: true });
//     (detalle.Items || []).filter(i => i.tipo !== "FIJO").forEach(i => {
//       doc.fontSize(10).text(`#${i.id}  [${i.tipo}] ${i.descripcion || "—"}  $${n2(i.monto_total)}`);
//     });

//     doc.end();
//   } catch (e) {
//     console.error(e);
//     res.status(500).send("Error generando PDF.");
//   }
// });

// export default router;
