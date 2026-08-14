import {
  Op, literal
} from "sequelize";
import { sequelize } from "../../config/database.js";

import {
  MotorConceptoEntidad,
  MotorConceptoCampo,
  MotorConceptoLista,
  MotorConceptoListaItem,
  MotorConcepto,
  MotorConceptoEntidadTipo,
} from "../../models/motorconceptos/index.js";

import {
  MotorConceptoRegistro,
  MotorConceptoRegistroVersion,
  MotorConceptoRegistroValor,
  MotorConceptoRegistroArchivo,
  MotorConceptoEntidadAsignacion
} from "../../models/motorconceptos/operacionAssociations.js";

import motorConceptoRegistroArchivoService
  from "./motorConceptoRegistroArchivoService.js";

// import MotorConceptoCampo from "../../models/motorconceptos/motorConceptoCampoModel.js";
import MotorConceptoRegla from "../../models/motorconceptos/motorConceptoReglaModel.js";
import MotorConceptoArchivoTipo from "../../models/motorconceptos/motorConceptoArchivoTipoModel.js";

import registroEstadoHelper
  from "./registroEstadoHelper.js";


import registroArchivoService
  from "./registroArchivoService.js";

import {
  deleteFromDrive,
} from "../googleDriveService.js";


const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ALLOWED_STATES = [
  "BORRADOR",
  "PENDIENTE",
  "VIGENTE",
  "VENCIDO",
  "ANULADO",
];

const ALLOWED_SORT_FIELDS = {
  id: "id",
  concepto_id: "concepto_id",
  entidad_tipo_id: "entidad_tipo_id",
  entidad_id: "entidad_id",
  estado: "estado",
  fecha_vencimiento: "fecha_vencimiento",
  ultimo_movimiento: "ultimo_movimiento",
  sucursal_id: "sucursal_id",
  created_at: "created_at",
  updated_at: "updated_at",
};

// const ESTADOS = ["VIGENTE", "VENCIDO"];
const ESTADOS = ["BORRADOR", "PENDIENTE", "VIGENTE", "VENCIDO", "ANULADO"];

const createError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
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

const getUserId = (user) => {
  if (!user?.id) {
    throw createError(
      "Usuario autenticado no disponible",
      401
    );
  }

  return user.id;
};

const parsePositiveInteger = (
  value,
  fallback
) => {
  const parsed = Number.parseInt(
    value,
    10
  );

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return parsed;
};

const parseOptionalInteger = (
  value,
  fieldName
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number.parseInt(
    value,
    10
  );

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw createError(
      `${fieldName} no es válido`
    );
  }

  return parsed;
};

const parseBoolean = (
  value,
  fallback = true
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  if (
    value === true ||
    value === "true" ||
    value === "1" ||
    value === 1
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === "0" ||
    value === 0
  ) {
    return false;
  }

  return fallback;
};

const normalizeText = (
  value
) =>
  String(
    value || ""
  ).trim();

const normalizeState = (
  value
) => {
  const estado =
    normalizeText(value)
      .toUpperCase();

  if (!estado) {
    return null;
  }

  if (
    !ALLOWED_STATES.includes(
      estado
    )
  ) {
    throw createError(
      "El estado enviado no es válido"
    );
  }

  return estado;
};

const normalizeOrder = (
  value
) => {
  const order =
    normalizeText(value)
      .toUpperCase();

  return order === "ASC"
    ? "ASC"
    : "DESC";
};

const normalizeSortField = (
  value
) => {
  const field =
    normalizeText(value);

  return (
    ALLOWED_SORT_FIELDS[field] ||
    "ultimo_movimiento"
  );
};

const normalizeDate = (
  value,
  fieldName
) => {
  const date =
    normalizeText(value);

  if (!date) {
    return null;
  }

  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(
      date
    );

  if (!valid) {
    throw createError(
      `${fieldName} debe tener formato YYYY-MM-DD`
    );
  }

  return date;
};

const buildSecurityWhere = (
  user
) => {
  getUserId(user);

  const where = {};

  /*
   * Se respeta el comportamiento que ya aparece
   * en los servicios actuales del ERP:
   *
   * rol_id === 1
   * puede consultar todas las sucursales.
   *
   * Los demás usuarios quedan limitados
   * a su sucursal cuando sucursal_id existe.
   */
  if (
    Number(user.rol_id) !== 1 &&
    user.sucursal_id
  ) {
    where.sucursal_id =
      user.sucursal_id;
  }

  return where;
};

const buildSearchWhere = (
  search
) => {
  const value =
    normalizeText(search);

  if (!value) {
    return null;
  }

  const conditions = [
    {
      observaciones: {
        [Op.like]:
          `%${value}%`,
      },
    },
    {
      estado: {
        [Op.like]:
          `%${value.toUpperCase()}%`,
      },
    },
  ];

  const numericValue =
    Number.parseInt(
      value,
      10
    );

  if (
    Number.isInteger(
      numericValue
    )
  ) {
    conditions.push(
      {
        id:
          numericValue,
      },
      {
        entidad_id:
          numericValue,
      },
      {
        concepto_id:
          numericValue,
      }
    );
  }

  return {
    [Op.or]:
      conditions,
  };
};

const buildDateWhere = ({
  fechaInicio,
  fechaFin,
}) => {
  if (
    !fechaInicio &&
    !fechaFin
  ) {
    return null;
  }

  const condition = {};

  if (fechaInicio) {
    condition[Op.gte] =
      `${fechaInicio} 00:00:00`;
  }

  if (fechaFin) {
    condition[Op.lte] =
      `${fechaFin} 23:59:59`;
  }

  return condition;
};

const buildListWhere = (
  user,
  query
) => {
  const where = {
    ...buildSecurityWhere(
      user
    ),
  };

  const conceptoId =
    parseOptionalInteger(
      query.concepto_id,
      "concepto_id"
    );

  const entidadTipoId =
    parseOptionalInteger(
      query.entidad_tipo_id,
      "entidad_tipo_id"
    );

  const entidadId =
    parseOptionalInteger(
      query.entidad_id,
      "entidad_id"
    );

  const sucursalId =
    parseOptionalInteger(
      query.sucursal_id,
      "sucursal_id"
    );

  const estado =
    normalizeState(
      query.estado
    );

  const estadoVencimiento =
    String(
      query.estado_vencimiento || ""
    )
      .trim()
      .toUpperCase();

  const activo =
    parseBoolean(
      query.activo,
      true
    );

  // const fechaInicio =
  //   normalizeDate(
  //     query.fecha_inicio,
  //     "fecha_inicio"
  //   );

  // const fechaFin =
  //   normalizeDate(
  //     query.fecha_fin,
  //     "fecha_fin"
  //   );

  const fechaInicio =
    normalizeDate(
      query.vencimiento_desde,
      "vencimiento_desde"
    );

  const fechaFin =
    normalizeDate(
      query.vencimiento_hasta,
      "vencimiento_hasta"
    );

  if (
    fechaInicio &&
    fechaFin &&
    fechaInicio > fechaFin
  ) {
    throw createError(
      "fecha_inicio no puede ser mayor que fecha_fin"
    );
  }

  where.activo =
    activo;

  if (conceptoId) {
    where.concepto_id =
      conceptoId;
  }

  if (entidadTipoId) {
    where.entidad_tipo_id =
      entidadTipoId;
  }

  if (entidadId) {
    where.entidad_id =
      entidadId;
  }

  if (estado) {
    where.estado =
      estado;
  }
  /*
   * Filtro por estado visual de vencimiento.
   *
   * POR_VENCER depende de:
   * - fecha_vencimiento del registro
   * - dias_alerta_vencimiento del concepto
   *
   * "MotorConceptoRegistro" es el alias Sequelize
   * del modelo principal.
   *
   * "concepto" es el alias definido en el include.
   */
  if (
    estadoVencimiento
  ) {

    switch (
    estadoVencimiento
    ) {

      case "VENCIDO":

        where.fecha_vencimiento = {
          [Op.lt]:
            literal(
              "CURRENT_DATE"
            ),
        };

        break;


      case "POR_VENCER":

        where[Op.and] = [
          ...(
            where[Op.and] ||
            []
          ),

          literal(`
                    "MotorConceptoRegistro"."fecha_vencimiento"
                    >= CURRENT_DATE
                `),

          literal(`
                    "MotorConceptoRegistro"."fecha_vencimiento"
                    <= CURRENT_DATE
                    + (
                        COALESCE(
                            "concepto"."dias_alerta_vencimiento",
                            0
                        )
                        * INTERVAL '1 day'
                    )
                `),
        ];

        break;


      case "VIGENTE":

        where[Op.and] = [
          ...(
            where[Op.and] ||
            []
          ),

          literal(`
                    "MotorConceptoRegistro"."fecha_vencimiento"
                    >= CURRENT_DATE
                `),

          literal(`
                    "MotorConceptoRegistro"."fecha_vencimiento"
                    > CURRENT_DATE
                    + (
                        COALESCE(
                            "concepto"."dias_alerta_vencimiento",
                            0
                        )
                        * INTERVAL '1 day'
                    )
                `),
        ];

        break;


      default:

        break;

    }

  }
  /*
   * Los usuarios no administradores
   * no pueden sustituir el filtro de seguridad.
   */
  if (
    sucursalId &&
    (
      Number(user.rol_id) === 1 ||
      !user.sucursal_id
    )
  ) {
    where.sucursal_id =
      sucursalId;
  }

  // const dateWhere =
  //   buildDateWhere({
  //     fechaInicio,
  //     fechaFin,
  //   });

  // if (dateWhere) {
  //   where.ultimo_movimiento =
  //     dateWhere;
  // }

  const dateWhere =
    buildDateWhere({
      fechaInicio,
      fechaFin,
    });

  if (dateWhere) {

    where.fecha_vencimiento =
      dateWhere;

  }


  const searchWhere =
    buildSearchWhere(
      query.search
    );

  if (
    searchWhere
  ) {

    where[Op.and] = [
      ...(
        where[Op.and] ||
        []
      ),

      searchWhere,
    ];

  }
  console.log("===== WHERE =====");
  console.log(JSON.stringify(where, null, 2));

  return where;
};

const getPagination = (
  query
) => {
  const page =
    parsePositiveInteger(
      query.page,
      DEFAULT_PAGE
    );

  const requestedLimit =
    parsePositiveInteger(
      query.limit,
      DEFAULT_LIMIT
    );

  const limit =
    Math.min(
      requestedLimit,
      MAX_LIMIT
    );

  const offset =
    (page - 1) *
    limit;

  return {
    page,
    limit,
    offset,
  };
};

const getOrder = (
  query
) => {
  const sortBy =
    normalizeSortField(
      query.sort ||
      query.sortBy
    );

  const sortDirection =
    normalizeOrder(
      query.order ||
      query.sortDirection
    );

  return [
    [
      sortBy,
      sortDirection,
    ],
    [
      "id",
      "DESC",
    ],
  ];
};

const getListIncludes = () => [
  {
    model:
      MotorConcepto,
    as:
      "concepto",
    required:
      true,
  },
  {
    model:
      MotorConceptoEntidadTipo,
    as:
      "entidadTipo",
    required:
      true,
  },
  {
    model:
      MotorConceptoRegistroVersion,
    as:
      "versionActual",
    required:
      false,
  },
];

const getDetailIncludes = () => [
  {
    model:
      MotorConcepto,

    as:
      "concepto",

    required:
      true,

    include: [
      {
        model:
          MotorConceptoCampo,

        as:
          "campos",

        required:
          false,
      },
      {
        model:
          MotorConceptoRegla,

        as:
          "reglas",

        required:
          false,
      },
      {
        model:
          MotorConceptoArchivoTipo,

        as:
          "archivosTipos",

        required:
          false,
      },
    ],
  },
  {
    model:
      MotorConceptoEntidadTipo,

    as:
      "entidadTipo",

    required:
      true,
  },
  {
    model:
      MotorConceptoRegistroVersion,

    as:
      "versionActual",

    required:
      false,

    include: [
      {
        model:
          MotorConceptoRegistroValor,

        as:
          "valores",

        required:
          false,
      },
      {
        model:
          MotorConceptoRegistroArchivo,

        as:
          "archivos",

        required:
          false,
      },
    ],
  },
];

const findAccessibleRegistro = async (
  user,
  registroId,
  {
    includeDetail = false,
    includeInactive = false,
    includeDeleted = false,
  } = {}
) => {

  getUserId(user);

  const id =
    parseOptionalInteger(
      registroId,
      "id"
    );

  const where = {
    id,
    ...buildSecurityWhere(user),
  };

  if (!includeInactive) {
    where.activo = true;
  }

  const registro =
    await MotorConceptoRegistro.findOne({
      where,
      paranoid: !includeDeleted,
      include:
        includeDetail
          ? getDetailIncludes()
          : getListIncludes(),
    });


  if (!registro) {
    throw createError(
      "El registro no existe o no tiene acceso",
      404
    );
  }

  return registro;
};

// const getResumenByEntidadTipo = async (
//   user,
//   entidadTipoId
// ) => {

//   getUserId(
//     user
//   );

//   const tipoId =
//     parseOptionalInteger(
//       entidadTipoId,
//       "entidad_tipo_id"
//     );

//   if (
//     !tipoId
//   ) {
//     throw createError(
//       "entidad_tipo_id es obligatorio"
//     );
//   }

//   /*
//    * Utilizamos las asignaciones como universo
//    * documental de cada entidad.
//    *
//    * Esto permite incluir también conceptos
//    * pendientes que todavía no poseen registro.
//    */
//   const asignaciones =
//     await MotorConceptoEntidadAsignacion
//       .findAll({
//         where: {
//           entidad_tipo_id:
//             tipoId,

//           activo:
//             true,

//           ...buildSecurityWhere(
//             user
//           ),
//         },

//         attributes: [
//           "id",
//           "concepto_id",
//           "entidad_tipo_id",
//           "entidad_id",
//           "registro_actual_id",
//           "estado",
//           "obligatorio",
//         ],

//         include: [
//           {
//             model:
//               MotorConcepto,

//             as:
//               "concepto",

//             required:
//               true,

//             attributes: [
//               "id",
//               "usa_vencimiento",
//               "dias_alerta_vencimiento",
//             ],
//           },

//           {
//             model:
//               MotorConceptoRegistro,

//             as:
//               "registroActual",

//             required:
//               false,

//             attributes: [
//               "id",
//               "estado",
//               "fecha_vencimiento",
//               "activo",
//             ],
//           },
//         ],
//       });

//   const resumen =
//     new Map();

//   const hoy =
//     new Date();

//   hoy.setHours(
//     0,
//     0,
//     0,
//     0
//   );

//   asignaciones.forEach(
//     (asignacion) => {

//       const item =
//         asignacion.toJSON();

//       const entidadId =
//         Number(
//           item.entidad_id
//         );

//       if (
//         !resumen.has(
//           entidadId
//         )
//       ) {

//         resumen.set(
//           entidadId,
//           {
//             entidad_id:
//               entidadId,

//             vigentes:
//               0,

//             por_vencer:
//               0,

//             vencidos:
//               0,

//             pendientes:
//               0,
//           }
//         );

//       }

//       const contador =
//         resumen.get(
//           entidadId
//         );

//       const registro =
//         item.registroActual;

//       /*
//        * No existe registro.
//        */
//       if (
//         !item.registro_actual_id ||
//         !registro
//       ) {

//         contador.pendientes +=
//           1;

//         return;

//       }

//       /*
//        * Registro sin vencimiento.
//        */
//       if (
//         !item.concepto
//           ?.usa_vencimiento ||
//         !registro
//           .fecha_vencimiento
//       ) {

//         contador.vigentes +=
//           1;

//         return;

//       }

//       const fechaVencimiento =
//         new Date(
//           `${registro.fecha_vencimiento}T00:00:00`
//         );

//       /*
//        * Documento vencido.
//        */
//       if (
//         fechaVencimiento <
//         hoy
//       ) {

//         contador.vencidos +=
//           1;

//         return;

//       }

//       const diasAlerta =
//         Number(
//           item.concepto
//             ?.dias_alerta_vencimiento ||
//           0
//         );

//       if (
//         diasAlerta > 0
//       ) {

//         const fechaAlerta =
//           new Date(
//             hoy
//           );

//         fechaAlerta.setDate(
//           fechaAlerta.getDate() +
//           diasAlerta
//         );

//         if (
//           fechaVencimiento <=
//           fechaAlerta
//         ) {

//           contador.por_vencer +=
//             1;

//           return;

//         }

//       }

//       contador.vigentes +=
//         1;

//     }
//   );

//   return {
//     rows:
//       Array.from(
//         resumen.values()
//       ),
//   };

// };

const getResumenByEntidadTipo = async (
  user,
  entidadTipoId
) => {


  console.log(
    "🔥 SERVICE getResumenByEntidadTipo",
    entidadTipoId
  );

  getUserId(
    user
  );

  const tipoId =
    parseOptionalInteger(
      entidadTipoId,
      "entidad_tipo_id"
    );

  if (
    !tipoId
  ) {

    throw createError(
      "entidad_tipo_id es obligatorio"
    );

  }


  /*
   * =========================================================
   * 1. ASIGNACIONES DOCUMENTALES
   * =========================================================
   *
   * Definen qué conceptos forman parte
   * de la documentación de cada entidad:
   *
   * - obligatorios generados automáticamente
   * - opcionales asignados manualmente
   *
   * NO usamos registro_actual_id como
   * fuente de verdad.
   */

  const asignaciones =
    await MotorConceptoEntidadAsignacion
      .findAll({

        where: {

          entidad_tipo_id:
            tipoId,

          activo:
            true,

          ...buildSecurityWhere(
            user
          ),

        },

        attributes: [
          "id",
          "concepto_id",
          "entidad_tipo_id",
          "entidad_id",
          "obligatorio",
          "activo",
        ],

        include: [
          {
            model:
              MotorConcepto,

            as:
              "concepto",

            required:
              true,

            attributes: [
              "id",
              "nombre",
              "usa_vencimiento",
              "dias_alerta_vencimiento",
            ],
          },
        ],

      });

  /*
   * =========================================================
   *
   * 1.1 CONCEPTOS OBLIGATORIOS DEL TIPO DE ENTIDAD
   * =========================================================
   *
   * MotorConceptoEntidad define qué conceptos
   * son obligatorios para TODAS las entidades
   * pertenecientes al tipo.
   *
   * Esta es la fuente de verdad para determinar
   * documentación obligatoria pendiente.
   */

  const conceptosObligatorios =
    await MotorConceptoEntidad
      .findAll({

        where: {

          entidad_tipo_id:
            tipoId,

          obligatorio:
            true,

          activo:
            true,

        },

        attributes: [
          "id",
          "concepto_id",
          "entidad_tipo_id",
          "obligatorio",
          "activo",
        ],

        include: [
          {
            model:
              MotorConcepto,

            as:
              "concepto",

            required:
              true,

            attributes: [
              "id",
              "nombre",
              "usa_vencimiento",
              "dias_alerta_vencimiento",
            ],
          },
        ],

      });

  /*
   * =========================================================
   * 2. REGISTROS REALES
   * =========================================================
   *
   * MotorConceptoRegistro es la fuente
   * de verdad para saber si el concepto
   * fue completado.
   */

  const registros =
    await MotorConceptoRegistro
      .findAll({

        where: {

          entidad_tipo_id:
            tipoId,

          activo:
            true,

          ...buildSecurityWhere(
            user
          ),

        },

        include: [
          {
            model:
              MotorConcepto,

            as:
              "concepto",

            required:
              true,

            attributes: [
              "id",
              "nombre",
              "usa_vencimiento",
              "dias_alerta_vencimiento",
            ],
          },
        ],

        order: [
          [
            "ultimo_movimiento",
            "DESC",
          ],
          [
            "id",
            "DESC",
          ],
        ],

      });


  /*
   * =========================================================
   * 3. ÚLTIMO REGISTRO POR ENTIDAD + CONCEPTO
   * =========================================================
   */

  const registrosMap =
    new Map();


  registros.forEach(
    (
      registro
    ) => {

      const key =
        `${Number(
          registro.entidad_id
        )}:${Number(
          registro.concepto_id
        )}`;


      /*
       * Como vienen ordenados del más
       * reciente al más antiguo,
       * conservamos solamente el primero.
       */

      if (
        registrosMap.has(
          key
        )
      ) {
        return;
      }


      registrosMap.set(
        key,
        registro
      );

    }
  );


  /*
   * =========================================================
   * 4. RESUMEN POR ENTIDAD
   * =========================================================
   */

  const resumen =
    new Map();


  const obtenerContador =
    (
      entidadId
    ) => {

      const id =
        Number(
          entidadId
        );


      if (
        !resumen.has(
          id
        )
      ) {

        resumen.set(
          id,
          {
            entidad_id:
              id,

            vigentes:
              0,

            por_vencer:
              0,

            vencidos:
              0,

            pendientes:
              0,
          }
        );

      }


      return resumen.get(
        id
      );

    };


  const hoy =
    new Date();

  hoy.setHours(
    0,
    0,
    0,
    0
  );




  /*
   * =========================================================
   * 5. PROCESAR ASIGNACIONES
   * =========================================================
   */

  /*
 * Conceptos obligatorios configurados
 * para este tipo de entidad.
 */

  const conceptosObligatoriosIds =
    new Set(
      conceptosObligatorios.map(
        (item) =>
          Number(
            item.concepto_id
          )
      )
    );


  /*
   * Entidades conocidas por las asignaciones.
   *
   * Cada entidad se procesa una sola vez.
   */

  const entidadesIds =
    new Set(
      asignaciones.map(
        (item) =>
          Number(
            item.entidad_id
          )
      )
    );


  /*
   * Calculamos pendientes obligatorios.
   *
   * Un concepto obligatorio está pendiente
   * cuando NO existe MotorConceptoRegistro
   * para entidad + concepto.
   */

  entidadesIds.forEach(
    (
      entidadId
    ) => {

      const contador =
        obtenerContador(
          entidadId
        );

      conceptosObligatoriosIds
        .forEach(
          (
            conceptoId
          ) => {

            const key =
              `${entidadId}:${conceptoId}`;

            const registro =
              registrosMap.get(
                key
              );

            if (
              !registro
            ) {

              contador.pendientes +=
                1;

            }

          }
        );

    }
  );

  asignaciones.forEach(
    (
      asignacion
    ) => {

      const item =
        asignacion.toJSON();

      const entidadId =
        Number(
          item.entidad_id
        );

      const conceptoId =
        Number(
          item.concepto_id
        );


      const contador =
        obtenerContador(
          entidadId
        );


      const key =
        `${entidadId}:${conceptoId}`;


      const registro =
        registrosMap.get(
          key
        );


      /*
       * No existe registro real.
       *
       * Si existe asignación documental,
       * el concepto está pendiente.
       *
       * Esto cubre:
       * - obligatorio automático
       * - opcional asignado manualmente
       */

      if (
        !registro
      ) {

        /*
         * Los obligatorios ya fueron
         * contabilizados desde
         * MotorConceptoEntidad.
         */

        if (
          !conceptosObligatoriosIds
            .has(
              conceptoId
            )
        ) {

          /*
           * Si no es obligatorio pero existe
           * una asignación manual, también
           * constituye documentación pendiente.
           */

          contador.pendientes +=
            1;

        }

        return;

      }


      const registroData =
        registro.toJSON();


      /*
       * Registro sin vencimiento.
       */

      if (
        !item.concepto
          ?.usa_vencimiento ||
        !registroData
          .fecha_vencimiento
      ) {

        contador.vigentes +=
          1;

        return;

      }


      const fechaVencimiento =
        new Date(
          `${registroData.fecha_vencimiento}T00:00:00`
        );

      fechaVencimiento.setHours(
        0,
        0,
        0,
        0
      );


      /*
       * VENCIDO
       */

      if (
        fechaVencimiento <
        hoy
      ) {

        contador.vencidos +=
          1;

        return;

      }


      const diasAlerta =
        Number(
          item.concepto
            ?.dias_alerta_vencimiento ||
          0
        );


      /*
       * POR VENCER
       */

      if (
        diasAlerta > 0
      ) {

        const fechaAlerta =
          new Date(
            hoy
          );

        fechaAlerta.setDate(
          fechaAlerta.getDate() +
          diasAlerta
        );


        if (
          fechaVencimiento <=
          fechaAlerta
        ) {

          contador.por_vencer +=
            1;

          return;

        }

      }


      /*
       * VIGENTE
       */

      contador.vigentes +=
        1;

    }
  );


  /*
   * =========================================================
   * 6. REGISTROS QUE NO TENGAN ASIGNACIÓN
   * =========================================================
   *
   * Esto protege registros históricos o
   * existentes que por alguna razón no tengan
   * una fila de asignación.
   */

  registrosMap.forEach(
    (
      registro,
      key
    ) => {

      const existeAsignacion =
        asignaciones.some(
          (
            asignacion
          ) =>
            Number(
              asignacion.entidad_id
            ) ===
            Number(
              registro.entidad_id
            ) &&
            Number(
              asignacion.concepto_id
            ) ===
            Number(
              registro.concepto_id
            )
        );


      if (
        existeAsignacion
      ) {
        return;
      }


      const contador =
        obtenerContador(
          registro.entidad_id
        );


      const registroData =
        registro.toJSON();

      const concepto =
        registroData.concepto;


      if (
        !concepto
          ?.usa_vencimiento ||
        !registroData
          .fecha_vencimiento
      ) {

        contador.vigentes +=
          1;

        return;

      }


      const fechaVencimiento =
        new Date(
          `${registroData.fecha_vencimiento}T00:00:00`
        );


      if (
        fechaVencimiento <
        hoy
      ) {

        contador.vencidos +=
          1;

        return;

      }


      const diasAlerta =
        Number(
          concepto
            ?.dias_alerta_vencimiento ||
          0
        );


      if (
        diasAlerta > 0
      ) {

        const fechaAlerta =
          new Date(
            hoy
          );

        fechaAlerta.setDate(
          fechaAlerta.getDate() +
          diasAlerta
        );


        if (
          fechaVencimiento <=
          fechaAlerta
        ) {

          contador.por_vencer +=
            1;

          return;

        }

      }


      contador.vigentes +=
        1;

    }
  );

  console.log(
    "========== RESUMEN BACKEND =========="
  );

  console.log(
    "tipoId:",
    tipoId
  );

  console.log(
    "obligatorios:",
    conceptosObligatorios.length
  );

  console.log(
    "asignaciones:",
    asignaciones.length
  );

  console.log(
    "registros:",
    registros.length
  );

  console.log(
    "resumen:",
    Array.from(
      resumen.values()
    )
  );

  console.log(
    "====================================="
  );

  return {

    rows:
      Array.from(
        resumen.values()
      ),

    total_obligatorios:
      conceptosObligatorios.length,

  };

};

const getAll = async (
  user,
  query = {}
) => {
  getUserId(user);

  const {
    page,
    limit,
    offset,
  } =
    getPagination(
      query
    );

  const where =
    buildListWhere(
      user,
      query
    );

  const order =
    getOrder(
      query
    );

  const result =
    await MotorConceptoRegistro.findAndCountAll({
      where,
      include:
        getListIncludes(),
      order,
      limit,
      offset,
      distinct:
        true,
    });

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const registros =
    result.rows.map(
      (registro) => {

        const row =
          registro.toJSON();

        row.dias_restantes =
          null;

        row.estado_visual =
          row.estado;

        if (
          row.fecha_vencimiento
        ) {

          const fecha =
            new Date(
              row.fecha_vencimiento
            );

          fecha.setHours(
            0,
            0,
            0,
            0
          );

          row.dias_restantes =
            Math.ceil(
              (
                fecha - today
              ) /
              (
                1000 *
                60 *
                60 *
                24
              )
            );

          if (
            row.dias_restantes < 0
          ) {

            row.estado_visual =
              "VENCIDO";

          } else {

            const diasAlerta =
              row.concepto
                ?.dias_alerta_vencimiento ||
              0;

            if (
              diasAlerta > 0 &&
              row.dias_restantes <=
              diasAlerta
            ) {

              row.estado_visual =
                "POR_VENCER";

            }

          }

        }

        return row;

      }
    );

  let registrosFiltrados =
    registros;

  if (
    query.estado_vencimiento
  ) {

    registrosFiltrados =
      registros.filter(
        registro =>
          registro.estado_visual ===
          query.estado_vencimiento
      );

  }

  const total =
    Number(
      result.count || 0
    );

  const totalPages =
    total > 0
      ? Math.ceil(
        total / limit
      )
      : 0;

  return {
    rows:
      registrosFiltrados,

    registros:
      registrosFiltrados,

    total,

    page,

    limit,

    totalPages,

    hasPreviousPage:
      page > 1,

    hasNextPage:
      page < totalPages,

    filters: {
      search:
        normalizeText(
          query.search
        ),

      concepto_id:
        query.concepto_id ||
        null,

      entidad_tipo_id:
        query.entidad_tipo_id ||
        null,

      entidad_id:
        query.entidad_id ||
        null,

      estado:
        query.estado ||
        null,

      sucursal_id:
        query.sucursal_id ||
        null,

      fecha_inicio:
        query.fecha_inicio ||
        null,

      fecha_fin:
        query.fecha_fin ||
        null,

      activo:
        parseBoolean(
          query.activo,
          true
        ),

      sort:
        normalizeSortField(
          query.sort ||
          query.sortBy
        ),

      order:
        normalizeOrder(
          query.order ||
          query.sortDirection
        ),
    },
  };
};

const getById = async (
  user,
  registroId
) => {
  const registro =
    await findAccessibleRegistro(
      user,
      registroId,
      {
        includeDetail:
          true,
      }
    );

  return registro;
};

const getHistory = async (
  user,
  registroId
) => {
  const registro =
    await findAccessibleRegistro(
      user,
      registroId
    );

  const versiones =
    await MotorConceptoRegistroVersion.findAll({
      where: {
        registro_id:
          registro.id,
      },

      include: [
        {
          model:
            MotorConceptoRegistroValor,
          as:
            "valores",
          required:
            false,
        },
        {
          model:
            MotorConceptoRegistroArchivo,
          as:
            "archivos",
          required:
            false,
          paranoid:
            false,
        },
      ],

      order: [
        [
          "numero",
          "DESC",
        ],
        [
          "id",
          "DESC",
        ],
      ],
    });

  return {
    registro,
    versiones,
  };
};

const assertUser = (user) => {
  if (!user?.id) throw createError("Usuario autenticado requerido", 401);
};

// const create = async (
//   user,
//   payload
// ) => {

//   assertUser(user);

//   if (!payload.concepto_id) {
//     throw createError(
//       "concepto_id es obligatorio"
//     );
//   }

//   if (!payload.entidad_tipo_id) {
//     throw createError(
//       "entidad_tipo_id es obligatorio"
//     );
//   }

//   if (!payload.entidad_id) {
//     throw createError(
//       "entidad_id es obligatorio"
//     );
//   }

//   return sequelize.transaction(
//     async (transaction) => {

//       const concepto =
//         await getConceptoOrFail(
//           payload.concepto_id,
//           {
//             transaction,
//           }
//         );

//       await ensureEntityTypeAllowed(
//         concepto.id,
//         payload.entidad_tipo_id,
//         transaction
//       );

//       if (
//         !concepto.permite_multiples
//       ) {

//         const duplicate =
//           await MotorConceptoRegistro.findOne({
//             where: {
//               concepto_id:
//                 concepto.id,
//               entidad_tipo_id:
//                 payload.entidad_tipo_id,
//               entidad_id:
//                 payload.entidad_id,
//               activo: true,
//             },
//             transaction,
//           });

//         if (duplicate) {
//           throw createError(
//             "El concepto no permite múltiples registros para la misma entidad"
//           );
//         }

//       }

//       const valoresRecibidos =
//         payload.valores &&
//           !Array.isArray(payload.valores) &&
//           typeof payload.valores === "object"
//           ? payload.valores
//           : {};

//       const tieneValores =
//         Object.keys(
//           valoresRecibidos
//         ).length > 0;

//       const fields =
//         tieneValores
//           ? await getActiveFields(
//             concepto.id,
//             transaction
//           )
//           : [];

//       const fechaVencimiento =
//         concepto.usa_vencimiento
//           ? parseDateOnly(
//             payload.fecha_vencimiento,
//             "fecha_vencimiento"
//           )
//           : null;

//       /*
//        * Calcular estado automáticamente.
//        */
//       let estado =
//         payload.estado;

//       if (!estado) {

//         estado =
//           registroEstadoHelper
//             .calcularEstadoRegistro({

//               usaVencimiento:
//                 concepto.usa_vencimiento,

//               fechaVencimiento,

//             });

//       }

//       console.log(
//         "========== CREATE MOTOR CONCEPTO REGISTRO =========="
//       );

//       console.log(
//         "payload.estado:",
//         payload.estado
//       );

//       console.log(
//         "estado calculado/final:",
//         estado
//       );

//       console.log(
//         "ESTADOS permitidos:",
//         ESTADOS
//       );

//       console.log(
//         "concepto.usa_vencimiento:",
//         concepto.usa_vencimiento
//       );

//       console.log(
//         "fechaVencimiento:",
//         fechaVencimiento
//       );

//       console.log(
//         "payload completo:",
//         payload
//       );

//       console.log(
//         "===================================================="
//       );

//       if (
//         !ESTADOS.includes(
//           estado
//         )
//       ) {
//         throw createError(
//           "Estado inválido"
//         );
//       }

//       const registro =
//         await MotorConceptoRegistro.create(
//           {
//             concepto_id:
//               concepto.id,
//             entidad_tipo_id:
//               payload.entidad_tipo_id,
//             entidad_id:
//               payload.entidad_id,
//             estado,
//             version_actual_id:
//               null,
//             fecha_vencimiento:
//               fechaVencimiento,
//             ultimo_movimiento:
//               new Date(),
//             observaciones:
//               payload.observaciones ||
//               null,
//             sucursal_id:
//               user.sucursal_id ||
//               null,
//             activo: true,
//             creado_por:
//               user.id,
//             modificado_por:
//               user.id,
//           },
//           {
//             transaction,
//           }
//         );

//       const version =
//         await MotorConceptoRegistroVersion.create(
//           {
//             registro_id:
//               registro.id,
//             numero: 1,
//             motivo:
//               payload.motivo ||
//               "Creación",
//             comentario:
//               payload.comentario ||
//               null,
//             estado,
//             fecha_vencimiento:
//               fechaVencimiento,
//             creado_por:
//               user.id,
//           },
//           {
//             transaction,
//           }
//         );

//       if (tieneValores) {

//         await persistValues({
//           versionId:
//             version.id,
//           fields,
//           values:
//             valoresRecibidos,
//           transaction,
//         });

//       }

//       await registro.update(
//         {
//           version_actual_id:
//             version.id,
//           ultimo_movimiento:
//             new Date(),
//         },
//         {
//           transaction,
//         }
//       );

//       return MotorConceptoRegistro.findByPk(
//         registro.id,
//         {
//           include:
//             detailIncludes,
//           transaction,
//         }
//       );

//     }
//   );

// };

const create = async (
  user,
  payload,
  archivos = [],
  metadataArchivos = []
) => {

  assertUser(user);

  if (!payload.concepto_id) {
    throw createError(
      "concepto_id es obligatorio"
    );
  }

  if (!payload.entidad_tipo_id) {
    throw createError(
      "entidad_tipo_id es obligatorio"
    );
  }

  if (!payload.entidad_id) {
    throw createError(
      "entidad_id es obligatorio"
    );
  }

  const uploadedDriveFiles =
    [];

  try {

    return sequelize.transaction(
      async (transaction) => {

        const concepto =
          await getConceptoOrFail(
            payload.concepto_id,
            {
              transaction,
            }
          );

        await ensureEntityTypeAllowed(
          concepto.id,
          payload.entidad_tipo_id,
          transaction
        );

        if (
          !concepto.permite_multiples
        ) {

          const duplicate =
            await MotorConceptoRegistro.findOne({
              where: {
                concepto_id:
                  concepto.id,
                entidad_tipo_id:
                  payload.entidad_tipo_id,
                entidad_id:
                  payload.entidad_id,
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

        const valoresRecibidos =
          payload.valores &&
            !Array.isArray(payload.valores) &&
            typeof payload.valores === "object"
            ? payload.valores
            : {};

        const tieneValores =
          Object.keys(
            valoresRecibidos
          ).length > 0;

        const fields =
          tieneValores
            ? await getActiveFields(
              concepto.id,
              transaction
            )
            : [];

        const fechaVencimiento =
          concepto.usa_vencimiento
            ? parseDateOnly(
              payload.fecha_vencimiento,
              "fecha_vencimiento"
            )
            : null;

        /*
         * Calcular estado automáticamente.
         */
        let estado =
          payload.estado;

        if (!estado) {

          estado =
            registroEstadoHelper
              .calcularEstadoRegistro({

                usaVencimiento:
                  concepto.usa_vencimiento,

                fechaVencimiento,

              });

        }

        console.log(
          "========== CREATE MOTOR CONCEPTO REGISTRO =========="
        );

        console.log(
          "payload.estado:",
          payload.estado
        );

        console.log(
          "estado calculado/final:",
          estado
        );

        console.log(
          "ESTADOS permitidos:",
          ESTADOS
        );

        console.log(
          "concepto.usa_vencimiento:",
          concepto.usa_vencimiento
        );

        console.log(
          "fechaVencimiento:",
          fechaVencimiento
        );

        console.log(
          "payload completo:",
          payload
        );

        console.log(
          "===================================================="
        );

        if (
          !ESTADOS.includes(
            estado
          )
        ) {
          throw createError(
            "Estado inválido"
          );
        }

        const registro =
          await MotorConceptoRegistro.create(
            {
              concepto_id:
                concepto.id,
              entidad_tipo_id:
                payload.entidad_tipo_id,
              entidad_id:
                payload.entidad_id,
              estado,
              version_actual_id:
                null,
              fecha_vencimiento:
                fechaVencimiento,
              ultimo_movimiento:
                new Date(),
              observaciones:
                payload.observaciones ||
                null,
              sucursal_id:
                user.sucursal_id ||
                null,
              activo: true,
              creado_por:
                user.id,
              modificado_por:
                user.id,
            },
            {
              transaction,
            }
          );

        const version =
          await MotorConceptoRegistroVersion.create(
            {
              registro_id:
                registro.id,
              numero: 1,
              motivo:
                payload.motivo ||
                "Creación",
              comentario:
                payload.comentario ||
                null,
              estado,
              fecha_vencimiento:
                fechaVencimiento,
              creado_por:
                user.id,
            },
            {
              transaction,
            }
          );

        if (tieneValores) {

          await persistValues({
            versionId:
              version.id,
            fields,
            values:
              valoresRecibidos,
            transaction,
          });

        }

        if (
          Array.isArray(archivos) &&
          archivos.length > 0
        ) {

          await registroArchivoService
            .uploadForCreate({
              user,
              registro,
              version,
              archivos,
              metadataArchivos,
              transaction,
              uploadedDriveFiles,
            });

        }

        await registro.update(
          {
            version_actual_id:
              version.id,
            ultimo_movimiento:
              new Date(),
          },
          {
            transaction,
          }
        );

        return MotorConceptoRegistro.findByPk(
          registro.id,
          {
            include:
              detailIncludes,
            transaction,
          }
        );

      }


    );
  } catch (error) {

    /*
     * PostgreSQL ya realizó rollback.
     *
     * Ahora compensamos los recursos externos
     * que no participan de la transaction SQL.
     */
    for (
      const driveFileId
      of uploadedDriveFiles
    ) {

      try {

        await deleteFromDrive(
          driveFileId
        );

      } catch (
      cleanupError
      ) {

        console.error(
          "[MotorConceptos] No se pudo limpiar archivo de Drive:",
          driveFileId,
          cleanupError.message
        );

      }

    }

    throw error;
  }
};

const createVersion = async (
  user,
  id,
  payload
) => {

  assertUser(user);

  return sequelize.transaction(
    async (transaction) => {

      const registro =
        await MotorConceptoRegistro.findOne({
          where:
            buildScopeWhere(
              user,
              { id }
            ),
          transaction,
          lock:
            transaction.LOCK.UPDATE,
        });

      if (!registro) {
        throw createError(
          "Registro no encontrado",
          404
        );
      }

      const concepto =
        await getConceptoOrFail(
          registro.concepto_id,
          {
            transaction,
          }
        );

      const nextEstado =
        payload.estado ||
        registro.estado;

      if (
        !ESTADOS.includes(
          nextEstado
        )
      ) {
        throw createError(
          "Estado inválido"
        );
      }

      const currentMax =
        await MotorConceptoRegistroVersion.max(
          "numero",
          {
            where: {
              registro_id:
                registro.id,
            },
            transaction,
          }
        );

      const nextNumber =
        Number(
          currentMax || 0
        ) + 1;

      const fields =
        await getActiveFields(
          concepto.id,
          transaction
        );

      const fechaVencimiento =
        concepto.usa_vencimiento
          ? parseDateOnly(
            payload.fecha_vencimiento ??
            registro.fecha_vencimiento,
            "fecha_vencimiento"
          )
          : null;

      const version =
        await MotorConceptoRegistroVersion.create(
          {
            registro_id:
              registro.id,
            numero:
              nextNumber,
            motivo:
              payload.motivo ||
              "Actualización",
            comentario:
              payload.comentario ||
              null,
            estado:
              nextEstado,
            fecha_vencimiento:
              fechaVencimiento,
            creado_por:
              user.id,
          },
          {
            transaction,
          }
        );

      await persistValues({
        versionId:
          version.id,
        fields,
        values:
          payload.valores,
        transaction,
      });

      await registro.update(
        {
          estado:
            nextEstado,
          fecha_vencimiento:
            fechaVencimiento,
          observaciones:
            payload.observaciones !==
              undefined
              ? payload.observaciones
              : registro.observaciones,
          version_actual_id:
            version.id,
          ultimo_movimiento:
            new Date(),
          modificado_por:
            user.id,
        },
        {
          transaction,
        }
      );

      return MotorConceptoRegistro.findByPk(
        registro.id,
        {
          include:
            detailIncludes,
          transaction,
        }
      );

    }
  );

};

const renovarRegistro = async (
  user,
  registroId,
  payload = {}
) => {

  return await createVersion(
    user,
    registroId,
    {
      ...payload,

      estado: "VIGENTE",

      motivo:
        payload.motivo ||
        "Renovación",
    }
  );

};

const changeStatus = async (
  user,
  id,
  payload
) => {

  assertUser(user);

  if (
    !ESTADOS.includes(
      payload.estado
    )
  ) {
    throw createError(
      "Estado inválido"
    );
  }

  return sequelize.transaction(
    async (transaction) => {

      const registro =
        await MotorConceptoRegistro.findOne({
          where:
            buildScopeWhere(
              user,
              { id }
            ),
          transaction,
          lock:
            transaction.LOCK.UPDATE,
        });

      if (!registro) {
        throw createError(
          "Registro no encontrado",
          404
        );
      }

      await registro.update(
        {
          estado:
            payload.estado,
          ultimo_movimiento:
            new Date(),
          modificado_por:
            user.id,
        },
        {
          transaction,
        }
      );

      if (
        registro.version_actual_id
      ) {

        await MotorConceptoRegistroVersion.update(
          {
            estado:
              payload.estado,
          },
          {
            where: {
              id:
                registro.version_actual_id,
            },
            transaction,
          }
        );

      }

      return MotorConceptoRegistro.findByPk(
        registro.id,
        {
          include:
            detailIncludes,
          transaction,
        }
      );

    }
  );

};

const remove = async (
  user,
  registroId
) => {

  console.log("eliminando", registroId);
  const userId =
    getUserId(user);

  const registro =
    await findAccessibleRegistro(
      user,
      registroId
    );

  await registro.update({
    activo:
      false,

    modificado_por:
      userId,

    ultimo_movimiento:
      new Date(),
  });

  await registro.destroy();

  return {
    id:
      registro.id,

    activo:
      false,
  };
};

const markExpired = async (
  user = null
) => {
  const userId =
    user
      ? getUserId(user)
      : null;

  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  const where = {
    activo: true,

    fecha_vencimiento: {
      [Op.lt]: today,
    },

    estado: {
      [Op.notIn]: [
        "VENCIDO",
        "ANULADO",
      ],
    },

    ...(user
      ? buildSecurityWhere(user)
      : {}),
  };

  const registros =
    await MotorConceptoRegistro.findAll({
      where,
      attributes: [
        "id",
        "version_actual_id",
      ],
    });

  if (
    registros.length === 0
  ) {
    return {
      procesados:
        0,

      registros:
        [],
    };
  }

  const registroIds =
    registros.map(
      (registro) =>
        registro.id
    );

  const versionIds =
    registros
      .map(
        (registro) =>
          registro.version_actual_id
      )
      .filter(Boolean);

  const changes = {
    estado: "VENCIDO",
    ultimo_movimiento: new Date(),
  };

  if (userId) {
    changes.modificado_por = userId;
  }

  await MotorConceptoRegistro.update(
    changes,
    {
      where: {
        id: {
          [Op.in]: registroIds,
        },
      },
    }
  );

  if (
    versionIds.length > 0
  ) {
    await MotorConceptoRegistroVersion.update(
      {
        estado:
          "VENCIDO",
      },
      {
        where: {
          id: {
            [Op.in]:
              versionIds,
          },
        },
      }
    );
  }

  return {
    procesados:
      registroIds.length,

    registros:
      registroIds,
  };
};

const update = async (
  user,
  registroId,
  payload = {}
) => {



  const userId =
    getUserId(user);

  return sequelize.transaction(
    async (transaction) => {
      const registro =
        await findAccessibleRegistro(
          user,
          registroId,
          {
            includeDetail: true,
          }
        );

      const versionActual =
        registro.versionActual;

      if (!versionActual) {
        throw createError(
          "El registro no tiene una versión actual",
          400
        );
      }

      const campos =
        await getActiveFields(
          registro.concepto_id,
          transaction
        );

      const valores =
        payload.valores &&
          typeof payload.valores === "object"
          ? payload.valores
          : [];

      /*
       * Se eliminan los valores actuales de la versión
       * y se vuelven a persistir con el contenido recibido.
       *
       * No se crea una nueva versión.
       */
      await MotorConceptoRegistroValor.destroy({
        where: {
          version_id:
            versionActual.id,
        },
        transaction,
      });

      await persistValues({
        versionId:
          versionActual.id,

        fields:
          campos,

        values:
          valores,

        transaction,
      });

      const registroChanges = {
        ultimo_movimiento:
          new Date(),

        modificado_por:
          userId,
      };

      if (
        payload.observaciones !==
        undefined
      ) {
        registroChanges.observaciones =
          payload.observaciones || null;
      }

      if (
        payload.fecha_vencimiento !==
        undefined
      ) {
        registroChanges.fecha_vencimiento =
          registro.concepto
            ?.usa_vencimiento
            ? parseDateOnly(
              payload.fecha_vencimiento,
              "fecha_vencimiento"
            )
            : null;
      }

      if (
        payload.estado !==
        undefined
      ) {
        registroChanges.estado =
          payload.estado;
      }

      await registro.update(
        registroChanges,
        {
          transaction,
        }
      );

      const versionChanges = {};

      if (
        payload.estado !==
        undefined
      ) {
        versionChanges.estado =
          payload.estado;
      }

      if (
        payload.fecha_vencimiento !==
        undefined
      ) {
        versionChanges.fecha_vencimiento =
          registroChanges.fecha_vencimiento;
      }

      if (
        Object.keys(
          versionChanges
        ).length > 0
      ) {
        await versionActual.update(
          versionChanges,
          {
            transaction,
          }
        );
      }

      return findAccessibleRegistro(
        user,
        registro.id,
        {
          includeDetail: true,
        }
      );
    }
  );
};

export default {
  update,
  getAll,
  getById,
  getHistory,
  remove,
  markExpired,
  create,
  createVersion,
  changeStatus,
  renovarRegistro,
  getResumenByEntidadTipo
};