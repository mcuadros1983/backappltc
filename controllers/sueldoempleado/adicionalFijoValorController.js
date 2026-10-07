// Histórico de valores por tipo (vigencias)
import { Op } from "sequelize";
import AdicionalFijoValor from "../../models/sueldoempleado/adicionalfijovalor.js";
import { sequelize } from "../../config/database.js";

// =========================================================
// AUXILIARES DE FECHAS
// =========================================================

const fechaAnterior = (fecha) => {

  const [anio, mes, dia] =
    String(fecha)
      .substring(0, 10)
      .split("-")
      .map(Number);

  const d = new Date(
    Date.UTC(anio, mes - 1, dia)
  );

  d.setUTCDate(
    d.getUTCDate() - 1
  );

  return d
    .toISOString()
    .substring(0, 10);
};


const normalizarFecha = (fecha) => {

  if (!fecha) {
    return null;
  }

  return String(fecha)
    .substring(0, 10);
};

export const listarValoresFijos = async (req, res) => {
  const { adicionalfijotipo_id } = req.query;
  const where = adicionalfijotipo_id ? { adicionalfijotipo_id } : {};
  const rows = await AdicionalFijoValor.findAll({
    where,
    order: [["vigencia_desde", "DESC"], ["id", "DESC"]],
  });
  res.json(rows);
};

export const crearValorFijo = async (req, res) => {
  const { adicionalfijotipo_id, vigencia_desde, vigencia_hasta, monto } = req.body || {};
  const row = await AdicionalFijoValor.create({ adicionalfijotipo_id, vigencia_desde, vigencia_hasta, monto });
  res.status(201).json(row);
};

export const cerrarVigenciaValorFijo = async (req, res) => {
  const { id } = req.params;
  const { vigencia_hasta } = req.body || {};
  const row = await AdicionalFijoValor.findByPk(id);
  if (!row) return res.status(404).json({ error: "No encontrado" });
  await row.update({ vigencia_hasta });
  res.json(row);
};

export const vigenteParaFecha = async (req, res) => {
  const { adicionalfijotipo_id, fecha } = req.query;
  if (!adicionalfijotipo_id || !fecha) return res.status(400).json({ error: "Parámetros requeridos" });

  const row = await AdicionalFijoValor.findOne({
    where: {
      adicionalfijotipo_id,
      vigencia_desde: { [Op.lte]: fecha },
      [Op.or]: [{ vigencia_hasta: null }, { vigencia_hasta: { [Op.gte]: fecha } }],
    },
    order: [["vigencia_desde", "DESC"]],
  });

  res.json(row || null);
};

export const crearValorFijoSeguro = async (req, res) => {

  const {
    adicionalfijotipo_id,
    vigencia_desde,
    monto,
  } = req.body || {};


  // =====================================================
  // VALIDACIONES INICIALES
  // =====================================================

  const tipoId =
    Number(adicionalfijotipo_id);

  const nuevoMonto =
    Number(monto);

  const nuevaDesde =
    normalizarFecha(vigencia_desde);


  if (!tipoId) {

    return res.status(400).json({
      error:
        "adicionalfijotipo_id es requerido.",
    });
  }


  if (!nuevaDesde) {

    return res.status(400).json({
      error:
        "vigencia_desde es requerida.",
    });
  }


  if (
    !Number.isFinite(nuevoMonto) ||
    nuevoMonto <= 0
  ) {

    return res.status(400).json({
      error:
        "El monto debe ser mayor a cero.",
    });
  }


  try {

    let nuevoValor = null;


    await sequelize.transaction(
      async (t) => {

        // =================================================
        // BLOQUEAR Y OBTENER TODO EL HISTORIAL DEL TIPO
        // =================================================

        const valores =
          await AdicionalFijoValor.findAll({

            where: {
              adicionalfijotipo_id:
                tipoId,
            },

            order: [
              ["vigencia_desde", "ASC"],
              ["id", "ASC"],
            ],

            transaction: t,

            lock: t.LOCK.UPDATE,
          });


        // =================================================
        // NO PERMITIR DOS VERSIONES CON LA MISMA FECHA
        // =================================================

        const mismaFecha =
          valores.find(
            (item) =>
              normalizarFecha(
                item.vigencia_desde
              ) === nuevaDesde
          );


        if (mismaFecha) {

          throw new Error(
            `Ya existe un valor con vigencia desde ${nuevaDesde}. Editá esa versión en lugar de crear otra.`
          );
        }


        // =================================================
        // BUSCAR VERSIÓN ANTERIOR Y SIGUIENTE
        // =================================================

        let anterior = null;
        let siguiente = null;


        for (const item of valores) {

          const fechaItem =
            normalizarFecha(
              item.vigencia_desde
            );


          if (fechaItem < nuevaDesde) {

            anterior = item;

            continue;
          }


          if (fechaItem > nuevaDesde) {

            siguiente = item;

            break;
          }
        }


        // =================================================
        // DETERMINAR HASTA DEL NUEVO VALOR
        // =================================================

        const nuevaHasta =
          siguiente
            ? fechaAnterior(
              siguiente.vigencia_desde
            )
            : null;


        // =================================================
        // AJUSTAR VERSIÓN ANTERIOR
        // =================================================

        if (anterior) {

          await anterior.update(
            {
              vigencia_hasta:
                fechaAnterior(
                  nuevaDesde
                ),
            },
            {
              transaction: t,
            }
          );
        }


        // =================================================
        // CREAR NUEVA VERSIÓN
        // =================================================

        nuevoValor =
          await AdicionalFijoValor.create(
            {
              adicionalfijotipo_id:
                tipoId,

              vigencia_desde:
                nuevaDesde,

              vigencia_hasta:
                nuevaHasta,

              monto:
                nuevoMonto,
            },
            {
              transaction: t,
            }
          );
      }
    );


    return res.status(201).json({
      ok: true,
      valor: nuevoValor,
    });


  } catch (e) {

    console.error(
      "❌ crearValorFijoSeguro:",
      e
    );


    return res.status(400).json({
      error:
        e.message ||
        "No se pudo crear el valor.",
    });
  }
};


// --- NUEVO: actualizar monto y/o vigencias del valor vigente (abierto) ---
export const actualizarValorFijo = async (req, res) => {

  const { id } = req.params;

  const {
    monto,
    vigencia_desde,
  } = req.body || {};


  const valorId =
    Number(id);


  if (!valorId) {

    return res.status(400).json({
      error: "ID inválido.",
    });
  }


  try {

    let resultado = null;


    await sequelize.transaction(
      async (t) => {

        // =================================================
        // BUSCAR Y BLOQUEAR VALOR
        // =================================================

        const row =
          await AdicionalFijoValor.findByPk(
            valorId,
            {
              transaction: t,
              lock: t.LOCK.UPDATE,
            }
          );


        if (!row) {

          throw new Error(
            "Valor no encontrado."
          );
        }


        const nuevoMonto =
          monto !== undefined &&
          monto !== null &&
          monto !== ""
            ? Number(monto)
            : Number(row.monto);


        const nuevaDesde =
          vigencia_desde
            ? normalizarFecha(
                vigencia_desde
              )
            : normalizarFecha(
                row.vigencia_desde
              );


        if (
          !Number.isFinite(nuevoMonto) ||
          nuevoMonto <= 0
        ) {

          throw new Error(
            "El monto debe ser mayor a cero."
          );
        }


        if (!nuevaDesde) {

          throw new Error(
            "vigencia_desde es requerida."
          );
        }


        // =================================================
        // OBTENER LAS DEMÁS VERSIONES
        // =================================================

        const otros =
          await AdicionalFijoValor.findAll({

            where: {
              adicionalfijotipo_id:
                row.adicionalfijotipo_id,

              id: {
                [Op.ne]: row.id,
              },
            },

            order: [
              ["vigencia_desde", "ASC"],
              ["id", "ASC"],
            ],

            transaction: t,

            lock: t.LOCK.UPDATE,
          });


        // =================================================
        // NO PERMITIR FECHA REPETIDA
        // =================================================

        const mismaFecha =
          otros.find(
            (item) =>
              normalizarFecha(
                item.vigencia_desde
              ) === nuevaDesde
          );


        if (mismaFecha) {

          throw new Error(
            `Ya existe otra versión con vigencia desde ${nuevaDesde}.`
          );
        }


        // =================================================
        // CONSTRUIR ORDEN CRONOLÓGICO SIMULADO
        //
        // Incluimos la versión editada con su nueva fecha.
        // =================================================

        const historial = [

          ...otros.map(
            (item) => ({
              instancia: item,

              id: Number(item.id),

              vigencia_desde:
                normalizarFecha(
                  item.vigencia_desde
                ),

              esEditado: false,
            })
          ),

          {
            instancia: row,

            id: Number(row.id),

            vigencia_desde:
              nuevaDesde,

            esEditado: true,
          },
        ];


        historial.sort(
          (a, b) =>
            a.vigencia_desde.localeCompare(
              b.vigencia_desde
            ) ||
            a.id - b.id
        );


        // =================================================
        // RECONSTRUIR TODAS LAS VIGENCIAS
        // =================================================

        for (
          let i = 0;
          i < historial.length;
          i++
        ) {

          const actual =
            historial[i];

          const siguiente =
            historial[i + 1] || null;


          const hasta =
            siguiente
              ? fechaAnterior(
                  siguiente.vigencia_desde
                )
              : null;


          const cambios = {

            vigencia_desde:
              actual.vigencia_desde,

            vigencia_hasta:
              hasta,
          };


          if (actual.esEditado) {

            cambios.monto =
              nuevoMonto;
          }


          await actual.instancia.update(
            cambios,
            {
              transaction: t,
            }
          );
        }


        // =================================================
        // RECARGAR RESULTADO
        // =================================================

        await row.reload({
          transaction: t,
        });


        resultado = row;
      }
    );


    return res.json({
      ok: true,
      valor: resultado,
    });


  } catch (e) {

    console.error(
      "❌ actualizarValorFijo:",
      e
    );


    return res.status(400).json({
      error:
        e.message ||
        "No se pudo actualizar el valor.",
    });
  }
};