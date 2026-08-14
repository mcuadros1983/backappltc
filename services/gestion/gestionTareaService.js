import { Op } from "sequelize";
import {
  sequelize,
  GestionTarea,
  GestionProyecto,
  GestionProyectoMiembro,
  GestionTareaParticipante,
  GestionTareaActividad,
  GestionTareaChecklist,
  Usuario,
  GestionTareaArchivo,
} from "../../models/index.js";
import { GESTION_ESTADOS_TAREA, GESTION_TRANSICIONES, GESTION_TIPOS_ACTIVIDAD } from "../../constants/gestion/gestionEstados.js";
import gestionActividadService from "./gestionActividadService.js";

const generarCodigo = (id) => `GES-T-${String(id).padStart(5, "0")}`;

const includeResumen = [
  {
    model: GestionProyecto,
    as: "proyecto",
    required: false,
    include: [
      {
        model: GestionProyectoMiembro,
        as: "miembros",
        required: false,
      },
    ],
  },
  { model: Usuario, as: "responsable", attributes: ["id", "usuario"], required: false },
  { model: Usuario, as: "supervisor", attributes: ["id", "usuario"], required: false },
];

const includeDetalle = [
  ...includeResumen,
  { model: GestionTareaParticipante, as: "participantes", required: false, include: [{ model: Usuario, as: "usuario", attributes: ["id", "usuario"], required: false }] },
  { model: GestionTareaChecklist, as: "checklist", required: false, include: [{ model: Usuario, as: "completadoPor", attributes: ["id", "usuario"], required: false }] },
  { model: GestionTareaActividad, as: "actividades", required: false, include: [{ model: Usuario, as: "usuario", attributes: ["id", "usuario"], required: false }] },
  {
    model: GestionTareaArchivo,
    as: "archivos",
    required: false,
    include: [
      {
        model: Usuario,
        as: "usuario",
        attributes: [
          "id",
          "usuario",
        ],
        required: false,
      },
    ],
  },
];

const buildWhere = (user, query = {}) => {
  const where = { activo: true };
  // if (user?.sucursal_id) where.sucursal_id = user.sucursal_id;
  if (query.estado) where.estado = query.estado;
  if (query.proyecto_id) where.proyecto_id = query.proyecto_id;
  if (query.responsable_id) where.responsable_id = query.responsable_id;
  if (query.search) {
    where[Op.or] = [
      { titulo: { [Op.iLike]: `%${query.search}%` } },
      { descripcion: { [Op.iLike]: `%${query.search}%` } },
      { codigo: { [Op.iLike]: `%${query.search}%` } },
    ];
  }
  return where;
};

const validarPermisoTarea = async (
  user,
  tarea
) => {
  if (
    Number(user.rol_id) === 1
  ) {
    return;
  }

  const esCreador =
    tarea.creado_por_id === user.id;

  const esResponsable =
    tarea.responsable_id === user.id;

  const esSupervisorPrincipal =
    tarea.supervisor_id === user.id;

  const supervisorParticipante =
    await GestionTareaParticipante.findOne({
      where: {
        tarea_id: tarea.id,
        usuario_id: user.id,
        rol: "SUPERVISOR",
        activo: true,
      },
    });

  if (
    !esCreador &&
    !esResponsable &&
    !esSupervisorPrincipal &&
    !supervisorParticipante
  ) {
    throw new Error(
      "No tiene permisos sobre esta tarea"
    );
  }

};

// const validarPermisoTarea = async (
//   user,
//   tarea
// ) => {

//   const esCreador =
//     tarea.creado_por_id === user.id;

//   const esResponsable =
//     tarea.responsable_id === user.id;

//   const esSupervisor =
//     tarea.supervisor_id === user.id;

//   const esAdmin =
//     user.permissions?.includes(
//       "gestion:admin"
//     );

//   const participanteSupervisor =
//     await GestionTareaParticipante.findOne({
//       where: {
//         tarea_id: tarea.id,
//         usuario_id: user.id,
//         rol: "SUPERVISOR",
//         activo: true,
//       },
//     });

//   const participaProyecto =
//     tarea.proyecto_id
//       ? await GestionProyectoMiembro.findOne({
//         where: {
//           proyecto_id: tarea.proyecto_id,
//           usuario_id: user.id,
//           activo: true,
//         },
//       })
//       : null;

//   if (
//     !esCreador &&
//     !esResponsable &&
//     !esSupervisor &&
//     !esAdmin &&
//     !participanteSupervisor &&
//     !participaProyecto
//   ) {
//     throw new Error(
//       "No tiene permisos sobre esta tarea"
//     );
//   }

// };

const getAll = async (
  user,
  query = {}
) => {

  const rows =
    await GestionTarea.findAll({
      where: buildWhere(
        user,
        query
      ),
      include: includeResumen,
      order: [
        ["fecha_vencimiento", "ASC"],
        ["id", "DESC"],
      ],
      limit: Number(
        query.limit || 200
      ),
    });

  if (
    Number(user.rol_id) === 1
  ) {
    return rows;
  }

  const tareasFiltradas = [];

  for (const tarea of rows) {

    const participaProyecto =
      tarea.proyecto?.miembros?.some(
        (m) =>
          m.usuario_id === user.id &&
          m.activo
      );

    const puedeVer =
      tarea.creado_por_id === user.id ||
      tarea.responsable_id === user.id ||
      tarea.supervisor_id === user.id ||
      participaProyecto;

    if (puedeVer) {
      tareasFiltradas.push(
        tarea
      );
    }

  }

  return tareasFiltradas;

};

const getById = async (user, id) => {
  // console.log("🟦 getById", id);

  const simple = await GestionTarea.findByPk(id);


  const tarea = await GestionTarea.findOne({
    where: {
      id,
      activo: true
    },
    include: includeDetalle,
    order: [
      [{ model: GestionTareaChecklist, as: "checklist" }, "orden", "ASC"],
      [{ model: GestionTareaChecklist, as: "checklist" }, "id", "ASC"],

      [{ model: GestionTareaActividad, as: "actividades" }, "created_at", "DESC"],
    ],
  });


  if (!tarea) {
    throw new Error("Tarea no encontrada");
  }

  if (
    Number(user.rol_id) === 1
  ) {
    return tarea;
  }

  const participaProyecto =
    tarea.proyecto?.miembros?.some(
      (m) =>
        m.usuario_id === user.id &&
        m.activo
    );

  const puedeVer =
    tarea.creado_por_id === user.id ||
    tarea.responsable_id === user.id ||
    tarea.supervisor_id === user.id ||
    participaProyecto;

  if (!puedeVer) {
    throw new Error(
      "No tiene acceso a esta tarea"
    );
  }

  // await validarPermisoTarea(
  //   user,
  //   tarea
  // );

  return tarea;
};

const create = async (user, body) => {

  try {
    if (!body) {
      console.error("🟥 body viene vacío");
      throw new Error("Body obligatorio");
    }

    if (!body.titulo) {
      console.error("🟥 Falta título");
      throw new Error("El título es obligatorio");
    }

    if (
      body.proyecto_id &&
      Number(user.rol_id) !== 1
    ) {

      const miembroProyecto =
        await GestionProyectoMiembro.findOne({
          where: {
            proyecto_id: body.proyecto_id,
            usuario_id: user.id,
            activo: true,
          },
        });

      if (!miembroProyecto) {
        throw new Error(
          "No participa del proyecto"
        );
      }

    }

    return await sequelize.transaction(async (transaction) => {

      if (
        body.proyecto_id &&
        body.responsable_id &&
        Number(user.rol_id) !== 1
      ) {

        const responsableProyecto =
          await GestionProyectoMiembro.findOne({
            where: {
              proyecto_id: body.proyecto_id,
              usuario_id: body.responsable_id,
              activo: true,
            },
          });

        if (!responsableProyecto) {
          throw new Error(
            "El responsable no participa del proyecto"
          );
        }

      }

      const payloadTarea = {
        sucursal_id: body.sucursal_id || user?.sucursal_id || null,
        titulo: body.titulo,
        descripcion: body.descripcion || null,
        prioridad: body.prioridad || "NORMAL",
        proyecto_id: body.proyecto_id || null,
        responsable_id: body.responsable_id || user?.id,
        supervisor_id: body.supervisor_id || null,
        creado_por_id:
          user.id,
        fecha_vencimiento: body.fecha_vencimiento || null,
      };



      const tarea = await GestionTarea.create(payloadTarea, { transaction });


      const codigo = body.codigo || generarCodigo(tarea.id);


      await tarea.update(
        { codigo },
        { transaction }
      );


      const participante = await GestionTareaParticipante.findOrCreate({
        where: {
          tarea_id: tarea.id,
          usuario_id: tarea.responsable_id,
        },
        defaults: {
          tarea_id: tarea.id,
          usuario_id: tarea.responsable_id,
          rol: "PARTICIPANTE",
          activo: true,
        },
        transaction,
      });

      const actividad = await gestionActividadService.crear({
        tarea_id: tarea.id,
        usuario_id: user?.id,
        tipo: GESTION_TIPOS_ACTIVIDAD.SISTEMA,
        comentario: "Tarea creada",
        transaction,
      });


      return {
        id: tarea.id,
        codigo,
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        estado: tarea.estado,
        prioridad: tarea.prioridad,
        responsable_id: tarea.responsable_id,
        sucursal_id: tarea.sucursal_id,
        fecha_vencimiento: tarea.fecha_vencimiento,
      };
    });
  } catch (error) {
    console.error("🟥 [GestionTareaService.create] ERROR");
    console.error("🟥 message:", error.message);
    console.error("🟥 name:", error.name);
    console.error("🟥 stack:", error.stack);

    if (error.parent) {
      console.error("🟥 parent.message:", error.parent.message);
      console.error("🟥 parent.detail:", error.parent.detail);
      console.error("🟥 parent.constraint:", error.parent.constraint);
      console.error("🟥 parent.sql:", error.parent.sql);
    }

    if (error.errors) {
      console.error("🟥 validation errors:", error.errors);
    }

    throw error;
  }
};


const update = async (user, id, body) => {
  const tarea = await GestionTarea.findOne({ where: { id, activo: true } });
  if (!tarea) throw new Error("Tarea no encontrada");
  await validarPermisoTarea(
    user,
    tarea
  );

  const allowed = ["titulo", "descripcion", "prioridad", "proyecto_id", "responsable_id", "supervisor_id", "fecha_vencimiento", "porcentaje_avance"];
  const payload = {};
  allowed.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) payload[field] = body[field];
  });

  await tarea.update(payload);
  await gestionActividadService.crear({
    tarea_id: id,
    usuario_id: user.id,
    tipo: GESTION_TIPOS_ACTIVIDAD.SISTEMA,
    comentario: "Tarea actualizada",
  });

  // return getById(user, id);
  return tarea
};

const changeStatus = async (user, id, estado, comentario = null) => {
  const tarea = await GestionTarea.findOne({ where: { id, activo: true } });
  if (!tarea) throw new Error("Tarea no encontrada");
  await validarPermisoTarea(
    user,
    tarea
  );

  if (!estado) throw new Error("Estado obligatorio");

  const permitidos = GESTION_TRANSICIONES[tarea.estado] || [];
  if (!permitidos.includes(estado)) {
    throw new Error(`Transición inválida: ${tarea.estado} → ${estado}`);
  }

  const anterior = tarea.estado;
  const updateData = { estado };

  if (estado === GESTION_ESTADOS_TAREA.EN_CURSO && !tarea.fecha_inicio) updateData.fecha_inicio = new Date();
  if (estado === GESTION_ESTADOS_TAREA.FINALIZADA) {
    updateData.fecha_cierre = new Date();
    updateData.porcentaje_avance = 100;
  }

  await tarea.update(updateData);
  await gestionActividadService.crear({
    tarea_id: id,
    usuario_id: user.id,
    tipo: GESTION_TIPOS_ACTIVIDAD.CAMBIO_ESTADO,
    comentario: comentario || `Cambio de estado ${anterior} → ${estado}`,
    estado_anterior: anterior,
    estado_nuevo: estado,
  });

  return getById(user, id);
};

const addComment = async (
  user,
  id,
  comentario
) => {

  const tarea =
    await GestionTarea.findOne({
      where: {
        id,
        activo: true,
      },
    });

  if (!tarea) {
    throw new Error(
      "Tarea no encontrada"
    );
  }

  await validarPermisoTarea(
    user,
    tarea
  );

  if (!comentario) {
    throw new Error(
      "Comentario obligatorio"
    );
  }

  await gestionActividadService.crear({
    tarea_id: id,
    usuario_id: user.id,
    tipo:
      GESTION_TIPOS_ACTIVIDAD.COMENTARIO,
    comentario,
  });

  return getById(user, id);

};

const addChecklist = async (user, id, body) => {
  if (!body.descripcion) throw new Error("Descripción obligatoria");
  const tarea =
    await GestionTarea.findOne({
      where: {
        id,
        activo: true,
      },
    });

  if (!tarea) {
    throw new Error(
      "Tarea no encontrada"
    );
  }

  await validarPermisoTarea(
    user,
    tarea
  );

  const ultimoOrden =
    await GestionTareaChecklist.max(
      "orden",
      {
        where: {
          tarea_id: id,
        },
      }
    );

  const siguienteOrden =
    ultimoOrden === null
      ? 1
      : ultimoOrden + 1;

  await GestionTareaChecklist.create({
    tarea_id: id,
    descripcion: body.descripcion,
    orden:
      body.orden ??
      siguienteOrden,
  });

  await gestionActividadService.crear({
    tarea_id: id,
    usuario_id: user.id,
    tipo: GESTION_TIPOS_ACTIVIDAD.CHECKLIST,
    comentario: "Checklist agregado",
  });
  return getById(user, id);
};

const completeChecklist = async (user, checklistId, completado = true) => {
  const item = await GestionTareaChecklist.findByPk(checklistId);
  if (!item) throw new Error("Checklist no encontrado");

  const tarea =
    await GestionTarea.findByPk(
      item.tarea_id
    );

  await validarPermisoTarea(
    user,
    tarea
  );

  await item.update({
    completado: Boolean(completado),
    completado_por_id: completado ? user.id : null,
    fecha_completado: completado ? new Date() : null,
  });

  await gestionActividadService.crear({
    tarea_id: item.tarea_id,
    usuario_id: user.id,
    tipo: GESTION_TIPOS_ACTIVIDAD.CHECKLIST,
    comentario: completado ? "Checklist completado" : "Checklist reabierto",
  });

  return getById(user, item.tarea_id);
};

const getKanban = async (user, query = {}) => {
  const tareas = await getAll(user, query);
  const estados = ["PENDIENTE", "EN_CURSO", "EN_REVISION", "FINALIZADA"];
  return estados.reduce((acc, estado) => {
    acc[estado] = tareas.filter((t) => t.estado === estado);
    return acc;
  }, {});
};

const getDashboard = async (user) => {
  const where = buildWhere(user);
  const hoy = new Date();

  const [mis_tareas, vencidas, en_revision, finalizadas] = await Promise.all([
    GestionTarea.count({ where: { ...where, responsable_id: user.id, estado: { [Op.notIn]: ["FINALIZADA", "CANCELADA"] } } }),
    GestionTarea.count({ where: { ...where, fecha_vencimiento: { [Op.lt]: hoy }, estado: { [Op.notIn]: ["FINALIZADA", "CANCELADA"] } } }),
    GestionTarea.count({ where: { ...where, estado: "EN_REVISION" } }),
    GestionTarea.count({ where: { ...where, estado: "FINALIZADA" } }),
  ]);

  return { mis_tareas, vencidas, en_revision, finalizadas_mes: finalizadas };
};

const getCalendar = async (user, query = {}) => {
  const where = buildWhere(user, query);
  where.fecha_vencimiento = { [Op.ne]: null };
  const tareas = await GestionTarea.findAll({ where, include: includeResumen, order: [["fecha_vencimiento", "ASC"]] });

  return tareas.map((t) => ({
    id: t.id,
    tipo: "TAREA",
    titulo: t.titulo,
    fecha: t.fecha_vencimiento,
    estado: t.estado,
    prioridad: t.prioridad,
    responsable: t.responsable?.usuario || null,
    url: `/gestion/tareas/${t.id}`,
  }));
};

const remove = async (
  user,
  tarea_id
) => {

  const tarea =
    await GestionTarea.findByPk(
      tarea_id
    );

  if (!tarea) {
    throw new Error(
      "Tarea no encontrada"
    );
  }

  await validarPermisoTarea(
    user,
    tarea
  );

  await tarea.update({
    activo: false,
  });

  await gestionActividadService.crear({
    tarea_id,
    usuario_id: user.id,
    tipo: GESTION_TIPOS_ACTIVIDAD.SISTEMA,
    comentario: "Tarea eliminada",
  });

  return true;
};


const updateChecklist = async (
  user,
  checklistId,
  body
) => {

  if (!body.descripcion?.trim()) {
    throw new Error(
      "Descripción obligatoria"
    );
  }

  const item =
    await GestionTareaChecklist.findByPk(
      checklistId
    );

  if (!item) {
    throw new Error(
      "Checklist no encontrado"
    );
  }

  const tarea =
    await GestionTarea.findByPk(
      item.tarea_id
    );

  if (!tarea) {
    throw new Error(
      "Tarea no encontrada"
    );
  }

  await validarPermisoTarea(
    user,
    tarea
  );

  await item.update({
    descripcion:
      body.descripcion.trim(),
  });

  await gestionActividadService.crear({
    tarea_id: tarea.id,
    usuario_id: user.id,
    tipo: GESTION_TIPOS_ACTIVIDAD.CHECKLIST,
    comentario: "Checklist editado",
  });

  return getById(
    user,
    tarea.id
  );

};

const removeChecklist = async (
  user,
  checklistId
) => {

  const item =
    await GestionTareaChecklist.findByPk(
      checklistId
    );

  if (!item) {
    throw new Error(
      "Checklist no encontrado"
    );
  }

  const tarea =
    await GestionTarea.findByPk(
      item.tarea_id
    );

  if (!tarea) {
    throw new Error(
      "Tarea no encontrada"
    );
  }

  await validarPermisoTarea(
    user,
    tarea
  );

  await item.destroy();

  await gestionActividadService.crear({
    tarea_id: tarea.id,
    usuario_id: user.id,
    tipo: GESTION_TIPOS_ACTIVIDAD.CHECKLIST,
    comentario: "Checklist eliminado",
  });

  return getById(
    user,
    tarea.id
  );

};





export default {
  getDashboard,
  getCalendar,
  getKanban,
  getAll,
  getById,
  create,
  update,
  changeStatus,
  addComment,
  addChecklist,
  completeChecklist,
  remove,
  updateChecklist,
removeChecklist,
};
