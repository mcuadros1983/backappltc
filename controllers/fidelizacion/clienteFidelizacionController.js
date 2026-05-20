import { Op, fn, col, literal } from "sequelize";
import {
  ClienteFidelizacion,
  ParticipacionCliente,
  CuponCliente,
  CanjeCuponCliente,
  ComercioAsociado,
  CampaniaFidelizacion,
  PremioCliente,
} from "../../models/fidelizacion/index.js";

const MAX_LIMIT = 5000;
const DEFAULT_LIMIT = 50;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getPagination = (query) => {
  const page = toPositiveInt(query.page, 1);
  const requestedLimit = toPositiveInt(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildDateWhere = ({ desde, hasta }) => {
  if (!desde && !hasta) return undefined;

  const where = {};

  if (desde) {
    const fechaDesde = new Date(desde);
    fechaDesde.setHours(0, 0, 0, 0);
    where[Op.gte] = fechaDesde;
  }

  if (hasta) {
    const fechaHasta = new Date(hasta);
    fechaHasta.setHours(23, 59, 59, 999);
    where[Op.lte] = fechaHasta;
  }

  return where;
};

const normalizeSearch = (value) => String(value || "").trim();

const getNumericValue = (row, alias) => Number(row?.get?.(alias) || row?.[alias] || 0);

const buildCountMap = (rows, idField, alias) => {
  const map = new Map();
  rows.forEach((row) => {
    map.set(Number(row[idField]), getNumericValue(row, alias));
  });
  return map;
};

export const listarClientesFidelizacionAdmin = async (req, res) => {
  try {
    const { estado, desde, hasta, buscar } = req.query;
    const { page, limit, offset } = getPagination(req.query);

    const where = {};
    if (estado) where.estado = estado;

    const fechaWhere = buildDateWhere({ desde, hasta });
    if (fechaWhere) where.createdAt = fechaWhere;

    const search = normalizeSearch(buscar);
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { telefono: { [Op.iLike]: `%${search}%` } },
        { telefono_normalizado: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await ClienteFidelizacion.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"], ["id", "DESC"]],
    });

    const clienteIds = rows.map((cliente) => cliente.id);

    const [participaciones, cupones, cuponesUsados, canjes, ultimasParticipaciones] =
      clienteIds.length
        ? await Promise.all([
            ParticipacionCliente.findAll({
              where: { cliente_id: { [Op.in]: clienteIds } },
              attributes: ["cliente_id", [fn("COUNT", col("id")), "total"]],
              group: ["cliente_id"],
              raw: false,
            }),
            CuponCliente.findAll({
              where: { cliente_id: { [Op.in]: clienteIds } },
              attributes: ["cliente_id", [fn("COUNT", col("id")), "total"]],
              group: ["cliente_id"],
              raw: false,
            }),
            CuponCliente.findAll({
              where: { cliente_id: { [Op.in]: clienteIds }, estado: "usado" },
              attributes: ["cliente_id", [fn("COUNT", col("id")), "total"]],
              group: ["cliente_id"],
              raw: false,
            }),
            CanjeCuponCliente.findAll({
              where: { cliente_id: { [Op.in]: clienteIds }, estado: "confirmado" },
              attributes: ["cliente_id", [fn("COUNT", col("id")), "total"]],
              group: ["cliente_id"],
              raw: false,
            }),
            ParticipacionCliente.findAll({
              where: { cliente_id: { [Op.in]: clienteIds } },
              include: [
                {
                  model: ComercioAsociado,
                  as: "comercio",
                  required: false,
                  attributes: ["id", "nombre_fantasia", "domicilio"],
                },
                {
                  model: CampaniaFidelizacion,
                  as: "campania",
                  required: false,
                  attributes: ["id", "nombre"],
                },
              ],
              order: [["fecha_participacion", "DESC"], ["id", "DESC"]],
            }),
          ])
        : [[], [], [], [], []];

    const participacionesMap = buildCountMap(participaciones, "cliente_id", "total");
    const cuponesMap = buildCountMap(cupones, "cliente_id", "total");
    const cuponesUsadosMap = buildCountMap(cuponesUsados, "cliente_id", "total");
    const canjesMap = buildCountMap(canjes, "cliente_id", "total");

    const ultimaParticipacionMap = new Map();
    ultimasParticipaciones.forEach((participacion) => {
      const plain = participacion.get({ plain: true });
      const clienteId = Number(plain.cliente_id);
      if (!ultimaParticipacionMap.has(clienteId)) {
        ultimaParticipacionMap.set(clienteId, plain);
      }
    });

    const data = rows.map((cliente) => {
      const plain = cliente.get({ plain: true });
      const clienteId = Number(plain.id);

      return {
        ...plain,
        metricas: {
          participaciones: participacionesMap.get(clienteId) || 0,
          cupones_generados: cuponesMap.get(clienteId) || 0,
          cupones_usados: cuponesUsadosMap.get(clienteId) || 0,
          canjes_confirmados: canjesMap.get(clienteId) || 0,
        },
        ultima_participacion: ultimaParticipacionMap.get(clienteId) || null,
      };
    });

    return res.json({
      ok: true,
      data,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("[listarClientesFidelizacionAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar clientes de fidelización",
      error: error.message,
    });
  }
};

export const obtenerClienteFidelizacionAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await ClienteFidelizacion.findByPk(id, {
      include: [
        {
          model: ParticipacionCliente,
          as: "participaciones",
          required: false,
          include: [
            { model: ComercioAsociado, as: "comercio", required: false },
            { model: CampaniaFidelizacion, as: "campania", required: false },
            { model: PremioCliente, as: "premio", required: false },
            { model: CuponCliente, as: "cupon", required: false },
          ],
        },
        {
          model: CuponCliente,
          as: "cupones",
          required: false,
          include: [
            { model: ComercioAsociado, as: "comercio", required: false },
            { model: CampaniaFidelizacion, as: "campania", required: false },
            { model: PremioCliente, as: "premio", required: false },
            { model: CanjeCuponCliente, as: "canje", required: false },
          ],
        },
        {
          model: CanjeCuponCliente,
          as: "canjes",
          required: false,
          include: [
            { model: ComercioAsociado, as: "comercio", required: false },
            { model: PremioCliente, as: "premio", required: false },
            { model: CuponCliente, as: "cupon", required: false },
          ],
        },
      ],
      order: [
        [{ model: ParticipacionCliente, as: "participaciones" }, "fecha_participacion", "DESC"],
        [{ model: CuponCliente, as: "cupones" }, "fecha_emision", "DESC"],
        [{ model: CanjeCuponCliente, as: "canjes" }, "fecha_canje", "DESC"],
      ],
    });

    if (!cliente) {
      return res.status(404).json({
        ok: false,
        message: "Cliente no encontrado",
      });
    }

    const data = cliente.get({ plain: true });

    data.metricas = {
      participaciones: data.participaciones?.length || 0,
      cupones_generados: data.cupones?.length || 0,
      cupones_usados: data.cupones?.filter((cupon) => cupon.estado === "usado").length || 0,
      canjes_confirmados: data.canjes?.filter((canje) => canje.estado === "confirmado").length || 0,
    };

    return res.json({ ok: true, data });
  } catch (error) {
    console.error("[obtenerClienteFidelizacionAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener cliente de fidelización",
      error: error.message,
    });
  }
};
