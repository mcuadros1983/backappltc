import { Op } from "sequelize";
import GastoEstimado from "../../models/tesoreria/gastoestimado.js";
import GastoEstimadoInstancia from "../../models/tesoreria/gastoestimadoinstancia.js";
import GastoEstimadoPago from "../../models/tesoreria/gastoestimadopago.js";
import XLSX from "xlsx";
import { sequelize } from "../../config/database.js";
import Proveedor from "../../models/comun/proveedor.js";           // Ajustá la ruta real del modelo
import CategoriaEgreso from "../../models/tesoreria/categoriaEgreso.js"; // Ajustá la ruta real del modelo
import ExcelJS from "exceljs"; // NUEVO: para generar XLSX con validaciones
import FormaPagoTesoreria from "../../models/comun/formapagotesoreria.js";

// ---------- helpers ----------

function stripAccents(str = "") {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function normName(s) {
  return stripAccents(String(s || "").trim().toLowerCase().replace(/\s+/g, " "));
}

function daysInMonth(year, month /* 1..12 */) {
  return new Date(year, month, 0).getDate();
}



function clampDay(day, year, month) {
  const mdays = daysInMonth(year, month);
  if (!day) return mdays; // si no hay default, uso fin de mes
  return Math.max(1, Math.min(day, mdays));
}
function periodStr(y, m) {
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}`;
}
function* iteratePeriods(desde /* 'YYYY-MM' */, hasta /* 'YYYY-MM' */) {
  const [y1, m1] = desde.split("-").map(n => parseInt(n, 10));
  const [y2, m2] = hasta.split("-").map(n => parseInt(n, 10));
  let y = y1, m = m1;
  while (y < y2 || (y === y2 && m <= m2)) {
    yield { y, m };
    m++;
    if (m > 12) { m = 1; y++; }
  }
}
async function recomputarEstado(instancia) {
  const base = Number((instancia.monto_real ?? instancia.monto_estimado) ?? 0);
  const pagado = Number(instancia.monto_pagado || 0);

  let estado = "pendiente";
  if (pagado > 0 && pagado < base) estado = "parcial";
  if (pagado >= base && base > 0) estado = "pagado";

  const hoy = new Date().toISOString().slice(0, 10);
  if (estado !== "pagado" && instancia.fecha_vencimiento && instancia.fecha_vencimiento < hoy) {
    estado = "vencido";
  }
  instancia.estado = estado;
  await instancia.save();
  return instancia;
}

// ---------- Plantillas ----------

function calcularProximaInstancia(
  plantilla,
  fechaBase = new Date()
) {
  let y = fechaBase.getFullYear();
  let m = fechaBase.getMonth() + 1;

  const hoy = fechaBase
    .toISOString()
    .slice(0, 10);

  let dia = clampDay(
    plantilla.dia_vencimiento_default || 0,
    y,
    m
  );

  let fechaVencimiento = new Date(
    y,
    m - 1,
    dia
  )
    .toISOString()
    .slice(0, 10);

  // Si el vencimiento de este mes ya pasó,
  // avanzamos al mes siguiente
  if (fechaVencimiento < hoy) {
    m += 1;

    if (m > 12) {
      m = 1;
      y += 1;
    }

    dia = clampDay(
      plantilla.dia_vencimiento_default || 0,
      y,
      m
    );

    fechaVencimiento = new Date(
      y,
      m - 1,
      dia
    )
      .toISOString()
      .slice(0, 10);
  }

  return {
    periodo: periodStr(y, m),
    fecha_vencimiento: fechaVencimiento,
  };
}


async function asegurarProximaInstancia(
  plantilla
) {
  const {
    periodo,
    fecha_vencimiento,
  } = calcularProximaInstancia(
    plantilla
  );

  const existente =
    await GastoEstimadoInstancia.findOne({
      where: {
        gastoestimado_id: plantilla.id,
        periodo,
      },
    });

  console.log(
    "REACTIVACION GASTO ESTIMADO",
    {
      plantilla_id: plantilla.id,
      activo: plantilla.activo,
      periodoCalculado: periodo,
      fechaVencimientoCalculada: fecha_vencimiento,

      instanciaEncontrada: existente
        ? {
          id: existente.id,
          periodo: existente.periodo,
          fecha_vencimiento: existente.fecha_vencimiento,
          estado: existente.estado,
          anulado: existente.anulado,
          monto_pagado: existente.monto_pagado,
        }
        : null,
    }
  );

  // Si ya existe una instancia para ese período
  if (existente) {
    // Si estaba anulada, reactivamos solamente
    // esta próxima instancia válida
    if (
      existente.anulado === true ||
      existente.estado === "anulado"
    ) {
      await existente.update({
        empresa_id: plantilla.empresa_id,
        proveedor_id: plantilla.proveedor_id,
        categoriaegreso_id: plantilla.categoriaegreso_id,
        sucursal_id: plantilla.sucursal_id,
        tipocomprobante_id: plantilla.tipocomprobante_id,
        formapago_id: plantilla.formapago_id ?? null,

        descripcion: plantilla.descripcion,

        fecha_vencimiento,

        monto_estimado:
          plantilla.monto_estimado_default || 0,

        monto_real: null,
        monto_pagado: 0,

        estado: "pendiente",
        anulado: false,

        observaciones:
          plantilla.observaciones || null,
      });

      console.log(
        "INSTANCIA REACTIVADA",
        existente.toJSON()
      );
    }


    return existente;
  }

  // Si no existe, crear nueva instancia
  return await GastoEstimadoInstancia.create({
    gastoestimado_id: plantilla.id,

    empresa_id: plantilla.empresa_id,
    proveedor_id: plantilla.proveedor_id,
    categoriaegreso_id: plantilla.categoriaegreso_id,
    sucursal_id: plantilla.sucursal_id,
    tipocomprobante_id: plantilla.tipocomprobante_id,
    formapago_id: plantilla.formapago_id ?? null,

    descripcion: plantilla.descripcion,

    periodo,
    fecha_vencimiento,

    monto_estimado:
      plantilla.monto_estimado_default || 0,

    monto_real: null,
    monto_pagado: 0,

    estado: "pendiente",
    anulado: false,

    created_from: "generado",

    observaciones:
      plantilla.observaciones || null,
  });
}


export async function crearPlantilla(
  req,
  res
) {

  try {

    const body =
      req.body ||
      {};


    const row =
      await GastoEstimado.create(
        body
      );


    // ==========================================
    // CREAR PRÓXIMA INSTANCIA VÁLIDA
    // ==========================================

    if (
      row.activo !== false
    ) {

      await asegurarProximaInstancia(
        row
      );
    }


    res.json(
      row
    );

  } catch (e) {

    console.error(
      "crearPlantilla",
      e
    );

    res
      .status(500)
      .json({
        error:
          "Error creando la plantilla",
      });
  }
}

export async function listarPlantillas(req, res) {
  try {
    const { empresa_id, activo, proveedor_id, categoriaegreso_id, sucursal_id, q } = req.query;
    const where = {};
    if (empresa_id) where.empresa_id = empresa_id;
    if (activo !== undefined && activo !== "") where.activo = (activo === "true");
    if (proveedor_id) where.proveedor_id = proveedor_id;
    if (categoriaegreso_id) where.categoriaegreso_id = categoriaegreso_id;
    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (q) where.descripcion = { [Op.iLike]: `%${q}%` };

    const rows = await GastoEstimado.findAll({ where, order: [["descripcion", "ASC"]] });
    res.json(rows);
  } catch (e) {
    console.error("listarPlantillas", e);
    res.status(500).json({ error: "Error listando plantillas" });
  }
}

export async function obtenerPlantilla(req, res) {
  try {
    console.log("instancia", req.params.id)
    const row = await GastoEstimado.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });
    res.json(row);
  } catch (e) {
    console.error("obtenerPlantilla", e);
    res.status(500).json({ error: "Error obteniendo plantilla" });
  }
}

export async function actualizarPlantilla(
  req,
  res
) {

  try {

    const row =
      await GastoEstimado.findByPk(
        req.params.id
      );


    if (!row) {

      return res
        .status(404)
        .json({
          error:
            "No encontrada",
        });
    }


    // ==========================================
    // ESTADO ANTERIOR
    // ==========================================

    const wasActive =
      row.activo !== false;


    // ==========================================
    // ACTUALIZAR PLANTILLA
    // ==========================================

    await row.update(
      req.body ||
      {}
    );


    const isActive =
      row.activo !== false;


    // ==========================================
    // ACTIVA → INACTIVA
    // ==========================================

    if (
      wasActive &&
      !isActive
    ) {

      /*
       * Anulamos solamente obligaciones que
       * no tienen pagos.
       *
       * No tocamos:
       * - pagadas
       * - parciales
       */

      await GastoEstimadoInstancia.update(
        {
          anulado: true,
          estado: "anulado",
        },
        {
          where: {

            gastoestimado_id:
              row.id,

            estado: {
              [Op.in]: [
                "pendiente",
                "vencido",
              ],
            },

            [Op.or]: [
              {
                monto_pagado: null,
              },
              {
                monto_pagado: 0,
              },
            ],
          },
        }
      );
    }


    // ==========================================
    // INACTIVA → ACTIVA
    // ==========================================

    if (
      !wasActive &&
      isActive
    ) {

      /*
       * No reactivamos todo el historial.
       *
       * Solamente aseguramos que exista la
       * próxima instancia válida.
       */

      await asegurarProximaInstancia(
        row
      );
    }


    res.json(
      row
    );

  } catch (e) {

    console.error(
      "actualizarPlantilla",
      e
    );

    res
      .status(500)
      .json({
        error:
          "Error actualizando plantilla",
      });
  }
}

export async function eliminarPlantilla(req, res) {
  try {
    const row = await GastoEstimado.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });
    await row.update({ activo: false });
    res.json({ ok: true });
  } catch (e) {
    console.error("eliminarPlantilla", e);
    res.status(500).json({ error: "Error eliminando plantilla" });
  }
}

// ---------- Generación de Instancias (manual por rango YYYY-MM) ----------
export async function generarInstancias(req, res) {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.body || {}; // 'YYYY-MM'
    if (!desde || !hasta) return res.status(400).json({ error: "desde/hasta (YYYY-MM) requeridos" });

    const plant = await GastoEstimado.findByPk(id);
    if (!plant) return res.status(404).json({ error: "Plantilla no encontrada" });

    const out = [];
    for (const { y, m } of iteratePeriods(desde, hasta)) {
      const periodo = periodStr(y, m);
      const dia = clampDay(plant.dia_vencimiento_default || 0, y, m);
      const fv = new Date(y, m - 1, dia).toISOString().slice(0, 10);

      const [inst] = await GastoEstimadoInstancia.findOrCreate({
        where: { gastoestimado_id: plant.id, periodo },
        defaults: {
          gastoestimado_id: plant.id,
          empresa_id: plant.empresa_id,
          proveedor_id: plant.proveedor_id,
          categoriaegreso_id: plant.categoriaegreso_id,
          sucursal_id: plant.sucursal_id,
          tipocomprobante_id: plant.tipocomprobante_id,
          formapago_id: plant.formapago_id ?? null,

          descripcion: plant.descripcion,
          periodo,
          fecha_vencimiento: fv,
          monto_estimado: plant.monto_estimado_default || 0,
          created_from: "generado",
        },
      });
      out.push(inst);
    }
    res.json(out);
  } catch (e) {
    console.error("generarInstancias", e);
    res.status(500).json({ error: "Error generando instancias" });
  }
}

// ---------- Instancias ----------
export async function listarInstancias(req, res) {
  try {
    const {
      empresa_id,
      proveedor_id,
      categoriaegreso_id,
      sucursal_id,
      estado,
      desde, // 'YYYY-MM'
      hasta, // 'YYYY-MM'
      vencimiento_desde, // 'YYYY-MM-DD'
      vencimiento_hasta, // 'YYYY-MM-DD'
      q,
    } = req.query;

    const where = {
      anulado: false,
    };
    if (empresa_id) where.empresa_id = empresa_id;
    if (proveedor_id) where.proveedor_id = proveedor_id;
    if (categoriaegreso_id) where.categoriaegreso_id = categoriaegreso_id;
    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (estado) where.estado = estado;
    if (desde || hasta) {
      where.periodo = {};
      if (desde) where.periodo[Op.gte] = desde;
      if (hasta) where.periodo[Op.lte] = hasta;
    }
    if (vencimiento_desde || vencimiento_hasta) {
      where.fecha_vencimiento = {};
      if (vencimiento_desde) where.fecha_vencimiento[Op.gte] = vencimiento_desde;
      if (vencimiento_hasta) where.fecha_vencimiento[Op.lte] = vencimiento_hasta;
    }

    let rows = await GastoEstimadoInstancia.findAll({
      where,
      order: [["fecha_vencimiento", "ASC"], ["id", "ASC"]],
    });

    if (q) {
      const plants = await GastoEstimado.findAll({
        attributes: ["id"],
        where: { descripcion: { [Op.iLike]: `%${q}%` } },
      });
      const ids = new Set(plants.map(p => p.id));
      rows = rows.filter(r => ids.has(r.gastoestimado_id));
    }

    const hoy = new Date().toISOString().slice(0, 10);
    rows = rows.map(r => {
      if (
        !r.anulado &&
        r.estado !== "pagado" &&
        r.estado !== "anulado" &&
        r.fecha_vencimiento < hoy
      ) {
        const clone = r.toJSON();
        clone.estado = "vencido";
        return clone;
      }
      return r;
    });

    res.json(rows);
  } catch (e) {
    console.error("listarInstancias", e);
    res.status(500).json({ error: "Error listando instancias" });
  }
}

export async function obtenerInstancia(req, res) {
  try {
    const row = await GastoEstimadoInstancia.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });
    res.json(row);
  } catch (e) {
    console.error("obtenerInstancia", e);
    res.status(500).json({ error: "Error obteniendo instancia" });
  }
}

export async function actualizarInstancia(req, res) {
  try {
    const row = await GastoEstimadoInstancia.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });

    await row.update(req.body || {});
    await recomputarEstado(row);

    res.json(row);
  } catch (e) {
    console.error("actualizarInstancia", e);
    res.status(500).json({ error: "Error actualizando instancia" });
  }
}

export async function eliminarInstancia(req, res) {
  try {
    const row = await GastoEstimadoInstancia.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "No encontrada" });
    await row.update({ anulado: true, estado: "anulado" });
    res.json({ ok: true });
  } catch (e) {
    console.error("eliminarInstancia", e);
    res.status(500).json({ error: "Error eliminando instancia" });
  }
}

// ---------- helper normalización de headers ----------
function normHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "");
}

// ---------- helper: parse bool ----------
function parseBool(v) {
  if (v === true || v === false) return v;
  const s = String(v || "").trim().toLowerCase();
  return ["1", "true", "si", "sí", "y", "yes"].includes(s);
}

// ---------- helper: YYYY-MM desde fecha ----------
function periodFromDate(yyyy_mm_dd) {
  const s = String(yyyy_mm_dd || "").slice(0, 7);
  // basic guard
  return /^\d{4}-\d{2}$/.test(s) ? s : null;
}

// ---------- IMPORTAR ÚNICOS DESDE EXCEL/CSV ----------
// POST /gasto-estimado/importar-unicos  (usa upload.single("file") en las rutas)
export async function importarPlantillasUnicas(req, res) {

  console.log("\n==================================================");
  console.log("🚀 INICIO importarPlantillasUnicas");
  console.log("==================================================");

  try {

    // =====================================================
    // 1. REQUEST RECIBIDO
    // =====================================================

    console.log("📦 req.body:", req.body);

    console.log(
      "📎 req.file:",
      req.file
        ? {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          encoding: req.file.encoding,
          mimetype: req.file.mimetype,
          size: req.file.size,
          bufferLength: req.file.buffer?.length,
        }
        : null
    );


    // =====================================================
    // 2. EMPRESA
    // =====================================================

    const empresa_id =
      Number(
        req.body?.empresa_id
      );


    console.log(
      "🏢 empresa_id RAW:",
      req.body?.empresa_id
    );

    console.log(
      "🏢 empresa_id convertido:",
      empresa_id
    );


    if (
      !(empresa_id > 0)
    ) {

      console.error(
        "❌ empresa_id inválido"
      );

      return res
        .status(400)
        .json({
          error:
            "empresa_id requerido en el body (FormData)"
        });
    }


    // =====================================================
    // 3. ARCHIVO
    // =====================================================

    if (
      !req.file ||
      !req.file.buffer
    ) {

      console.error(
        "❌ No llegó req.file o req.file.buffer"
      );

      return res
        .status(400)
        .json({
          error:
            "Subí un archivo (xlsx/csv) en el campo 'file'."
        });
    }


    console.log(
      "✅ Archivo recibido correctamente"
    );


    // =====================================================
    // 4. PARSEAR EXCEL / CSV
    // =====================================================

    console.log(
      "\n📖 Leyendo archivo con XLSX..."
    );


    const wb =
      XLSX.read(
        req.file.buffer,
        {
          type: "buffer",

          /*
           * Importante para intentar obtener
           * fechas reales de Excel como Date.
           */
          cellDates: true,
        }
      );


    console.log(
      "📚 Hojas encontradas:",
      wb.SheetNames
    );


    const wsName =
      wb.SheetNames[0];


    console.log(
      "📄 Hoja seleccionada:",
      wsName
    );


    const ws =
      wb.Sheets[
      wsName
      ];


    if (!ws) {

      console.error(
        "❌ No se encontró la primera hoja"
      );

      return res
        .status(400)
        .json({
          error:
            "El archivo no contiene una hoja válida"
        });
    }


    console.log(
      "📐 Rango de hoja:",
      ws["!ref"]
    );


    const rows =
      XLSX.utils.sheet_to_json(
        ws,
        {
          defval: null,
          raw: true,
        }
      );


    console.log(
      "📊 Cantidad de filas detectadas:",
      rows.length
    );


    if (
      rows.length === 0
    ) {

      console.error(
        "❌ Excel sin registros"
      );

      return res
        .status(400)
        .json({
          error:
            "El archivo no contiene registros para importar"
        });
    }


    // =====================================================
    // 5. VERIFICAR ENCABEZADOS
    // =====================================================

    console.log(
      "\n🔑 COLUMNAS DETECTADAS:"
    );

    console.log(
      Object.keys(
        rows[0]
      )
    );


    console.log(
      "\n🧾 PRIMERA FILA RAW:"
    );

    console.log(
      rows[0]
    );


    console.log(
      "\n🧾 SEGUNDA FILA RAW:"
    );

    console.log(
      rows[1] || "No existe"
    );


    // =====================================================
    // 6. CATÁLOGOS
    // =====================================================

    console.log(
      "\n🔎 Cargando catálogos..."
    );


    const [
      proveedores,
      categorias,
      formasPago
    ] =
      await Promise.all([

        Proveedor.findAll(),

        CategoriaEgreso.findAll(),

        FormaPagoTesoreria.findAll(),

      ]);


    console.log(
      "👤 Cantidad proveedores:",
      proveedores.length
    );



    console.log(
      "📂 Cantidad categorías:",
      categorias.length
    );


    console.log(
      "💳 Cantidad formas de pago:",
      formasPago.length
    );

    // =====================================================
    // 7. MAPA PROVEEDORES
    // =====================================================

    const provMap =
      new Map();


    proveedores.forEach(
      (p) => {

        const visible =
          p.razonsocial ||
          p.nombre ||
          p.descripcion ||
          `Proveedor ${p.id}`;


        const key =
          normName(
            visible
          );


        if (
          !provMap.has(key)
        ) {

          provMap.set(
            key,
            []
          );
        }


        provMap
          .get(key)
          .push(p);
      }
    );


    console.log(
      "🗺️ Claves proveedor generadas:",
      provMap.size
    );


    // =====================================================
    // 8. MAPA CATEGORÍAS
    // =====================================================

    const catMap =
      new Map();


    categorias.forEach(
      (c) => {

        const key =
          normName(
            c.nombre
          );


        catMap.set(
          key,
          c
        );
      }
    );


    console.log(
      "🗺️ Claves categoría generadas:",
      catMap.size
    );

    // =====================================================
    // 8.bis. MAPA FORMAS DE PAGO
    // =====================================================

    const formaPagoMap =
      new Map();


    formasPago.forEach(
      (fp) => {

        const key =
          normName(
            fp.descripcion
          );


        if (key) {

          formaPagoMap.set(
            key,
            fp
          );
        }
      }
    );


    console.log(
      "🗺️ Claves forma de pago generadas:",
      formaPagoMap.size
    );

    // =====================================================
    // 9. RESULTADOS
    // =====================================================

    const results =
      [];


    let created =
      0;


    let failed =
      0;


    // =====================================================
    // 10. RECORRER FILAS
    // =====================================================

    for (
      let i = 0;
      i < rows.length;
      i++
    ) {

      const raw =
        rows[i] ||
        {};


      const filaExcel =
        i + 2;


      console.log(
        "\n--------------------------------------------------"
      );

      console.log(
        `➡️ PROCESANDO FILA EXCEL ${filaExcel}`
      );

      console.log(
        "--------------------------------------------------"
      );


      console.log(
        "📦 RAW:",
        raw
      );


      // ===================================================
      // CAMPOS PRINCIPALES
      // ===================================================

      const descripcion =
        String(
          raw.descripcion ||
          ""
        ).trim();


      const proveedorNombre =
        String(
          raw.proveedor ||
          ""
        ).trim();


      const categoriaNombre =
        String(
          raw.categoria ||
          ""
        ).trim();

      const formaPagoNombre =
        String(
          raw.forma_pago ||
          ""
        ).trim();


      console.log(
        "📝 descripcion:",
        JSON.stringify(
          descripcion
        )
      );


      console.log(
        "👤 proveedor:",
        JSON.stringify(
          proveedorNombre
        )
      );


      console.log(
        "📂 categoria:",
        JSON.stringify(
          categoriaNombre
        )
      );

      console.log(
        "💳 forma_pago:",
        JSON.stringify(
          formaPagoNombre
        )
      );

      // ===================================================
      // FECHA
      // ===================================================

      let fecha_vencimiento =
        null;


      console.log(
        "📅 fecha_vencimiento RAW:",
        raw.fecha_vencimiento
      );


      console.log(
        "📅 typeof fecha_vencimiento:",
        typeof raw.fecha_vencimiento
      );


      console.log(
        "📅 instanceof Date:",
        raw.fecha_vencimiento
        instanceof Date
      );


      if (
        raw.fecha_vencimiento
      ) {

        /*
         * CASO 1:
         * XLSX devuelve Date real.
         */
        if (
          raw.fecha_vencimiento
          instanceof Date &&
          !isNaN(
            raw.fecha_vencimiento
              .getTime()
          )
        ) {

          fecha_vencimiento =
            raw.fecha_vencimiento
              .toISOString()
              .slice(
                0,
                10
              );


          console.log(
            "📅 Detectada como Date:",
            fecha_vencimiento
          );

        } else {

          /*
           * CASO 2:
           * viene como string.
           */

          const s =
            String(
              raw.fecha_vencimiento
            ).trim();


          console.log(
            "📅 Fecha como String:",
            JSON.stringify(
              s
            )
          );


          /*
           * YYYY-MM-DD
           */
          if (
            /^\d{4}-\d{2}-\d{2}$/
              .test(s)
          ) {

            fecha_vencimiento =
              s;


            console.log(
              "📅 Formato detectado: YYYY-MM-DD"
            );

          } else {

            /*
             * DD/MM/YYYY
             * DD-MM-YYYY
             */

            const m =
              s.match(
                /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
              );


            console.log(
              "📅 Resultado regex DD/MM/YYYY:",
              m
            );


            if (
              m
            ) {

              const [
                _,
                d,
                mo,
                y
              ] =
                m;


              fecha_vencimiento =
                `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;


              console.log(
                "📅 Fecha convertida:",
                fecha_vencimiento
              );
            }
          }
        }
      }


      console.log(
        "📅 FECHA FINAL:",
        fecha_vencimiento
      );


      // ===================================================
      // MONTO
      // ===================================================

      const montoRaw =
        raw.monto ??
        raw.monto_estimado ??
        raw.importe;


      console.log(
        "💰 monto RAW:",
        montoRaw
      );


      console.log(
        "💰 typeof monto RAW:",
        typeof montoRaw
      );


      const monto =
        Number(
          montoRaw
        );


      console.log(
        "💰 monto convertido:",
        monto
      );


      console.log(
        "💰 isNaN:",
        Number.isNaN(
          monto
        )
      );


      // ===================================================
      // CAMPOS OPCIONALES
      // ===================================================

      const sucursal_id =
        raw[
          "sucursal_id (op)"
        ] != null

          ? Number(
            raw[
            "sucursal_id (op)"
            ]
          )

          : raw.sucursal_id != null

            ? Number(
              raw.sucursal_id
            )

            : null;


      const requiere_factura =
        raw.requiere_factura != null

          ? parseBool(
            raw.requiere_factura
          )

          : null;


      const observaciones =
        raw[
          "observaciones (op)"
        ] != null

          ? String(
            raw[
            "observaciones (op)"
            ]
          ).trim()

          : raw.observaciones != null

            ? String(
              raw.observaciones
            ).trim()

            : null;


      const tipocomprobante_id =
        raw.tipocomprobante_id != null

          ? Number(
            raw.tipocomprobante_id
          )

          : null;


      // const formapago_id =
      //   raw.formapago_id != null

      //     ? Number(
      //       raw.formapago_id
      //     )

      //     : null;

      let formapago_id =
        null;




      // ===================================================
      // VALIDACIONES
      // ===================================================

      const errs =
        [];


      if (
        !descripcion
      ) {

        errs.push(
          "descripcion requerida"
        );
      }


      if (
        !proveedorNombre
      ) {

        errs.push(
          "proveedor requerido"
        );
      }


      if (
        !categoriaNombre
      ) {

        errs.push(
          "categoria requerida"
        );
      }

      if (
        !formaPagoNombre
      ) {

        errs.push(
          "forma_pago requerida"
        );
      }

      if (
        !fecha_vencimiento ||
        !/^\d{4}-\d{2}-\d{2}$/
          .test(
            fecha_vencimiento
          )
      ) {

        errs.push(
          "fecha_vencimiento (YYYY-MM-DD) requerida"
        );
      }


      if (
        !(monto > 0)
      ) {

        errs.push(
          "monto > 0 requerido"
        );
      }


      // ===================================================
      // RESOLVER PROVEEDOR
      // ===================================================

      let proveedor_id =
        null;


      if (
        proveedorNombre
      ) {

        const proveedorKey =
          normName(
            proveedorNombre
          );


        console.log(
          "🔎 Proveedor original:",
          proveedorNombre
        );


        console.log(
          "🔎 Proveedor normalizado:",
          proveedorKey
        );


        const list =
          provMap.get(
            proveedorKey
          ) ||
          [];


        console.log(
          "🔎 Cantidad coincidencias proveedor:",
          list.length
        );


        console.log(
          "🔎 Coincidencias proveedor:",
          list.map(
            (p) => ({
              id:
                p.id,

              razonsocial:
                p.razonsocial,

              nombre:
                p.nombre,

              descripcion:
                p.descripcion
            })
          )
        );


        if (
          list.length === 1
        ) {

          proveedor_id =
            list[0].id;


          console.log(
            "✅ proveedor_id resuelto:",
            proveedor_id
          );

        } else if (
          list.length === 0
        ) {

          console.error(
            "❌ Proveedor NO encontrado:",
            proveedorNombre
          );


          errs.push(
            `Proveedor '${proveedorNombre}' no encontrado`
          );

        } else {

          console.error(
            "❌ Proveedor ambiguo:",
            proveedorNombre,
            list.length
          );


          errs.push(
            `Proveedor '${proveedorNombre}' ambiguo (${list.length} coincidencias)`
          );
        }
      }


      // ===================================================
      // RESOLVER CATEGORÍA
      // ===================================================

      let categoriaegreso_id =
        null;


      if (
        categoriaNombre
      ) {

        const categoriaKey =
          normName(
            categoriaNombre
          );


        console.log(
          "🔎 Categoría original:",
          categoriaNombre
        );


        console.log(
          "🔎 Categoría normalizada:",
          categoriaKey
        );


        const c =
          catMap.get(
            categoriaKey
          );


        console.log(
          "🔎 Categoría encontrada:",
          c
            ? {
              id:
                c.id,

              nombre:
                c.nombre,

              imputacioncontable_id:
                c.imputacioncontable_id
            }
            : null
        );


        if (
          !c
        ) {

          console.error(
            "❌ Categoría NO encontrada:",
            categoriaNombre
          );


          errs.push(
            `Categoría '${categoriaNombre}' no encontrada`
          );

        } else {

          categoriaegreso_id =
            c.id;


          console.log(
            "✅ categoriaegreso_id resuelto:",
            categoriaegreso_id
          );
        }
      }

      // ===================================================
      // RESOLVER FORMA DE PAGO
      // ===================================================

      if (
        formaPagoNombre
      ) {

        const formaPagoKey =
          normName(
            formaPagoNombre
          );


        console.log(
          "🔎 Forma de pago original:",
          formaPagoNombre
        );


        console.log(
          "🔎 Forma de pago normalizada:",
          formaPagoKey
        );


        const fp =
          formaPagoMap.get(
            formaPagoKey
          );


        console.log(
          "🔎 Forma de pago encontrada:",
          fp
            ? {
              id:
                fp.id,

              descripcion:
                fp.descripcion,

              nombre:
                fp.nombre
            }
            : null
        );


        if (
          !fp
        ) {

          console.error(
            "❌ Forma de pago NO encontrada:",
            formaPagoNombre
          );


          errs.push(
            `Forma de pago '${formaPagoNombre}' no encontrada`
          );

        } else {

          formapago_id =
            fp.id;


          console.log(
            "✅ formapago_id resuelto:",
            formapago_id
          );
        }
      }
      // ===================================================
      // ERRORES DE VALIDACIÓN
      // ===================================================

      if (
        errs.length
      ) {

        console.error(
          `❌ FILA ${filaExcel} RECHAZADA`
        );


        console.error(
          "Errores:",
          errs
        );


        failed++;


        results.push({
          row:
            filaExcel,

          ok:
            false,

          error:
            errs.join(
              "; "
            )
        });


        continue;
      }


      // ===================================================
      // PERIODO
      // ===================================================

      const periodo =
        String(
          fecha_vencimiento
        ).slice(
          0,
          7
        );


      console.log(
        "📆 periodo:",
        periodo
      );


      console.log(
        "✅ FILA VALIDADA CORRECTAMENTE"
      );


      console.log(
        "📦 DATOS FINALES:",
        {
          empresa_id,
          proveedor_id,
          categoriaegreso_id,
          descripcion,
          fecha_vencimiento,
          periodo,
          monto,
          sucursal_id,
          tipocomprobante_id,
          formapago_id,
          requiere_factura,
          observaciones
        }
      );


      // ===================================================
      // TRANSACCIÓN
      // ===================================================

      console.log(
        "🔐 Iniciando transacción..."
      );


      const t =
        await sequelize
          .transaction();


      try {

        // =================================================
        // 11. CREAR PLANTILLA
        // =================================================

        console.log(
          "💾 Creando GastoEstimado..."
        );


        const datosPlantilla = {

          empresa_id,

          proveedor_id,

          categoriaegreso_id,

          descripcion,

          periodicidad:
            "unico",

          dia_vencimiento_default:
            Number(
              fecha_vencimiento
                .slice(
                  8,
                  10
                )
            ),

          monto_estimado_default:
            monto,

          sucursal_id,

          tipocomprobante_id,

          formapago_id,

          requiere_factura:
            requiere_factura ??
            null,

          activo:
            true,

          observaciones,

        };


        console.log(
          "📦 Payload GastoEstimado:",
          datosPlantilla
        );


        const plantilla =
          await GastoEstimado
            .create(
              datosPlantilla,
              {
                transaction:
                  t
              }
            );


        console.log(
          "✅ GastoEstimado creado"
        );


        console.log(
          "🆔 plantilla.id:",
          plantilla.id
        );


        // =================================================
        // 12. CREAR INSTANCIA
        // =================================================

        console.log(
          "💾 Creando GastoEstimadoInstancia..."
        );


        const datosInstancia = {

          gastoestimado_id:
            plantilla.id,

          empresa_id,

          proveedor_id,

          categoriaegreso_id,

          sucursal_id,

          tipocomprobante_id,

          formapago_id,

          descripcion,

          periodo,

          fecha_vencimiento,

          monto_estimado:
            monto,

          monto_real:
            null,

          monto_pagado:
            0,

          estado:
            "pendiente",

          anulado:
            false,

          created_from:
            "importado",

          observaciones,

        };


        console.log(
          "📦 Payload GastoEstimadoInstancia:",
          datosInstancia
        );


        const instancia =
          await GastoEstimadoInstancia
            .create(
              datosInstancia,
              {
                transaction:
                  t
              }
            );


        console.log(
          "✅ GastoEstimadoInstancia creada"
        );


        console.log(
          "🆔 instancia.id:",
          instancia.id
        );


        // =================================================
        // COMMIT
        // =================================================

        await t.commit();


        console.log(
          `🎉 FILA ${filaExcel}: COMMIT OK`
        );


        created++;


        results.push({

          row:
            filaExcel,

          ok:
            true,

          plantilla_id:
            plantilla.id,

          instancia_id:
            instancia.id

        });


      } catch (e) {

        // =================================================
        // ERROR DE BASE DE DATOS
        // =================================================

        console.error(
          "\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
        );

        console.error(
          `💥 ERROR BD FILA ${filaExcel}`
        );

        console.error(
          "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
        );


        console.error(
          "Nombre error:",
          e?.name
        );


        console.error(
          "Mensaje:",
          e?.message
        );


        console.error(
          "SQL:",
          e?.sql
        );


        console.error(
          "Parameters:",
          e?.parameters
        );


        console.error(
          "Sequelize errors:",
          e?.errors
        );


        console.error(
          "Original:",
          e?.original
        );


        console.error(
          "Parent:",
          e?.parent
        );


        console.error(
          "Stack:",
          e?.stack
        );


        try {

          await t.rollback();


          console.log(
            `↩️ ROLLBACK FILA ${filaExcel} OK`
          );

        } catch (
        rollbackError
        ) {

          console.error(
            "💥 ERROR HACIENDO ROLLBACK:",
            rollbackError
          );
        }


        failed++;


        results.push({

          row:
            filaExcel,

          ok:
            false,

          error:
            e?.message ||
            "Error creando registros"

        });
      }
    }


    // =====================================================
    // 13. RESULTADO FINAL
    // =====================================================

    console.log(
      "\n=================================================="
    );

    console.log(
      "🏁 FIN importarPlantillasUnicas"
    );

    console.log(
      "=================================================="
    );


    console.log(
      "📊 RESUMEN:",
      {
        total:
          rows.length,

        created,

        failed
      }
    );


    if (
      failed > 0
    ) {

      console.log(
        "❌ FILAS FALLIDAS:"
      );


      console.table(
        results.filter(
          (r) =>
            !r.ok
        )
      );
    }


    console.log(
      "==================================================\n"
    );


    return res.json({

      ok:
        true,

      created,

      failed,

      total:
        rows.length,

      results,

      hint:
        "Usá el template XLSX: columnas obligatorias = descripcion, proveedor, categoria, fecha_vencimiento, monto, forma_pago."

    });


  } catch (e) {

    // =====================================================
    // ERROR GENERAL
    // =====================================================

    console.error(
      "\n##################################################"
    );

    console.error(
      "💥 ERROR GENERAL importarPlantillasUnicas"
    );

    console.error(
      "##################################################"
    );


    console.error(
      "Nombre:",
      e?.name
    );


    console.error(
      "Mensaje:",
      e?.message
    );


    console.error(
      "SQL:",
      e?.sql
    );


    console.error(
      "Parameters:",
      e?.parameters
    );


    console.error(
      "Original:",
      e?.original
    );


    console.error(
      "Parent:",
      e?.parent
    );


    console.error(
      "Stack:",
      e?.stack
    );


    console.error(
      "##################################################\n"
    );


    return res
      .status(500)
      .json({

        error:
          "Error importando archivo",

        /*
         * TEMPORAL mientras diagnosticamos.
         * Después podemos eliminar detalle.
         */
        detalle:
          e?.message ||
          null

      });
  }
}

// GET /gasto-estimado/unicos/template.xlsx
export async function descargarTemplateXlsxUnicos(req, res) {
  try {

    const proveedores =
      await Proveedor.findAll({
        order: [["nombre", "ASC"]],
      });

    const categorias =
      await CategoriaEgreso.findAll({
        order: [["nombre", "ASC"]],
      });

    const formasPago =
      await FormaPagoTesoreria.findAll({
        order: [["descripcion", "ASC"]],
      });


    const wb =
      new ExcelJS.Workbook();

    wb.created =
      new Date();


    // =====================================================
    // HOJA PRINCIPAL
    // =====================================================

    const ws =
      wb.addWorksheet("Carga");


    ws.columns = [
      {
        header: "descripcion",
        key: "descripcion",
        width: 40,
      },
      {
        header: "proveedor",
        key: "proveedor",
        width: 32,
      },
      {
        header: "categoria",
        key: "categoria",
        width: 28,
      },
      {
        header: "fecha_vencimiento",
        key: "fecha_venc",
        width: 16,
      },
      {
        header: "monto",
        key: "monto",
        width: 14,
      },
      {
        header: "forma_pago",
        key: "forma_pago",
        width: 28,
      },
    ];


    ws.getRow(1).font = {
      bold: true,
    };


    // =====================================================
    // PROVEEDORES
    // =====================================================

    const wsProv =
      wb.addWorksheet(
        "Proveedores",
        {
          views: [
            {
              state: "veryHidden",
            },
          ],
        }
      );


    wsProv.columns = [
      {
        header: "nombre_proveedor",
        key: "nombre",
        width: 60,
      },
    ];


    proveedores.forEach((p) =>
      wsProv.addRow({
        nombre:
          p.razonsocial ||
          p.nombre ||
          p.descripcion ||
          `Proveedor ${p.id}`,
      })
    );


    // =====================================================
    // CATEGORÍAS
    // =====================================================

    const wsCat =
      wb.addWorksheet(
        "Categorias",
        {
          views: [
            {
              state: "veryHidden",
            },
          ],
        }
      );


    wsCat.columns = [
      {
        header: "nombre_categoria",
        key: "nombre",
        width: 50,
      },
    ];


    categorias.forEach((c) =>
      wsCat.addRow({
        nombre: c.nombre,
      })
    );


    // =====================================================
    // FORMAS DE PAGO
    // =====================================================

    const wsFP =
      wb.addWorksheet(
        "FormasPago",
        {
          views: [
            {
              state: "veryHidden",
            },
          ],
        }
      );


    wsFP.columns = [
      {
        header: "forma_pago",
        key: "nombre",
        width: 50,
      },
    ];


    formasPago.forEach((fp) =>
      wsFP.addRow({
        nombre:
          fp.descripcion ||
          fp.nombre ||
          `Forma de pago ${fp.id}`,
      })
    );


    // =====================================================
    // VALIDACIONES
    // =====================================================

    const MAX = 2000;


    ws.dataValidations.add(
      `B2:B${MAX}`,
      {
        type: "list",
        allowBlank: false,
        formulae: [
          `=Proveedores!$A$2:$A$${proveedores.length + 1}`,
        ],
        showErrorMessage: true,
        errorTitle: "Proveedor inválido",
        error: "Elegí un proveedor de la lista",
      }
    );


    ws.dataValidations.add(
      `C2:C${MAX}`,
      {
        type: "list",
        allowBlank: false,
        formulae: [
          `=Categorias!$A$2:$A$${categorias.length + 1}`,
        ],
        showErrorMessage: true,
        errorTitle: "Categoría inválida",
        error: "Elegí una categoría de la lista",
      }
    );


    ws.dataValidations.add(
      `F2:F${MAX}`,
      {
        type: "list",
        allowBlank: false,
        formulae: [
          `=FormasPago!$A$2:$A$${formasPago.length + 1}`,
        ],
        showErrorMessage: true,
        errorTitle: "Forma de pago inválida",
        error: "Elegí una forma de pago de la lista",
      }
    );


    // =====================================================
    // AYUDA
    // =====================================================

    const help =
      wb.addWorksheet("Ayuda");


    help
      .addRow(["Instrucciones"])
      .font = {
      bold: true,
    };


    help.addRows([
      [
        "• Estos gastos se importan como 'unico' (sin rollover).",
      ],
      [
        "• Columnas obligatorias: descripcion, proveedor, categoria, fecha_vencimiento (YYYY-MM-DD), monto (>0), forma_pago.",
      ],
      [
        "• 'proveedor', 'categoria' y 'forma_pago' tienen listas desplegables actualizadas al momento de descargar.",
      ],
      [
        "• La empresa NO va en el archivo; se envía como empresa_id en el FormData del POST.",
      ],
    ]);


    // =====================================================
    // RESPUESTA
    // =====================================================

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );


    res.setHeader(
      "Content-Disposition",
      'attachment; filename="gastos_unicos_template.xlsx"'
    );


    await wb.xlsx.write(res);

    res.end();

  } catch (e) {

    console.error(
      "descargarTemplateXlsxUnicos",
      e
    );


    res
      .status(500)
      .json({
        error:
          "No se pudo generar el template",
      });
  }
}