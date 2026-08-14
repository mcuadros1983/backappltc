import { Op } from "sequelize";
import { sequelize } from "../../config/database.js";
import {
  MotorConcepto,
  MotorConceptoEntidadTipo,
  MotorConceptoEntidad,
  MotorConceptoCampo,
  MotorConceptoLista,
  MotorConceptoListaItem,
  MotorConceptoArchivoTipo,
  MotorConceptoRegla,
  MotorConceptoRegistro,

} from "../../models/motorconceptos/index.js";

// import {
//   MotorConceptoRegistro,
// } from "../../models/motorconceptos/index.js";

const MODOS_CAPTURA = ["SOLO_DATOS", "SOLO_ARCHIVOS", "DATOS_Y_ARCHIVOS"];
const TIPOS_CAMPO = [
  "TEXT", "TEXTAREA", "INTEGER", "DECIMAL", "BOOLEAN", "DATE", "DATETIME",
  "TIME", "EMAIL", "PHONE", "URL", "COLOR", "PASSWORD", "JSON", "LISTA",
  "RELACION", "IMAGEN", "FIRMA", "COORDENADAS",
];
const TIPOS_REGLA = ["VISIBLE_CUANDO", "OBLIGATORIO_CUANDO", "SOLO_LECTURA_CUANDO"];
const OPERADORES = [
  "IGUAL", "DISTINTO", "MAYOR", "MAYOR_IGUAL", "MENOR", "MENOR_IGUAL",
  "CONTIENE", "NO_CONTIENE", "EN", "NO_EN", "VACIO", "NO_VACIO",
];

const error = (message, status = 400) => Object.assign(new Error(message), { status });
const assertUser = (user) => {
  if (!user?.id) throw error("Usuario autenticado requerido", 401);
};
const code = (value) => String(value || "")
  .trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
const bool = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if ([true, 1, "1", "true"].includes(value)) return true;
  if ([false, 0, "0", "false"].includes(value)) return false;
  return fallback;
};
const int = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const detailIncludes = [
  {
    model: MotorConceptoEntidad,
    as: "entidades",
    include: [{ model: MotorConceptoEntidadTipo, as: "entidadTipo" }],
  },
  {
    model: MotorConceptoCampo,
    as: "campos",
    separate: true,
    order: [["orden", "ASC"], ["id", "ASC"]],
    include: [{
      model: MotorConceptoLista,
      as: "lista",
      include: [{
        model: MotorConceptoListaItem,
        as: "items",
        separate: true,
        order: [["orden", "ASC"], ["id", "ASC"]],
      }],
    }],
  },
  {
    model: MotorConceptoArchivoTipo,
    as: "archivosTipos",
    separate: true,
    order: [["orden", "ASC"], ["id", "ASC"]],
  },
  {
    model: MotorConceptoRegla,
    as: "reglas",
    separate: true,
    order: [["prioridad", "ASC"], ["id", "ASC"]],
  },
];

const getConcept = async (id, options = {}) => {
  const row = await MotorConcepto.findByPk(id, options);
  if (!row) throw error("Concepto no encontrado", 404);
  return row;
};

const getField = async (conceptoId, fieldId, options = {}) => {
  const row = await MotorConceptoCampo.findOne({
    where: { id: fieldId, concepto_id: conceptoId },
    ...options,
  });
  if (!row) throw error("Campo no encontrado", 404);
  return row;
};

const validateConcept = (payload, update = false) => {
  if ((!update || payload.codigo !== undefined) && !code(payload.codigo)) {
    throw error("El código es obligatorio");
  }
  if ((!update || payload.nombre !== undefined) && !String(payload.nombre || "").trim()) {
    throw error("El nombre es obligatorio");
  }
  if (payload.modo_captura !== undefined && !MODOS_CAPTURA.includes(payload.modo_captura)) {
    throw error("Modo de captura inválido");
  }
};

const validateField = (payload, update = false) => {
  if ((!update || payload.codigo !== undefined) && !code(payload.codigo)) {
    throw error("El código del campo es obligatorio");
  }
  if ((!update || payload.etiqueta !== undefined) && !String(payload.etiqueta || "").trim()) {
    throw error("La etiqueta del campo es obligatoria");
  }
  if ((!update || payload.tipo !== undefined) && !TIPOS_CAMPO.includes(payload.tipo)) {
    throw error("Tipo de campo inválido");
  }
};

const motorConceptoService = {
  async seedEntidadTipos() {
    // async seedEntidadTipos(user) {
    // assertUser(user);

    console.log("creando entidades.....")
    const catalogo = [
      { codigo: "EMPLEADO", nombre: "Empleado" },
      { codigo: "SUCURSAL", nombre: "Sucursal" },
      { codigo: "EMPRESA", nombre: "Empresa" },
    ];

    return sequelize.transaction(async (transaction) => {
      const result = [];
      for (const item of catalogo) {
        const [row] = await MotorConceptoEntidadTipo.findOrCreate({
          where: { codigo: item.codigo },
          defaults: { ...item, activo: true },
          transaction,
        });
        if (row.nombre !== item.nombre || !row.activo) {
          await row.update({ nombre: item.nombre, activo: true }, { transaction });
        }
        result.push(row);
      }
      return result;
    });
  },

  async getEntidadTipos(user) {
    assertUser(user);
    return MotorConceptoEntidadTipo.findAll({
      where: { activo: true },
      order: [["nombre", "ASC"]],
    });
  },

  async getAll(user, query = {}) {
    assertUser(user);
    const page = int(query.page, 1);
    const limit = Math.min(int(query.limit, 20), 100);
    const where = {};

    if (query.search) {
      const term = String(query.search).trim();
      where[Op.or] = [
        { codigo: { [Op.iLike]: `%${term}%` } },
        { nombre: { [Op.iLike]: `%${term}%` } },
        { descripcion: { [Op.iLike]: `%${term}%` } },
      ];
    }
    if (query.activo !== undefined && query.activo !== "") where.activo = bool(query.activo);
    if (query.modo_captura) where.modo_captura = query.modo_captura;

    const include = [{
      model: MotorConceptoEntidad,
      as: "entidades",
      required: Boolean(query.entidad_tipo_id),
      where: query.entidad_tipo_id ? { entidad_tipo_id: query.entidad_tipo_id, activo: true } : undefined,
      include: [{ model: MotorConceptoEntidadTipo, as: "entidadTipo" }],
    }];

    const sortFields = ["id", "codigo", "nombre", "modo_captura", "activo", "created_at", "updated_at"];
    const sortBy = sortFields.includes(query.sortBy) ? query.sortBy : "nombre";
    const sortOrder = String(query.sortOrder).toUpperCase() === "DESC" ? "DESC" : "ASC";

    const result = await MotorConcepto.findAndCountAll({
      where,
      include,
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
    return getConcept(id, { include: detailIncludes });
  },

  async create(user, payload) {
    assertUser(user);
    validateConcept(payload);

    return sequelize.transaction(async (transaction) => {
      const codigo = code(payload.codigo);
      const duplicate = await MotorConcepto.findOne({
        where: { codigo },
        paranoid: false,
        transaction,
      });
      if (duplicate) throw error("Ya existe un concepto con ese código");

      const concepto = await MotorConcepto.create({
        codigo,
        nombre: String(payload.nombre).trim(),
        descripcion: payload.descripcion || null,
        modo_captura: payload.modo_captura || "DATOS_Y_ARCHIVOS",
        permite_multiples: bool(payload.permite_multiples),
        usa_versiones: bool(payload.usa_versiones, true),
        usa_vencimiento: bool(payload.usa_vencimiento),
        dias_alerta_vencimiento: payload.dias_alerta_vencimiento ?? null,
        activo: payload.activo === undefined ? true : bool(payload.activo),
        creado_por: user.id,
        modificado_por: user.id,
      }, { transaction });

      if (Array.isArray(payload.entidad_tipo_ids)) {
        const ids = [...new Set(payload.entidad_tipo_ids.map(Number))];

        if (
          ids.length > 1
        ) {
          throw error(
            "Un concepto solo puede estar asociado a un tipo de entidad"
          );
        }


        const count = ids.length ? await MotorConceptoEntidadTipo.count({
          where: { id: ids, activo: true },
          transaction,
        }) : 0;
        if (count !== ids.length) throw error("Uno o más tipos de entidad son inválidos");

        if (ids.length) {
          await MotorConceptoEntidad.bulkCreate(ids.map((entidad_tipo_id) => ({
            concepto_id: concepto.id,
            entidad_tipo_id,
            obligatorio:
              bool(payload.obligatorio),
            activo: true,
          })), { transaction });
        }
      }

      return getConcept(concepto.id, { include: detailIncludes, transaction });
    });
  },



  async update(user, id, payload) {
    assertUser(user);
    validateConcept(payload, true);

    return sequelize.transaction(async (transaction) => {
      const concepto = await getConcept(id, { transaction, lock: transaction.LOCK.UPDATE });
      const changes = { modificado_por: user.id };

      if (payload.codigo !== undefined) {
        const codigo = code(payload.codigo);
        const duplicate = await MotorConcepto.findOne({
          where: { codigo, id: { [Op.ne]: concepto.id } },
          paranoid: false,
          transaction,
        });
        if (duplicate) throw error("Ya existe un concepto con ese código");
        changes.codigo = codigo;
      }

      ["nombre", "descripcion", "modo_captura", "dias_alerta_vencimiento"].forEach((field) => {
        if (payload[field] !== undefined) changes[field] = payload[field];
      });
      ["permite_multiples", "usa_versiones", "usa_vencimiento", "activo"].forEach((field) => {
        if (payload[field] !== undefined) changes[field] = bool(payload[field]);
      });

      await concepto.update(changes, { transaction });

      if (Array.isArray(payload.entidad_tipo_ids)) {
        const ids = [...new Set(payload.entidad_tipo_ids.map(Number))];

        if (
          ids.length > 1
        ) {
          throw error(
            "Un concepto solo puede estar asociado a un tipo de entidad"
          );
        }

        const count = ids.length ? await MotorConceptoEntidadTipo.count({
          where: { id: ids, activo: true },
          transaction,
        }) : 0;
        if (count !== ids.length) throw error("Uno o más tipos de entidad son inválidos");

        await MotorConceptoEntidad.destroy({
          where: { concepto_id: concepto.id },
          force: true,
          transaction,
        });

        if (ids.length) {
          await MotorConceptoEntidad.bulkCreate(ids.map((entidad_tipo_id) => ({
            concepto_id: concepto.id,
            entidad_tipo_id,
            obligatorio:
              payload.obligatorio !== undefined
                ? bool(
                  payload.obligatorio
                )
                : false,
            activo: true,
          })), { transaction });
        }
      }

      return getConcept(concepto.id, { include: detailIncludes, transaction });
    });
  },



  async remove(user, id) {
    assertUser(user);
    return sequelize.transaction(async (transaction) => {
      const concepto = await getConcept(id, { transaction, lock: transaction.LOCK.UPDATE });
      await concepto.update({ activo: false, modificado_por: user.id }, { transaction });
      await concepto.destroy({ transaction });
      return true;
    });
  },

  async createField(user, conceptoId, payload) {
    assertUser(user);
    validateField(payload);

    return sequelize.transaction(async (transaction) => {
      await getConcept(conceptoId, { transaction });
      const codigo = code(payload.codigo);
      const duplicate = await MotorConceptoCampo.findOne({
        where: { concepto_id: conceptoId, codigo },
        paranoid: false,
        transaction,
      });
      if (duplicate) throw error("Ya existe un campo con ese código");

      const campo = await MotorConceptoCampo.create({
        concepto_id: conceptoId,
        codigo,
        etiqueta: String(payload.etiqueta).trim(),
        tipo: payload.tipo,
        obligatorio: bool(payload.obligatorio),
        orden: Number(payload.orden || 0),
        ancho: Number(payload.ancho || 12),
        placeholder: payload.placeholder || null,
        ayuda: payload.ayuda || null,
        solo_lectura: bool(payload.solo_lectura),
        visible: payload.visible === undefined ? true : bool(payload.visible),
        valor_defecto: payload.valor_defecto ?? null,
        configuracion: payload.configuracion || {},
        activo: payload.activo === undefined ? true : bool(payload.activo),
        creado_por: user.id,
        modificado_por: user.id,
      }, { transaction });

      if (payload.tipo === "LISTA") {
        const lista = await MotorConceptoLista.create({
          campo_id: campo.id,
          permite_multiple: bool(payload.permite_multiple),
        }, { transaction });

        if (Array.isArray(payload.items) && payload.items.length) {
          await MotorConceptoListaItem.bulkCreate(payload.items.map((item, index) => ({
            lista_id: lista.id,
            valor: code(item.valor || item.etiqueta),
            etiqueta: String(item.etiqueta || item.valor || "").trim(),
            color: item.color || null,
            orden: Number(item.orden ?? index),
            activo: item.activo === undefined ? true : bool(item.activo),
          })), { transaction });
        }
      }

      return getField(conceptoId, campo.id, {
        include: [{
          model: MotorConceptoLista,
          as: "lista",
          include: [{ model: MotorConceptoListaItem, as: "items" }],
        }],
        transaction,
      });
    });
  },

  async updateField(user, conceptoId, fieldId, payload) {
    assertUser(user);
    validateField(payload, true);

    return sequelize.transaction(async (transaction) => {
      const campo = await getField(conceptoId, fieldId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const changes = { modificado_por: user.id };

      if (payload.codigo !== undefined) changes.codigo = code(payload.codigo);
      ["etiqueta", "tipo", "orden", "ancho", "placeholder", "ayuda", "valor_defecto", "configuracion"]
        .forEach((field) => {
          if (payload[field] !== undefined) changes[field] = payload[field];
        });
      ["obligatorio", "solo_lectura", "visible", "activo"].forEach((field) => {
        if (payload[field] !== undefined) changes[field] = bool(payload[field]);
      });

      await campo.update(changes, { transaction });

      if ((payload.tipo || campo.tipo) === "LISTA") {
        const [lista] = await MotorConceptoLista.findOrCreate({
          where: { campo_id: campo.id },
          defaults: { permite_multiple: bool(payload.permite_multiple) },
          transaction,
        });

        if (payload.permite_multiple !== undefined) {
          await lista.update({ permite_multiple: bool(payload.permite_multiple) }, { transaction });
        }

        if (Array.isArray(payload.items)) {
          await MotorConceptoListaItem.destroy({
            where: { lista_id: lista.id },
            force: true,
            transaction,
          });
          if (payload.items.length) {
            await MotorConceptoListaItem.bulkCreate(payload.items.map((item, index) => ({
              lista_id: lista.id,
              valor: code(item.valor || item.etiqueta),
              etiqueta: String(item.etiqueta || item.valor || "").trim(),
              color: item.color || null,
              orden: Number(item.orden ?? index),
              activo: item.activo === undefined ? true : bool(item.activo),
            })), { transaction });
          }
        }
      }

      return getField(conceptoId, fieldId, {
        include: [{
          model: MotorConceptoLista,
          as: "lista",
          include: [{ model: MotorConceptoListaItem, as: "items" }],
        }],
        transaction,
      });
    });
  },

  async removeField(user, conceptoId, fieldId) {
    assertUser(user);
    return sequelize.transaction(async (transaction) => {
      const campo = await getField(conceptoId, fieldId, { transaction });
      await campo.update({ activo: false, modificado_por: user.id }, { transaction });
      await campo.destroy({ transaction });
      return true;
    });
  },

  async createFileType(user, conceptoId, payload) {
    assertUser(user);
    if (!code(payload.codigo)) throw error("El código es obligatorio");
    if (!String(payload.nombre || "").trim()) throw error("El nombre es obligatorio");

    return sequelize.transaction(async (transaction) => {
      await getConcept(conceptoId, { transaction });
      return MotorConceptoArchivoTipo.create({
        concepto_id: conceptoId,
        codigo: code(payload.codigo),
        nombre: String(payload.nombre).trim(),
        descripcion: payload.descripcion || null,
        obligatorio: bool(payload.obligatorio),
        permite_multiples: bool(payload.permite_multiples),
        extensiones_permitidas: Array.isArray(payload.extensiones_permitidas) ? payload.extensiones_permitidas : [],
        mime_types_permitidos: Array.isArray(payload.mime_types_permitidos) ? payload.mime_types_permitidos : [],
        tamanio_maximo_mb: payload.tamanio_maximo_mb ?? null,
        orden: Number(payload.orden || 0),
        activo: payload.activo === undefined ? true : bool(payload.activo),
        creado_por: user.id,
        modificado_por: user.id,
      }, { transaction });
    });
  },

  async updateFileType(user, conceptoId, fileTypeId, payload) {
    assertUser(user);
    const row = await MotorConceptoArchivoTipo.findOne({
      where: { id: fileTypeId, concepto_id: conceptoId },
    });
    if (!row) throw error("Tipo de archivo no encontrado", 404);

    const changes = { modificado_por: user.id };
    ["codigo", "nombre", "descripcion", "extensiones_permitidas", "mime_types_permitidos",
      "tamanio_maximo_mb", "orden"].forEach((field) => {
        if (payload[field] !== undefined) changes[field] = field === "codigo" ? code(payload[field]) : payload[field];
      });
    ["obligatorio", "permite_multiples", "activo"].forEach((field) => {
      if (payload[field] !== undefined) changes[field] = bool(payload[field]);
    });
    await row.update(changes);
    return row;
  },

  async removeFileType(user, conceptoId, fileTypeId) {
    assertUser(user);
    const row = await MotorConceptoArchivoTipo.findOne({
      where: { id: fileTypeId, concepto_id: conceptoId },
    });
    if (!row) throw error("Tipo de archivo no encontrado", 404);
    await row.update({ activo: false, modificado_por: user.id });
    await row.destroy();
    return true;
  },

  async createRule(user, conceptoId, payload) {
    assertUser(user);
    if (!TIPOS_REGLA.includes(payload.tipo_regla)) throw error("Tipo de regla inválido");
    if (!OPERADORES.includes(payload.operador)) throw error("Operador inválido");
    if (Number(payload.campo_destino_id) === Number(payload.campo_origen_id)) {
      throw error("Origen y destino no pueden ser el mismo campo");
    }

    const fields = await MotorConceptoCampo.count({
      where: {
        concepto_id: conceptoId,
        id: [payload.campo_destino_id, payload.campo_origen_id],
      },
    });
    if (fields !== 2) throw error("Los campos no pertenecen al concepto");

    return MotorConceptoRegla.create({
      concepto_id: conceptoId,
      campo_destino_id: payload.campo_destino_id,
      campo_origen_id: payload.campo_origen_id,
      tipo_regla: payload.tipo_regla,
      operador: payload.operador,
      valor_comparacion: payload.valor_comparacion ?? null,
      prioridad: Number(payload.prioridad || 0),
      activo: payload.activo === undefined ? true : bool(payload.activo),
      creado_por: user.id,
      modificado_por: user.id,
    });
  },

  async updateRule(user, conceptoId, ruleId, payload) {
    assertUser(user);
    const row = await MotorConceptoRegla.findOne({
      where: { id: ruleId, concepto_id: conceptoId },
    });
    if (!row) throw error("Regla no encontrada", 404);

    const changes = { modificado_por: user.id };
    ["campo_destino_id", "campo_origen_id", "tipo_regla", "operador",
      "valor_comparacion", "prioridad"].forEach((field) => {
        if (payload[field] !== undefined) changes[field] = payload[field];
      });
    if (payload.activo !== undefined) changes.activo = bool(payload.activo);
    await row.update(changes);
    return row;
  },

  async removeRule(user, conceptoId, ruleId) {
    assertUser(user);
    const row = await MotorConceptoRegla.findOne({
      where: { id: ruleId, concepto_id: conceptoId },
    });
    if (!row) throw error("Regla no encontrada", 404);
    await row.update({ activo: false, modificado_por: user.id });
    await row.destroy();
    return true;
  },

  async getCumplimiento(user, query) {

    assertUser(user);

    const entidad_tipo_id = Number(query.entidad_tipo_id);
    const entidad_id = Number(query.entidad_id);

    const estadoFiltro = query.estado?.trim();
    const search = query.search?.trim().toLowerCase();

    if (!entidad_tipo_id)
      throw error("Debe indicar entidad_tipo_id");

    if (!entidad_id)
      throw error("Debe indicar entidad_id");

    const conceptos = await MotorConcepto.findAll({

      where: {
        activo: true,
      },

      include: [{
        model: MotorConceptoEntidad,
        as: "entidades",
        required: true,
        where: {
          entidad_tipo_id,
          activo: true,
        },
      }],

      order: [
        ["nombre", "ASC"],
      ],

    });

    const registros = await MotorConceptoRegistro.findAll({

      where: {

        entidad_tipo_id,
        entidad_id,
        activo: true,

        estado: {
          [Op.ne]: "ANULADO",
        },

      },

      order: [
        ["ultimo_movimiento", "DESC"],
      ],

    });
    const mapaRegistros = new Map();

    for (const registro of registros) {

      mapaRegistros.set(
        registro.concepto_id,
        registro
      );

    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const resumen = {

      total: 0,
      cumplidos: 0,
      faltantes: 0,
      vencidos: 0,
      proximos: 0,
      porcentaje: 0,

    };

    const documentos = [];

    for (const concepto of conceptos) {

      const registro = mapaRegistros.get(concepto.id);

      let estado = "FALTANTE";
      let dias_restantes = null;

      if (registro) {

        estado = "CUMPLIDO";

        if (
          concepto.usa_vencimiento &&
          registro.fecha_vencimiento
        ) {

          const fecha = new Date(registro.fecha_vencimiento);

          fecha.setHours(0, 0, 0, 0);

          dias_restantes = Math.floor(
            (fecha - hoy) / 86400000
          );

          if (dias_restantes < 0) {

            estado = "VENCIDO";

          } else if (
            dias_restantes <=
            (concepto.dias_alerta_vencimiento || 0)
          ) {

            estado = "PROXIMO_A_VENCER";

          }

        }

      }

      const documento = {

        concepto_id: concepto.id,

        codigo: concepto.codigo,

        nombre: concepto.nombre,

        usa_vencimiento:
          concepto.usa_vencimiento,

        dias_alerta_vencimiento:
          concepto.dias_alerta_vencimiento,

        estado,

        registro_id:
          registro?.id ?? null,

        fecha_vencimiento:
          registro?.fecha_vencimiento ?? null,

        dias_restantes,

        ultimo_movimiento:
          registro?.ultimo_movimiento ?? null,

      };

      if (
        search &&
        !documento.codigo?.toLowerCase().includes(search) &&
        !documento.nombre?.toLowerCase().includes(search)
      ) {
        continue;
      }

      if (
        estadoFiltro &&
        documento.estado !== estadoFiltro
      ) {
        continue;
      }

      documentos.push(documento);

    }

    resumen.total = documentos.length;

    resumen.cumplidos = documentos.filter(
      d =>
        d.estado === "CUMPLIDO" ||
        d.estado === "PROXIMO_A_VENCER"
    ).length;

    resumen.faltantes = documentos.filter(
      d => d.estado === "FALTANTE"
    ).length;

    resumen.vencidos = documentos.filter(
      d => d.estado === "VENCIDO"
    ).length;

    resumen.proximos = documentos.filter(
      d => d.estado === "PROXIMO_A_VENCER"
    ).length;

    resumen.porcentaje =
      resumen.total === 0
        ? 100
        : Math.round(
          (resumen.cumplidos * 100) /
          resumen.total
        );

    return {

      resumen,

      documentos,

    };

  },

  async getVencimientos(user, query = {}) {

    const {

      empresa_id,
      sucursal_id,
      entidad_tipo_id,
      entidad_id,
      concepto_id,

      estado,

      dias,

      desde,
      hasta,

      search,

      page = 1,
      limit = 20,

      sortBy = "dias_restantes",
      sortOrder = "ASC",

    } = query;

    const cumplimiento =
      await this.getCumplimiento(user, query);

    let documentos =
      [...cumplimiento.documentos];

    /*
    |--------------------------------------------------------------------------
    | Estado
    |--------------------------------------------------------------------------
    */

    if (estado) {

      documentos =
        documentos.filter(doc => doc.estado === estado);

    }

    /*
    |--------------------------------------------------------------------------
    | Empresa
    |--------------------------------------------------------------------------
    */

    if (empresa_id) {

      documentos =
        documentos.filter(doc =>
          Number(doc.empresa_id) === Number(empresa_id)
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Sucursal
    |--------------------------------------------------------------------------
    */

    if (sucursal_id) {

      documentos =
        documentos.filter(doc =>
          Number(doc.sucursal_id) === Number(sucursal_id)
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Tipo Entidad
    |--------------------------------------------------------------------------
    */

    if (entidad_tipo_id) {

      documentos =
        documentos.filter(doc =>
          Number(doc.entidad_tipo_id) === Number(entidad_tipo_id)
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Entidad
    |--------------------------------------------------------------------------
    */

    if (entidad_id) {

      documentos =
        documentos.filter(doc =>
          Number(doc.entidad_id) === Number(entidad_id)
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Concepto
    |--------------------------------------------------------------------------
    */

    if (concepto_id) {

      documentos =
        documentos.filter(doc =>
          Number(doc.concepto_id) === Number(concepto_id)
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Rango de días
    |--------------------------------------------------------------------------
    */

    if (dias) {

      documentos =
        documentos.filter(doc =>
          doc.dias_restantes <= Number(dias)
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Fecha Desde
    |--------------------------------------------------------------------------
    */

    if (desde) {

      documentos =
        documentos.filter(doc =>
          doc.fecha_vencimiento >= desde
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Fecha Hasta
    |--------------------------------------------------------------------------
    */

    if (hasta) {

      documentos =
        documentos.filter(doc =>
          doc.fecha_vencimiento <= hasta
        );

    }

    /*
    |--------------------------------------------------------------------------
    | Búsqueda
    |--------------------------------------------------------------------------
    */

    if (search) {

      const texto = search.toLowerCase();

      documentos =
        documentos.filter(doc =>

          (doc.entidad || "")
            .toLowerCase()
            .includes(texto)

          ||

          (doc.concepto || "")
            .toLowerCase()
            .includes(texto)

          ||

          (doc.documento || "")
            .toLowerCase()
            .includes(texto)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | Ordenamiento
    |--------------------------------------------------------------------------
    */

    documentos.sort((a, b) => {

      const av = a[sortBy];
      const bv = b[sortBy];

      if (av === bv) return 0;

      if (sortOrder === "DESC") {

        return av > bv ? -1 : 1;

      }

      return av > bv ? 1 : -1;

    });

    /*
    |--------------------------------------------------------------------------
    | Resumen
    |--------------------------------------------------------------------------
    */

    const resumen = {

      total: documentos.length,

      vencidos:
        documentos.filter(d => d.estado === "VENCIDO").length,

      proximos30:
        documentos.filter(d =>
          d.dias_restantes >= 0 &&
          d.dias_restantes <= 30
        ).length,

      proximos60:
        documentos.filter(d =>
          d.dias_restantes > 30 &&
          d.dias_restantes <= 60
        ).length,

      proximos90:
        documentos.filter(d =>
          d.dias_restantes > 60 &&
          d.dias_restantes <= 90
        ).length,

    };

    /*
    |--------------------------------------------------------------------------
    | Paginación
    |--------------------------------------------------------------------------
    */

    const total = documentos.length;

    const offset =
      (Number(page) - 1) * Number(limit);

    documentos =
      documentos.slice(
        offset,
        offset + Number(limit)
      );

    return {

      documentos,

      resumen,

      pagination: {

        page: Number(page),

        limit: Number(limit),

        total,

        totalPages:
          Math.ceil(total / Number(limit)),

      },

    };

  }
};



export default motorConceptoService;
