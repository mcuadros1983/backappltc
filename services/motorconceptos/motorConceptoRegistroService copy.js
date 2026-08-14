import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";

import {
  MotorConcepto,
  MotorConceptoEntidad,
  MotorConceptoCampo,
  MotorConceptoLista,
  MotorConceptoListaItem,
  MotorConceptoEntidadTipo,
} from "../../models/motorconceptos/index.js";

import {
  MotorConceptoRegistro,
  MotorConceptoRegistroVersion,
  MotorConceptoRegistroValor,
  MotorConceptoRegistroArchivo,
} from "../../models/motorconceptos/operacionAssociations.js";

const ESTADOS = ["BORRADOR", "PENDIENTE", "VIGENTE", "VENCIDO", "ANULADO"];
// const ESTADOS = ["VIGENTE", "VENCIDO"];

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const assertUser = (user) => {
  if (!user?.id) throw createError("Usuario autenticado requerido", 401); 
};

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if ([1, "1", "true"].includes(value)) return true;
  if ([0, "0", "false"].includes(value)) return false;
  return fallback;
};

const parseDateOnly = (value, fieldName) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw createError(`${fieldName} debe tener formato YYYY-MM-DD`);
  }
  return normalized;
};

const getRegistroOrFail = async (id, options = {}) => {
  const registro = await MotorConceptoRegistro.findByPk(id, options);
  if (!registro) throw createError("Registro no encontrado", 404);
  return registro;
};

const getConceptoOrFail = async (id, options = {}) => {
  const concepto = await MotorConcepto.findByPk(id, options);
  if (!concepto || !concepto.activo) {
    throw createError("Concepto no encontrado o inactivo", 404);
  }
  return concepto;
};

const buildScopeWhere = (user, where = {}) => {
  if (Number(user.rol_id) === 1 || user.permissions?.includes("admin.all")) {
    return where;
  }

  return {
    ...where,
    sucursal_id: user.sucursal_id,
  };
};

const ensureEntityTypeAllowed = async (
  conceptoId,
  entidadTipoId,
  transaction
) => {
  const relation = await MotorConceptoEntidad.findOne({
    where: {
      concepto_id: conceptoId,
      entidad_tipo_id: entidadTipoId,
      activo: true,
    },
    transaction,
  });

  if (!relation) {
    throw createError(
      "El tipo de entidad no está habilitado para este concepto"
    );
  }
};

const getActiveFields = async (conceptoId, transaction) =>
  MotorConceptoCampo.findAll({
    where: {
      concepto_id: conceptoId,
      activo: true,
    },
    include: [
      {
        model: MotorConceptoLista,
        as: "lista",
        required: false,
        include: [
          {
            model: MotorConceptoListaItem,
            as: "items",
            required: false,
            where: { activo: true },
          },
        ],
      },
    ],
    order: [["orden", "ASC"], ["id", "ASC"]],
    transaction,
  });

const normalizeFieldValue = (field, rawValue) => {
  const value = rawValue === undefined ? null : rawValue;

  if (
    field.obligatorio &&
    (value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0))
  ) {
    throw createError(`El campo "${field.etiqueta}" es obligatorio`);
  }

  if (value === null || value === undefined || value === "") {
    return {
      valor_texto: null,
      valor_entero: null,
      valor_decimal: null,
      valor_fecha: null,
      valor_datetime: null,
      valor_boolean: null,
      valor_json: null,
    };
  }

  const result = {
    valor_texto: null,
    valor_entero: null,
    valor_decimal: null,
    valor_fecha: null,
    valor_datetime: null,
    valor_boolean: null,
    valor_json: null,
  };

  switch (field.tipo) {
    case "INTEGER": {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed)) {
        throw createError(`El campo "${field.etiqueta}" debe ser entero`);
      }
      result.valor_entero = parsed;
      break;
    }

    case "DECIMAL": {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        throw createError(`El campo "${field.etiqueta}" debe ser numérico`);
      }
      result.valor_decimal = parsed;
      break;
    }

    case "BOOLEAN":
      result.valor_boolean = parseBoolean(value);
      break;

    case "DATE":
      result.valor_fecha = parseDateOnly(value, field.etiqueta);
      break;

    case "DATETIME": {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        throw createError(`El campo "${field.etiqueta}" no es una fecha válida`);
      }
      result.valor_datetime = parsed;
      break;
    }

    case "JSON":
    case "RELACION":
    case "COORDENADAS":
    case "FIRMA":
    case "IMAGEN":
      result.valor_json = value;
      break;

    case "LISTA": {
      const allowed = new Set(
        (field.lista?.items || []).map((item) => String(item.valor))
      );

      if (field.lista?.permite_multiple) {
        if (!Array.isArray(value)) {
          throw createError(
            `El campo "${field.etiqueta}" admite múltiples opciones`
          );
        }

        const invalid = value.filter((item) => !allowed.has(String(item)));
        if (invalid.length) {
          throw createError(
            `El campo "${field.etiqueta}" contiene opciones inválidas`
          );
        }

        result.valor_json = value;
      } else {
        if (!allowed.has(String(value))) {
          throw createError(
            `El valor seleccionado en "${field.etiqueta}" no es válido`
          );
        }
        result.valor_texto = String(value);
      }
      break;
    }

    default:
      result.valor_texto = String(value);
      break;
  }

  return result;
};

const persistValues = async ({
  versionId,
  fields,
  values,
  transaction,
}) => {
  const valuesByCode = values || {};
  const rows = fields.map((field) => ({
    version_id: versionId,
    campo_id: field.id,
    ...normalizeFieldValue(field, valuesByCode[field.codigo]),
  }));

  if (rows.length) {
    await MotorConceptoRegistroValor.bulkCreate(rows, { transaction });
  }
};

const detailIncludes = [
  {
    model: MotorConcepto,
    as: "concepto",
    attributes: [
      "id",
      "codigo",
      "nombre",
      "modo_captura",
      "permite_multiples",
      "usa_versiones",
      "usa_vencimiento",
    ],
  },
  {
    model: MotorConceptoEntidadTipo,
    as: "entidadTipo",
    attributes: ["id", "codigo", "nombre"],
  },
  {
    model: MotorConceptoRegistroVersion,
    as: "versionActual",
    required: false,
    include: [
      {
        model: MotorConceptoRegistroValor,
        as: "valores",
        include: [
          {
            model: MotorConceptoCampo,
            as: "campo",
            attributes: ["id", "codigo", "etiqueta", "tipo", "orden"],
          },
        ],
      },
      {
        model: MotorConceptoRegistroArchivo,
        as: "archivos",
        required: false,
      },
    ],
  },
];

const motorConceptoRegistroService = {
  async getAll(user, query = {}) {
    assertUser(user);

    const page = parsePositiveInteger(query.page, 1);
    const limit = Math.min(parsePositiveInteger(query.limit, 20), 100);
    const where = {};

    if (query.concepto_id) where.concepto_id = Number(query.concepto_id);
    if (query.entidad_tipo_id) {
      where.entidad_tipo_id = Number(query.entidad_tipo_id);
    }
    if (query.entidad_id) where.entidad_id = Number(query.entidad_id);
    if (query.estado) {
      if (!ESTADOS.includes(query.estado)) {
        throw createError("Estado inválido");
      }
      where.estado = query.estado;
    }
    if (query.activo !== undefined && query.activo !== "") {
      where.activo = parseBoolean(query.activo);
    }
    if (query.vencimiento_desde || query.vencimiento_hasta) {
      where.fecha_vencimiento = {};
      if (query.vencimiento_desde) {
        where.fecha_vencimiento[Op.gte] = parseDateOnly(
          query.vencimiento_desde,
          "vencimiento_desde"
        );
      }
      if (query.vencimiento_hasta) {
        where.fecha_vencimiento[Op.lte] = parseDateOnly(
          query.vencimiento_hasta,
          "vencimiento_hasta"
        );
      }
    }

    const scopedWhere = buildScopeWhere(user, where);
    const sortFields = [
      "id",
      "estado",
      "fecha_vencimiento",
      "ultimo_movimiento",
      "created_at",
      "updated_at",
    ];
    const sortBy = sortFields.includes(query.sortBy)
      ? query.sortBy
      : "ultimo_movimiento";
    const sortOrder =
      String(query.sortOrder || "").toUpperCase() === "ASC" ? "ASC" : "DESC";

    const result = await MotorConceptoRegistro.findAndCountAll({
      where: scopedWhere,
      include: [
        {
          model: MotorConcepto,
          as: "concepto",
          attributes: ["id", "codigo", "nombre"],
        },
        {
          model: MotorConceptoEntidadTipo,
          as: "entidadTipo",
          attributes: ["id", "codigo", "nombre"],
        },
      ],
      distinct: true,
      limit,
      offset: (page - 1) * limit,
      order: [[sortBy, sortOrder]],
    });

    return {
      items: result.rows,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    };
  },

  async getById(user, id) {
    assertUser(user);

    const registro = await MotorConceptoRegistro.findOne({
      where: buildScopeWhere(user, { id }),
      include: detailIncludes,
    });

    if (!registro) throw createError("Registro no encontrado", 404);
    return registro;
  },

  async getHistory(user, id) {
    assertUser(user);

    const registro = await MotorConceptoRegistro.findOne({
      where: buildScopeWhere(user, { id }),
      attributes: ["id"],
    });

    if (!registro) throw createError("Registro no encontrado", 404);

    return MotorConceptoRegistroVersion.findAll({
      where: { registro_id: id },
      include: [
        {
          model: MotorConceptoRegistroValor,
          as: "valores",
          include: [
            {
              model: MotorConceptoCampo,
              as: "campo",
              attributes: ["id", "codigo", "etiqueta", "tipo", "orden"],
            },
          ],
        },
        {
          model: MotorConceptoRegistroArchivo,
          as: "archivos",
          required: false,
        },
      ],
      order: [["numero", "DESC"]],
    });
  },

  async create(user, payload) {
    assertUser(user);

    if (!payload.concepto_id) {
      throw createError("concepto_id es obligatorio");
    }
    if (!payload.entidad_tipo_id) {
      throw createError("entidad_tipo_id es obligatorio");
    }
    if (!payload.entidad_id) {
      throw createError("entidad_id es obligatorio");
    }

    const estado = payload.estado || "BORRADOR";
    if (!ESTADOS.includes(estado)) throw createError("Estado inválido");

    return sequelize.transaction(async (transaction) => {
      const concepto = await getConceptoOrFail(payload.concepto_id, {
        transaction,
      });

      await ensureEntityTypeAllowed(
        concepto.id,
        payload.entidad_tipo_id,
        transaction
      );

      if (!concepto.permite_multiples) {
        const duplicate = await MotorConceptoRegistro.findOne({
          where: {
            concepto_id: concepto.id,
            entidad_tipo_id: payload.entidad_tipo_id,
            entidad_id: payload.entidad_id,
            activo: true,
          },
          transaction,
        });

        if (duplicate) {
          throw createError(
            "El concepto no permite múltiples registros para la misma entidad"
          );
        }
      }

      const fields = await getActiveFields(concepto.id, transaction);
      const fechaVencimiento = concepto.usa_vencimiento
        ? parseDateOnly(payload.fecha_vencimiento, "fecha_vencimiento")
        : null;

      const registro = await MotorConceptoRegistro.create(
        {
          concepto_id: concepto.id,
          entidad_tipo_id: payload.entidad_tipo_id,
          entidad_id: payload.entidad_id,
          estado,
          version_actual_id: null,
          fecha_vencimiento: fechaVencimiento,
          ultimo_movimiento: new Date(),
          observaciones: payload.observaciones || null,
          sucursal_id: user.sucursal_id || null,
          activo: true,
          creado_por: user.id,
          modificado_por: user.id,
        },
        { transaction }
      );

      const version = await MotorConceptoRegistroVersion.create(
        {
          registro_id: registro.id,
          numero: 1,
          motivo: payload.motivo || "Creación",
          comentario: payload.comentario || null,
          estado,
          fecha_vencimiento: fechaVencimiento,
          creado_por: user.id,
        },
        { transaction }
      );

      await persistValues({
        versionId: version.id,
        fields,
        values: payload.valores,
        transaction,
      });

      await registro.update(
        {
          version_actual_id: version.id,
          ultimo_movimiento: new Date(),
        },
        { transaction }
      );

      return MotorConceptoRegistro.findByPk(registro.id, {
        include: detailIncludes,
        transaction,
      });
    });
  },

  async createVersion(user, id, payload) {
    assertUser(user);

    return sequelize.transaction(async (transaction) => {
      const registro = await MotorConceptoRegistro.findOne({
        where: buildScopeWhere(user, { id }),
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!registro) throw createError("Registro no encontrado", 404);

      const concepto = await getConceptoOrFail(registro.concepto_id, {
        transaction,
      });

      const nextEstado = payload.estado || registro.estado;
      if (!ESTADOS.includes(nextEstado)) {
        throw createError("Estado inválido");
      }

      const currentMax = await MotorConceptoRegistroVersion.max("numero", {
        where: { registro_id: registro.id },
        transaction,
      });

      const nextNumber = Number(currentMax || 0) + 1;
      const fields = await getActiveFields(concepto.id, transaction);
      const fechaVencimiento = concepto.usa_vencimiento
        ? parseDateOnly(
            payload.fecha_vencimiento ?? registro.fecha_vencimiento,
            "fecha_vencimiento"
          )
        : null;

      const version = await MotorConceptoRegistroVersion.create(
        {
          registro_id: registro.id,
          numero: nextNumber,
          motivo: payload.motivo || "Actualización",
          comentario: payload.comentario || null,
          estado: nextEstado,
          fecha_vencimiento: fechaVencimiento,
          creado_por: user.id,
        },
        { transaction }
      );

      await persistValues({
        versionId: version.id,
        fields,
        values: payload.valores,
        transaction,
      });

      await registro.update(
        {
          estado: nextEstado,
          fecha_vencimiento: fechaVencimiento,
          observaciones:
            payload.observaciones !== undefined
              ? payload.observaciones
              : registro.observaciones,
          version_actual_id: version.id,
          ultimo_movimiento: new Date(),
          modificado_por: user.id,
        },
        { transaction }
      );

      return MotorConceptoRegistro.findByPk(registro.id, {
        include: detailIncludes,
        transaction,
      });
    });
  },

  async changeStatus(user, id, payload) {
    assertUser(user);

    if (!ESTADOS.includes(payload.estado)) {
      throw createError("Estado inválido");
    }

    return sequelize.transaction(async (transaction) => {
      const registro = await MotorConceptoRegistro.findOne({
        where: buildScopeWhere(user, { id }),
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!registro) throw createError("Registro no encontrado", 404);

      await registro.update(
        {
          estado: payload.estado,
          ultimo_movimiento: new Date(),
          modificado_por: user.id,
        },
        { transaction }
      );

      if (registro.version_actual_id) {
        await MotorConceptoRegistroVersion.update(
          { estado: payload.estado },
          {
            where: { id: registro.version_actual_id },
            transaction,
          }
        );
      }

      return MotorConceptoRegistro.findByPk(registro.id, {
        include: detailIncludes,
        transaction,
      });
    });
  },

  async remove(user, id) {
    assertUser(user);

    return sequelize.transaction(async (transaction) => {
      const registro = await MotorConceptoRegistro.findOne({
        where: buildScopeWhere(user, { id }),
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!registro) throw createError("Registro no encontrado", 404);

      await registro.update(
        {
          activo: false,
          estado: "ANULADO",
          ultimo_movimiento: new Date(),
          modificado_por: user.id,
        },
        { transaction }
      );

      await registro.destroy({ transaction });
      return true;
    });
  },

  async markExpired(user) {
    assertUser(user);

    const today = new Date().toISOString().slice(0, 10);

    const [affected] = await MotorConceptoRegistro.update(
      {
        estado: "VENCIDO",
        ultimo_movimiento: new Date(),
        modificado_por: user.id,
      },
      {
        where: buildScopeWhere(user, {
          activo: true,
          estado: {
            [Op.in]: ["PENDIENTE", "VIGENTE"],
          },
          fecha_vencimiento: {
            [Op.lt]: today,
          },
        }),
      }
    );

    return { affected };
  },
};



export default motorConceptoRegistroService;
