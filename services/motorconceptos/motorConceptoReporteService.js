import {
  Op,
  fn,
  col,
} from "sequelize";

import {
  MotorConcepto,
  MotorConceptoEntidadTipo,
} from "../../models/motorconceptos/index.js";

import {
  MotorConceptoRegistro,
  MotorConceptoRegistroVersion,
  MotorConceptoRegistroArchivo,
} from "../../models/motorconceptos/operacionAssociations.js";

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
  activo: "activo",
  created_at: "created_at",
  updated_at: "updated_at",
};

const createError = (
  message,
  status = 400
) => {
  const error = new Error(message);

  error.status = status;

  return error;
};

const assertUser = (
  user
) => {
  if (!user?.id) {
    throw createError(
      "Usuario autenticado requerido",
      401
    );
  }
};

const normalizeText = (
  value
) =>
  String(
    value || ""
  ).trim();

const parsePositiveInteger = (
  value,
  fallback
) => {
  const parsed =
    Number.parseInt(
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

  const parsed =
    Number.parseInt(
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
    value === 1 ||
    value === "1" ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {
    return false;
  }

  return fallback;
};

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

const normalizeDate = (
  value,
  fieldName
) => {
  const date =
    normalizeText(value);

  if (!date) {
    return null;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {
    throw createError(
      `${fieldName} debe tener formato YYYY-MM-DD`
    );
  }

  return date;
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

const buildSecurityWhere = (
  user
) => {
  assertUser(user);

  const where = {};

  if (
    Number(user.rol_id) !== 1 &&
    user.sucursal_id
  ) {
    where.sucursal_id =
      user.sucursal_id;
  }

  return where;
};

const buildDateCondition = ({
  desde,
  hasta,
  includeTime = false,
}) => {
  if (
    !desde &&
    !hasta
  ) {
    return null;
  }

  const condition = {};

  if (desde) {
    condition[Op.gte] =
      includeTime
        ? `${desde} 00:00:00`
        : desde;
  }

  if (hasta) {
    condition[Op.lte] =
      includeTime
        ? `${hasta} 23:59:59`
        : hasta;
  }

  return condition;
};

const validateDateRange = (
  desde,
  hasta,
  desdeField,
  hastaField
) => {
  if (
    desde &&
    hasta &&
    desde > hasta
  ) {
    throw createError(
      `${desdeField} no puede ser mayor que ${hastaField}`
    );
  }
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
        [Op.iLike]:
          `%${value}%`,
      },
    },
    {
      estado: {
        [Op.iLike]:
          `%${value.toUpperCase()}%`,
      },
    },
    {
      "$concepto.codigo$": {
        [Op.iLike]:
          `%${value}%`,
      },
    },
    {
      "$concepto.nombre$": {
        [Op.iLike]:
          `%${value}%`,
      },
    },
    {
      "$entidadTipo.codigo$": {
        [Op.iLike]:
          `%${value}%`,
      },
    },
    {
      "$entidadTipo.nombre$": {
        [Op.iLike]:
          `%${value}%`,
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
        concepto_id:
          numericValue,
      },
      {
        entidad_tipo_id:
          numericValue,
      },
      {
        entidad_id:
          numericValue,
      }
    );
  }

  return {
    [Op.or]:
      conditions,
  };
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

  const activo =
    parseBoolean(
      query.activo,
      true
    );

  const fechaVencimientoDesde =
    normalizeDate(
      query.fecha_vencimiento_desde,
      "fecha_vencimiento_desde"
    );

  const fechaVencimientoHasta =
    normalizeDate(
      query.fecha_vencimiento_hasta,
      "fecha_vencimiento_hasta"
    );

  const ultimoMovimientoDesde =
    normalizeDate(
      query.ultimo_movimiento_desde,
      "ultimo_movimiento_desde"
    );

  const ultimoMovimientoHasta =
    normalizeDate(
      query.ultimo_movimiento_hasta,
      "ultimo_movimiento_hasta"
    );

  validateDateRange(
    fechaVencimientoDesde,
    fechaVencimientoHasta,
    "fecha_vencimiento_desde",
    "fecha_vencimiento_hasta"
  );

  validateDateRange(
    ultimoMovimientoDesde,
    ultimoMovimientoHasta,
    "ultimo_movimiento_desde",
    "ultimo_movimiento_hasta"
  );

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

  const fechaVencimientoWhere =
    buildDateCondition({
      desde:
        fechaVencimientoDesde,
      hasta:
        fechaVencimientoHasta,
    });

  if (fechaVencimientoWhere) {
    where.fecha_vencimiento =
      fechaVencimientoWhere;
  }

  const ultimoMovimientoWhere =
    buildDateCondition({
      desde:
        ultimoMovimientoDesde,
      hasta:
        ultimoMovimientoHasta,
      includeTime:
        true,
    });

  if (ultimoMovimientoWhere) {
    where.ultimo_movimiento =
      ultimoMovimientoWhere;
  }

  const searchWhere =
    buildSearchWhere(
      query.search
    );

  if (searchWhere) {
    where[Op.and] = [
      searchWhere,
    ];
  }

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
      query.sortOrder ||
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

const getVersionCounts = async (
  registroIds
) => {
  if (
    !Array.isArray(registroIds) ||
    registroIds.length === 0
  ) {
    return new Map();
  }

  const rows =
    await MotorConceptoRegistroVersion.findAll({
      attributes: [
        "registro_id",
        [
          fn(
            "COUNT",
            col("id")
          ),
          "total",
        ],
      ],

      where: {
        registro_id: {
          [Op.in]:
            registroIds,
        },
      },

      group: [
        "registro_id",
      ],

      raw:
        true,
    });

  return new Map(
    rows.map(
      (row) => [
        Number(
          row.registro_id
        ),
        Number(
          row.total || 0
        ),
      ]
    )
  );
};

const getFileCounts = async (
  registroIds
) => {
  if (
    !Array.isArray(registroIds) ||
    registroIds.length === 0
  ) {
    return new Map();
  }

  const rows =
    await MotorConceptoRegistroArchivo.findAll({
      attributes: [
        [
          col(
            "version.registro_id"
          ),
          "registro_id",
        ],
        [
          fn(
            "COUNT",
            col(
              "MotorConceptoRegistroArchivo.id"
            )
          ),
          "total",
        ],
      ],

      include: [
        {
          model:
            MotorConceptoRegistroVersion,
          as:
            "version",
          attributes:
            [],
          required:
            true,
          where: {
            registro_id: {
              [Op.in]:
                registroIds,
            },
          },
        },
      ],

      group: [
        col(
          "version.registro_id"
        ),
      ],

      raw:
        true,
    });

  return new Map(
    rows.map(
      (row) => [
        Number(
          row.registro_id
        ),
        Number(
          row.total || 0
        ),
      ]
    )
  );
};

const calculateRemainingDays = (
  fechaVencimiento
) => {
  if (!fechaVencimiento) {
    return null;
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const expirationDate =
    new Date(
      `${fechaVencimiento}T00:00:00`
    );

  expirationDate.setHours(
    0,
    0,
    0,
    0
  );

  return Math.floor(
    (
      expirationDate.getTime() -
      today.getTime()
    ) /
    86400000
  );
};

const mapReporteItem = (
  registro,
  versionCounts,
  fileCounts
) => {
  const plain =
    registro.get({
      plain:
        true,
    });

  const diasRestantes =
    calculateRemainingDays(
      plain.fecha_vencimiento
    );

  const diasAlerta =
    plain.concepto
      ?.dias_alerta_vencimiento;

  const porVencer =
    diasRestantes !== null &&
    diasAlerta !== null &&
    diasRestantes >= 0 &&
    diasRestantes <= diasAlerta;

  let estadoVisual =
    plain.estado;

  if (
    plain.estado === "VIGENTE" &&
    porVencer
  ) {
    estadoVisual =
      "POR_VENCER";
  }

  return {
    id:
      plain.id,

    estado_visual:
      estadoVisual,

    concepto_id:
      plain.concepto_id,

    concepto:
      plain.concepto,

    entidad_tipo_id:
      plain.entidad_tipo_id,

    entidad_tipo:
      plain.entidadTipo,

    entidad_id:
      plain.entidad_id,

    estado:
      plain.estado,

    version_actual_id:
      plain.version_actual_id,

    version_actual:
      plain.versionActual,

    fecha_vencimiento:
      plain.fecha_vencimiento,

    dias_restantes:
      diasRestantes,

    por_vencer:
      porVencer,

    ultimo_movimiento:
      plain.ultimo_movimiento,

    observaciones:
      plain.observaciones,

    sucursal_id:
      plain.sucursal_id,

    activo:
      plain.activo,

    creado_por:
      plain.creado_por,

    modificado_por:
      plain.modificado_por,

    created_at:
      plain.created_at,

    updated_at:
      plain.updated_at,

    total_versiones:
      versionCounts.get(
        plain.id
      ) || 0,

    total_archivos:
      fileCounts.get(
        plain.id
      ) || 0,
  };
};

const getRegistros = async (
  user,
  query = {}
) => {
  assertUser(user);

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

      distinct:
        true,

      subQuery:
        false,

      order,

      limit,

      offset,
    });

  const registroIds =
    result.rows.map(
      (registro) =>
        registro.id
    );

  const [
    versionCounts,
    fileCounts,
  ] =
    await Promise.all([
      getVersionCounts(
        registroIds
      ),
      getFileCounts(
        registroIds
      ),
    ]);

  const items =
    result.rows.map(
      (registro) =>
        mapReporteItem(
          registro,
          versionCounts,
          fileCounts
        )
    );

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
    items,

    pagination: {
      page,

      limit,

      total,

      totalPages,

      hasPreviousPage:
        page > 1,

      hasNextPage:
        page < totalPages,
    },

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

      activo:
        parseBoolean(
          query.activo,
          true
        ),

      fecha_vencimiento_desde:
        query.fecha_vencimiento_desde ||
        null,

      fecha_vencimiento_hasta:
        query.fecha_vencimiento_hasta ||
        null,

      ultimo_movimiento_desde:
        query.ultimo_movimiento_desde ||
        null,

      ultimo_movimiento_hasta:
        query.ultimo_movimiento_hasta ||
        null,

      sort:
        normalizeSortField(
          query.sort ||
          query.sortBy
        ),

      order:
        normalizeOrder(
          query.order ||
          query.sortOrder ||
          query.sortDirection
        ),
    },
  };
};

export default {
  getRegistros,
};