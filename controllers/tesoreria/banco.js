import xlsx from "xlsx";
import Banco from "../../models/comun/banco.js";
import Proveedor from "../../models/comun/proveedor.js";
import Proyecto from "../../models/comun/proyecto.js";



/* ===================== IMPORTACIÓN DESDE EXCEL (EGRESOS VARIOS) ===================== */
/**
 * POST /movimientos-banco-tesoreria/importar-excel
 * FormData: file (xlsx/xls), empresa_id (number)
 * 
 * Columnas esperadas (case-insensitive):
 * - fecha             -> Fecha del movimiento (YYYY-MM-DD, DD/MM/YYYY, etc.)
 * - tipo              -> Debe ser "egreso" (se valida case-insensitive)
 * - descripcion       -> Texto
 * - monto             -> Número (admite coma como separador decimal)
 * - banco             -> Nombre/descripcion/alias del banco (se resuelve a banco_id por empresa)
 * - proveedor         -> Nombre/Razón Social/Descripción (se resuelve a proveedor_id)
 * - categoria         -> Nombre de la categoría de egreso (se resuelve a categoriaegreso_id)
 * - proyecto          -> Descripción/Nombre de proyecto (se resuelve a proyecto_id)
 * - observaciones     -> (opcional)
 * 
 * Comportamiento:
 *  1) Valida TODAS las filas (existencia/consistencia). Si hay errores => 400 con detalle.
 *  2) Si todo OK, crea en una única transacción:
 *     - OrdenPago (pendiente_aplicacion, origen: "egreso_varios_banco_excel")
 *     - MovimientoBancoTesoreria (egreso) con categoriaegreso_id e imputacioncontable_id derivados
 */
export const importarMovimientosBancoExcel = async (req, res) => {
    try {
        const empresa_id = Number(req.body?.empresa_id);
        if (!empresa_id) {
            return res.status(400).json({ error: "empresa_id es requerido." });
        }
        if (!req.file?.buffer) {
            return res.status(400).json({ error: "Debe adjuntar un archivo Excel en el campo 'file'." });
        }

        // Parse Excel a objetos
        const wb = xlsx.read(req.file.buffer, { type: "buffer" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rowsRaw = xlsx.utils.sheet_to_json(ws, { defval: "" }); // cada fila => objeto
        if (!rowsRaw.length) {
            return res.status(400).json({ error: "El Excel no contiene filas." });
        }

        // Normalizadores / ayudantes
        const norm = (s) => String(s || "").trim().toLowerCase();
        const toISODate = (v) => {
            const raw = String(v || "").trim();
            if (!raw) return null;
            // intenta parse tipo Excel (serial) o textos comunes
            // 1) Si viene como número serial Excel:
            if (!Number.isNaN(Number(raw)) && Number(raw) > 25569) {
                const d = new Date(Math.round((Number(raw) - 25569) * 86400 * 1000));
                return d.toISOString().slice(0, 10);
            }
            // 2) dd/mm/yyyy
            const m1 = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(raw);
            if (m1) {
                const dd = m1[1].padStart(2, "0");
                const mm = m1[2].padStart(2, "0");
                const yyyy = m1[3];
                return `${yyyy}-${mm}-${dd}`;
            }
            // 3) yyyy-mm-dd
            const m2 = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
            if (m2) {
                const yyyy = m2[1];
                const mm = m2[2].padStart(2, "0");
                const dd = m2[3].padStart(2, "0");
                return `${yyyy}-${mm}-${dd}`;
            }
            // fallback: Date.parse
            const d = new Date(raw);
            if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
            return null;
        };
        const toNumber = (v) => {
            if (typeof v === "number") return v;
            const s = String(v || "").replace(/\./g, "").replace(",", ".");
            const n = Number(s);
            return Number.isFinite(n) ? n : NaN;
        };

        // Pre-cargar catálogos de la empresa
        const bancos = await Banco.findAll({ where: { empresa_id } });
        const proveedores = await Proveedor.findAll(); // puede o no estar filtrado por empresa
        const categorias = await CategoriaEgreso.findAll(); // nombres globales
        const proyectos = await Proyecto.findAll(); // proyectos globales o por empresa si aplica

        // Mapas de búsqueda (case-insensitive)
        const bancoMap = new Map(); // clave: nombre/alias/descripcion normalizado => Banco
        for (const b of bancos) {
            [b.nombre, b.alias, b.descripcion].forEach((k) => {
                const key = norm(k);
                if (key) bancoMap.set(key, b);
            });
        }
        const proveedorMap = new Map();
        for (const p of proveedores) {
            [p.razonsocial, p.nombre, p.descripcion].forEach((k) => {
                const key = norm(k);
                if (key && !proveedorMap.has(key)) proveedorMap.set(key, p);
            });
        }
        const categoriaMap = new Map(); // nombre => categoria
        for (const c of categorias) {
            const key = norm(c.nombre);
            if (key) categoriaMap.set(key, c);
        }
        const proyectoMap = new Map(); // descripcion/nombre => proyecto
        for (const pr of proyectos) {
            [pr.descripcion, pr.nombre].forEach((k) => {
                const key = norm(k);
                if (key && !proyectoMap.has(key)) proyectoMap.set(key, pr);
            });
        }

        // Mapeo de columnas (case-insensitive)
        const keyOf = (row, ...cands) => {
            const keys = Object.keys(row);
            const wanted = cands.map(norm);
            for (const k of keys) {
                if (wanted.includes(norm(k))) return k;
            }
            return null;
        };

        const errores = [];
        const parsed = rowsRaw.map((row, idx0) => {
            const idx = idx0 + 2; // 2 por encabezado (fila humana)
            const kFecha = keyOf(row, "fecha");
            const kTipo = keyOf(row, "tipo");
            const kDesc = keyOf(row, "descripcion", "descripción", "concepto");
            const kMonto = keyOf(row, "monto", "importe", "total");
            const kBanco = keyOf(row, "banco");
            const kProv = keyOf(row, "proveedor", "razon social", "razón social", "entidad");
            const kCat = keyOf(row, "categoria", "categoría");
            const kProy = keyOf(row, "proyecto");
            const kObs = keyOf(row, "observaciones", "obs");

            const fecha = toISODate(row[kFecha]);
            const tipoRaw = String(row[kTipo] || "").trim();
            const tipo = norm(tipoRaw);
            const descripcion = String(row[kDesc] || "").trim();
            const monto = toNumber(row[kMonto]);
            const bancoNombre = norm(row[kBanco]);
            const proveedorNombre = norm(row[kProv]);
            const categoriaNombre = norm(row[kCat]);
            const proyectoNombre = norm(row[kProy]);
            const observaciones = String(row[kObs] || "").trim() || null;

            // Validaciones por fila
            const filaErrores = [];
            if (!fecha) filaErrores.push("Fecha inválida o ausente.");
            if (tipo !== "egreso") filaErrores.push('Tipo inválido. Solo se permite "egreso".');
            if (!descripcion) filaErrores.push("Descripción requerida.");
            if (!(Number.isFinite(monto) && monto > 0)) filaErrores.push("Monto inválido (> 0).");
            if (!bancoNombre) filaErrores.push("Banco requerido.");
            if (!proveedorNombre) filaErrores.push("Proveedor requerido.");
            if (!categoriaNombre) filaErrores.push("Categoría requerida.");
            if (!proyectoNombre) filaErrores.push("Proyecto requerido.");

            const banco = bancoNombre ? bancoMap.get(bancoNombre) : null;
            if (!banco) filaErrores.push("Banco no encontrado para la empresa seleccionada.");

            const proveedor = proveedorNombre ? proveedorMap.get(proveedorNombre) : null;
            if (!proveedor) filaErrores.push("Proveedor no encontrado.");

            const categoria = categoriaNombre ? categoriaMap.get(categoriaNombre) : null;
            if (!categoria) filaErrores.push("Categoría de egreso no encontrada.");
            const imputacioncontable_id = categoria?.imputacioncontable_id || null;
            if (!imputacioncontable_id) filaErrores.push("La categoría no tiene imputación contable asociada.");

            const proyecto = proyectoNombre ? proyectoMap.get(proyectoNombre) : null;
            if (!proyecto) filaErrores.push("Proyecto no encontrado.");

            if (filaErrores.length) {
                errores.push({ fila: idx, errores: filaErrores });
            }

            return {
                idx,
                fecha,
                tipo: "egreso",
                descripcion,
                monto,
                observaciones,
                banco_id: banco?.id || null,
                proveedor_id: proveedor?.id || null,
                categoriaegreso_id: categoria?.id || null,
                imputacioncontable_id,
                proyecto_id: proyecto?.id || null,
            };
        });

        if (errores.length) {
            return res.status(400).json({
                error: "Validación fallida. Corrija los datos e intente nuevamente.",
                detalles: errores,
            });
        }

        // Si todo válido: crear todo dentro de UNA transacción
        const t = await sequelize.transaction();
        try {
            const resultados = [];
            for (const r of parsed) {
                // 1) OP pendiente de aplicación
                const orden = await OrdenPago.create(
                    {
                        empresa_id,
                        proveedor_id: r.proveedor_id,
                        comprobanteegreso_id: null,
                        fecha: r.fecha,
                        total: r.monto,
                        estado: "pendiente_aplicacion",
                        numero: null,
                        observaciones: r.observaciones,
                        origen: "egreso_varios_banco_excel",
                        idempotency_key: null,
                    },
                    { transaction: t }
                );

                // 2) Movimiento BANCO (EGRESO)
                const mov = await MovimientoBancoTesoreria.create(
                    {
                        empresa_id,
                        tipo: "egreso",
                        descripcion: r.descripcion,
                        monto: r.monto,
                        fecha: r.fecha,
                        banco_id: r.banco_id,
                        formapago_id: null, // opcional: resolver "transferencia/banco" si lo necesitas
                        referencia_id: orden.id,
                        referencia_tipo: "OrdenPago",
                        observaciones: r.observaciones,
                        anulado: false,
                        ordenpago_id: orden.id,
                        categoriaegreso_id: r.categoriaegreso_id,
                        imputacioncontable_id: r.imputacioncontable_id,
                        proyecto_id: r.proyecto_id, // 👈 si tu modelo ya lo incluye
                    },
                    { transaction: t }
                );

                resultados.push({ ordenpago_id: orden.id, movimiento_id: mov.id });
            }

            await t.commit();
            return res.status(201).json({
                ok: true,
                creados: resultados.length,
                resultados,
            });
        } catch (errTx) {
            await t.rollback();
            console.error("❌ importarMovimientosBancoExcel (TX):", errTx);
            return res.status(500).json({ error: "Error al crear movimientos en base", detalle: errTx.message });
        }
    } catch (error) {
        console.error("❌ importarMovimientosBancoExcel:", error);
        return res.status(500).json({ error: "Error al procesar el archivo Excel", detalle: error.message });
    }
};
