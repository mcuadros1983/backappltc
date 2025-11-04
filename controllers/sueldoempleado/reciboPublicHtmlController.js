import crypto from "crypto";
// MODELOS (ajusta paths/nombres si difiere tu estructura)
import LiquidacionRecibo from "../../models/sueldoempleado/recibo.js";
import LiquidacionItem from "../../models/sueldoempleado/reciboitem.js";
import PeriodoLiquidacion from "../../models/sueldoempleado/periodoliquidacion.js";
import Empleado from "../../models/tablas/empleadoModel.js";



function verifySignedPath(pathWithQuery, secret, grace = 300) {
  const url = new URL("http://dummy" + pathWithQuery);
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

const fmtAr = (v) =>
  new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Number(v ?? 0));

function buildHtml({ recibo, periodoStr, empleadoNombre }) {
  const itemsFijos = (recibo.Items || []).filter(i => i.tipo === "FIJO");
  const itemsNoFijos = (recibo.Items || [])
    .filter(i => i.tipo !== "FIJO")
    .sort((a, b) => {
      const ma = Number(a.monto_total || 0);
      const mb = Number(b.monto_total || 0);
      if (ma >= 0 && mb < 0) return -1; // positivos primero
      if (ma < 0 && mb >= 0) return 1;
      return 0;
    });

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Recibo de ${empleadoNombre}</title>
  <style>
    /* ===== Base ===== */
    @page { size: A4; margin: 15mm; }
    html, body { height: 100%; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans";
      font-size: 15px; /* móvil por defecto */
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
      -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #111;
      background: #fff;
    }

    .print-root { padding: 16px; max-width: 900px; margin: 0 auto; }

    .row { display: flex; flex-wrap: wrap; gap: 12px; }
    .col-6, .col-4 { flex: 1 1 100%; }
    .no-break { break-inside: avoid; page-break-inside: avoid; }

    h5 { margin: 0 0 6px 0; font-size: 22px; }
    .muted { color: #6c757d; }
    .small { font-size: 0.92em; }
    .sep { margin: 10px 0 16px; border: none; border-top: 1px solid #e5e7eb; }

    .label { font-size: 0.95em; color: #6c757d; margin-bottom: 4px; }
    .field { border: 1px solid #e5e7eb; background: #f8f9fa; padding: 8px 10px; border-radius: 8px; }
    .field.white { background: #fff; }

    .summary { border: 1px solid #e5e7eb; background: #f8f9fa; padding: 10px 12px; border-radius: 8px; height: 100%; }
    .summary .line { display: flex; justify-content: space-between; gap: 8px; margin: 4px 0; }
    .summary .strong { font-weight: 600; }

    .toolbar { display:flex; justify-content:flex-end; gap:8px; margin: 8px 0 12px; }
    .btn { background:#0d6efd; color:#fff; border:none; padding:10px 14px; border-radius:10px; cursor:pointer; font-size: 0.95em; }
    .btn:active { transform: translateY(1px); }

    /* ===== Tablas ===== */
    .table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto; /* auto para que respete colgroup y nowrap */
      background: #fff;
    }
    thead th {
      text-align: left; padding: 10px;
      background: #f3f4f6; border: 1px solid #e5e7eb; font-weight: 600;
      white-space: nowrap;
    }
    tbody td {
      padding: 10px; border: 1px solid #e5e7eb;
      background-clip: padding-box;
    }
    .right {
      text-align: right;
      white-space: nowrap;                /* <- evita que el monto se parta/oculte */
      font-variant-numeric: tabular-nums; /* <- dígitos alineados */
      direction: ltr;
    }
    .center { text-align: center; }
    table, tr, td, th { break-inside: avoid; page-break-inside: avoid; }

    /* ===== Desktop / impresión ===== */
    @media (min-width: 768px) {
      body { font-size: 13px; line-height: 1.35; }
      .row { gap: 16px; }
      .col-6 { flex: 0 0 calc(50% - 8px); max-width: calc(50% - 8px); }
      .col-4 { flex: 0 0 calc(33.333% - 10.66px); max-width: calc(33.333% - 10.66px); }
      h5 { font-size: 18px; }
    }

    @media print {
      .toolbar { display: none; }
      body { font-size: 11pt; }
    }

    @media (max-width: 480px) {
      .btn { width: 100%; }
      .field, .summary { border-radius: 12px; }
      thead th, tbody td { padding: 12px; }
    }
  </style>
</head>
<body>
  <div class="print-root">
    <div class="toolbar">
      <button class="btn" onclick="window.print()">Imprimir / Guardar PDF</button>
    </div>

    <h5>Recibo de Sueldo</h5>
    <small class="muted">ID #${recibo.id} • ${periodoStr}</small>
    <hr class="sep" />

    <!-- Cabecera -->
    <div class="row no-break">
      <div class="col-6">
        <div class="label">Empleado</div>
        <div class="field">${empleadoNombre}</div>
        <div class="muted small">Estado: <b class="up">${String(recibo.estado).toUpperCase()}</b></div>
      </div>
      <div class="col-6">
        <div class="label">Período</div>
        <div class="field">${periodoStr}</div>
        <div class="muted small">ID Recibo: #${recibo.id}</div>
      </div>
    </div>

    <hr class="sep" />

    <!-- Totales -->
    <div class="row no-break">
      <div class="col-4">
        <div class="label">Sueldo</div>
        <div class="field white">$${fmtAr(recibo.sueldo)}</div>
      </div>
      <div class="col-4">
        <div class="label">A cobrar por banco</div>
        <div class="field white">$${fmtAr(recibo.acobrarporbanco)}</div>
      </div>
      <div class="col-4">
        <div class="summary">
          <div class="line"><span>Total Haberes</span><b>$${fmtAr(recibo.totalhaberes)}</b></div>
          <div class="line"><span>Descuentos</span><b>$${fmtAr(recibo.descuentos)}</b></div>
          <hr class="sep" />
          <div class="line strong"><span>A cobrar en sucursal</span><b>$${fmtAr(recibo.acobrarporsucursal)}</b></div>
        </div>
      </div>
    </div>

    <hr class="sep" />

    <!-- Fijos -->
    <h6 class="section-title">Adicionales fijos vigentes</h6>
    <div class="table-wrap">
      <table>
        <colgroup>
          <col style="width:80px" />
          <col />
          <col style="width:160px" />
        </colgroup>
        <thead>
          <tr>
            <th>ID</th>
            <th>Descripción</th>
            <th class="right">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${
            itemsFijos.length
              ? itemsFijos.map(i => `
                <tr>
                  <td>${i.id}</td>
                  <td>${i.descripcion || "—"}</td>
                  <td class="right">$${fmtAr(i.monto_total)}</td>
                </tr>`).join("")
              : `<tr><td colspan="3" class="center muted">Sin fijos vigentes para este período/empleado</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <!-- Variables + Descuentos (sin "Tipo", positivos primero) -->
    <h6 class="section-title">Adicionales y Descuentos del período</h6>
    <div class="table-wrap">
      <table>
        <colgroup>
          <col style="width:80px" />
          <col />
          <col style="width:160px" />
        </colgroup>
        <thead>
          <tr>
            <th>ID</th>
            <th>Descripción</th>
            <th class="right">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${
            itemsNoFijos.length
              ? itemsNoFijos.map(i => `
                <tr>
                  <td>${i.id}</td>
                  <td>${i.descripcion || "—"}</td>
                  <td class="right">$${fmtAr(i.monto_total)}</td>
                </tr>`).join("")
              : `<tr><td colspan="3" class="center muted">Sin adicionales para este período/empleado</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div class="muted small" style="margin-top:6px">
      Los montos positivos se suman a <b>Total Haberes</b>. Los montos negativos y los adelantos alimentan <b>Descuentos</b>.
    </div>
  </div>
</body>
</html>`;
}


/**
 * GET /public/recibo/:id?exp=...&sig=...
 * Devuelve HTML estilado (con botón “Imprimir / Guardar PDF”)
 */
export async function getReciboHtmlPublic(req, res) {
  try {
    const secret = process.env.PDF_SIGN_SECRET;
    if (!secret) return res.status(500).send("Falta PDF_SIGN_SECRET");

    const fullPath = req.originalUrl;
    if (!verifySignedPath(fullPath, secret)) {
      return res.status(403).send("Link inválido o expirado.");
    }

    const id = Number(req.params.id);
    if (!id) return res.status(400).send("ID inválido.");

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

    const empleadoNombre = [
      recibo?.Empleado?.apellido || "",
      recibo?.Empleado?.nombre || "",
    ].join(" ").trim() || `Empleado #${recibo.empleado_id}`;

    const html = buildHtml({ recibo, periodoStr, empleadoNombre });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Error generando vista.");
  }
}
