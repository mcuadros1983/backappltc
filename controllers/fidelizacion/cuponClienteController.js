import { Op, fn, col } from "sequelize";
import {
  CuponCliente,
  CanjeCuponCliente,
  ClienteFidelizacion,
  ComercioAsociado,
  CampaniaFidelizacion,
  PremioCliente,
  ParticipacionCliente,
  PuntoComercioMovimiento,
} from "../../models/fidelizacion/index.js";
import Sucursal from "../../models/gmedias/sucursalModel.js";
import Usuario from "../../models/auth/usuarioModel.js";

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

const mapById = (rows) => {
  const map = new Map();
  rows.forEach((row) => map.set(Number(row.id), row));
  return map;
};

const getSucursalMap = async (sucursalIds) => {
  const ids = [...new Set(sucursalIds.filter(Boolean).map(Number))];
  if (!ids.length) return new Map();

  const sucursales = await Sucursal.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ["id", "codigo", "nombre"],
  });

  return mapById(sucursales);
};

const getUsuarioMap = async (usuarioIds) => {
  const ids = [...new Set(usuarioIds.filter(Boolean).map(Number))];
  if (!ids.length) return new Map();

  const usuarios = await Usuario.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ["id", "usuario", "rol_id"],
  });

  return mapById(usuarios);
};

const enrichCanjesConSucursalUsuario = async (canjes) => {
  const plainCanjes = canjes.map((canje) => canje.get({ plain: true }));
  const sucursalMap = await getSucursalMap(plainCanjes.map((c) => c.sucursal_id));
  const usuarioMap = await getUsuarioMap(plainCanjes.map((c) => c.usuario_id));

  return plainCanjes.map((canje) => ({
    ...canje,
    sucursal: sucursalMap.get(Number(canje.sucursal_id)) || null,
    usuario: usuarioMap.get(Number(canje.usuario_id)) || null,
  }));
};

export const listarCuponesClienteAdmin = async (req, res) => {
  try {
    const {
      estado,
      comercio_id,
      campania_id,
      premio_cliente_id,
      cliente_id,
      con_canje,
      desde,
      hasta,
      buscar,
    } = req.query;

    const { page, limit, offset } = getPagination(req.query);
    const where = {};

    if (estado) where.estado = estado;
    if (comercio_id) where.comercio_id = comercio_id;
    if (campania_id) where.campania_id = campania_id;
    if (premio_cliente_id) where.premio_cliente_id = premio_cliente_id;
    if (cliente_id) where.cliente_id = cliente_id;

    const fechaWhere = buildDateWhere({ desde, hasta });
    if (fechaWhere) where.fecha_emision = fechaWhere;

    const search = normalizeSearch(buscar);
    if (search) {
      where[Op.or] = [
        { numero_cupon: { [Op.iLike]: `%${search}%` } },
        { token: { [Op.iLike]: `%${search}%` } },
        { codigo_validacion: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const include = [
      {
        model: ClienteFidelizacion,
        as: "cliente",
        required: false,
        attributes: ["id", "nombre", "telefono", "telefono_normalizado", "estado", "createdAt"],
      },
      {
        model: ComercioAsociado,
        as: "comercio",
        required: false,
        attributes: ["id", "nombre_fantasia", "razon_social", "documento_numero", "domicilio", "telefono"],
      },
      {
        model: CampaniaFidelizacion,
        as: "campania",
        required: false,
        attributes: ["id", "nombre", "estado", "fecha_inicio", "fecha_fin"],
      },
      {
        model: PremioCliente,
        as: "premio",
        required: false,
        attributes: ["id", "nombre", "descripcion", "tipo_premio", "valor", "puntos_otorga_comercio"],
      },
      {
        model: ParticipacionCliente,
        as: "participacion",
        required: false,
        attributes: [
          "id",
          "resultado",
          "estado",
          "device_id",
          "ip",
          "user_agent",
          "lat_cliente",
          "lon_cliente",
          "precision_gps",
          "distancia_metros",
          "telefono_ingresado",
          "nombre_ingresado",
          "fecha_participacion",
        ],
      },
      {
        model: CanjeCuponCliente,
        as: "canje",
        required: con_canje === "true",
        attributes: ["id", "sucursal_id", "usuario_id", "fecha_canje", "estado", "observaciones", "createdAt"],
        include: [
          {
            model: PuntoComercioMovimiento,
            as: "movimientosPuntos",
            required: false,
            attributes: ["id", "tipo_movimiento", "puntos", "estado", "fecha_movimiento", "motivo"],
          },
        ],
      },
    ];

    if (con_canje === "false") {
      where.estado = where.estado || { [Op.ne]: "usado" };
    }

    const { count, rows } = await CuponCliente.findAndCountAll({
      where,
      include,
      distinct: true,
      limit,
      offset,
      order: [["fecha_emision", "DESC"], ["id", "DESC"]],
    });

    const plainRows = rows.map((row) => row.get({ plain: true }));
    const canjes = plainRows.map((row) => row.canje).filter(Boolean);
    const sucursalMap = await getSucursalMap(canjes.map((c) => c.sucursal_id));
    const usuarioMap = await getUsuarioMap(canjes.map((c) => c.usuario_id));

    const data = plainRows.map((row) => ({
      ...row,
      canje: row.canje
        ? {
            ...row.canje,
            sucursal: sucursalMap.get(Number(row.canje.sucursal_id)) || null,
            usuario: usuarioMap.get(Number(row.canje.usuario_id)) || null,
          }
        : null,
    }));

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
    console.error("[listarCuponesClienteAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar cupones de fidelización",
      error: error.message,
    });
  }
};

export const obtenerCuponClienteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const cupon = await CuponCliente.findByPk(id, {
      include: [
        { model: ClienteFidelizacion, as: "cliente", required: false },
        { model: ComercioAsociado, as: "comercio", required: false },
        { model: CampaniaFidelizacion, as: "campania", required: false },
        { model: PremioCliente, as: "premio", required: false },
        { model: ParticipacionCliente, as: "participacion", required: false },
        {
          model: CanjeCuponCliente,
          as: "canje",
          required: false,
          include: [
            {
              model: PuntoComercioMovimiento,
              as: "movimientosPuntos",
              required: false,
            },
          ],
        },
        {
          model: PuntoComercioMovimiento,
          as: "movimientosPuntos",
          required: false,
        },
      ],
    });

    if (!cupon) {
      return res.status(404).json({
        ok: false,
        message: "Cupón no encontrado",
      });
    }

    const data = cupon.get({ plain: true });
    if (data.canje) {
      const [sucursalMap, usuarioMap] = await Promise.all([
        getSucursalMap([data.canje.sucursal_id]),
        getUsuarioMap([data.canje.usuario_id]),
      ]);
      data.canje.sucursal = sucursalMap.get(Number(data.canje.sucursal_id)) || null;
      data.canje.usuario = usuarioMap.get(Number(data.canje.usuario_id)) || null;
    }

    return res.json({ ok: true, data });
  } catch (error) {
    console.error("[obtenerCuponClienteAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener cupón de fidelización",
      error: error.message,
    });
  }
};

export const listarCanjesCuponesAdmin = async (req, res) => {
  try {
    const {
      estado,
      comercio_id,
      sucursal_id,
      usuario_id,
      premio_cliente_id,
      cliente_id,
      desde,
      hasta,
      buscar,
    } = req.query;

    const { page, limit, offset } = getPagination(req.query);
    const where = {};

    if (estado) where.estado = estado;
    if (comercio_id) where.comercio_id = comercio_id;
    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (usuario_id) where.usuario_id = usuario_id;
    if (premio_cliente_id) where.premio_cliente_id = premio_cliente_id;
    if (cliente_id) where.cliente_id = cliente_id;

    const fechaWhere = buildDateWhere({ desde, hasta });
    if (fechaWhere) where.fecha_canje = fechaWhere;

    const search = normalizeSearch(buscar);

    const { count, rows } = await CanjeCuponCliente.findAndCountAll({
      where,
      include: [
        {
          model: CuponCliente,
          as: "cupon",
          required: Boolean(search),
          where: search
            ? {
                [Op.or]: [
                  { numero_cupon: { [Op.iLike]: `%${search}%` } },
                  { codigo_validacion: { [Op.iLike]: `%${search}%` } },
                  { token: { [Op.iLike]: `%${search}%` } },
                ],
              }
            : undefined,
          include: [
            {
              model: ParticipacionCliente,
              as: "participacion",
              required: false,
              attributes: ["id", "device_id", "ip", "lat_cliente", "lon_cliente", "precision_gps", "distancia_metros", "fecha_participacion"],
            },
          ],
        },
        { model: ClienteFidelizacion, as: "cliente", required: false },
        { model: ComercioAsociado, as: "comercio", required: false },
        { model: PremioCliente, as: "premio", required: false },
        {
          model: PuntoComercioMovimiento,
          as: "movimientosPuntos",
          required: false,
        },
      ],
      distinct: true,
      limit,
      offset,
      order: [["fecha_canje", "DESC"], ["id", "DESC"]],
    });

    const data = await enrichCanjesConSucursalUsuario(rows);

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
    console.error("[listarCanjesCuponesAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar canjes de cupones",
      error: error.message,
    });
  }
};

export const obtenerCanjeCuponClienteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const canje = await CanjeCuponCliente.findByPk(id, {
      include: [
        {
          model: CuponCliente,
          as: "cupon",
          required: false,
          include: [
            { model: ParticipacionCliente, as: "participacion", required: false },
            { model: CampaniaFidelizacion, as: "campania", required: false },
          ],
        },
        { model: ClienteFidelizacion, as: "cliente", required: false },
        { model: ComercioAsociado, as: "comercio", required: false },
        { model: PremioCliente, as: "premio", required: false },
        {
          model: PuntoComercioMovimiento,
          as: "movimientosPuntos",
          required: false,
        },
      ],
    });

    if (!canje) {
      return res.status(404).json({
        ok: false,
        message: "Canje no encontrado",
      });
    }

    const [data] = await enrichCanjesConSucursalUsuario([canje]);

    return res.json({ ok: true, data });
  } catch (error) {
    console.error("[obtenerCanjeCuponClienteAdmin]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener canje de cupón",
      error: error.message,
    });
  }
};
