import { GestionProyecto, GestionProyectoMiembro, GestionTarea, Usuario, GestionProyectoActividad } from "../../models/index.js";
import gestionProyectoActividadService from "./gestionProyectoActividadService.js";
import { Op } from "sequelize";
const generarCodigo = (id) => `GES-P-${String(id).padStart(5, "0")}`;

const includeResumen = [
  { model: Usuario, as: "responsable", attributes: ["id", "usuario"], required: false },
  { model: Usuario, as: "supervisor", attributes: ["id", "usuario"], required: false },
];

const includeDetalle = [
  ...includeResumen,

  {
    model: GestionProyectoMiembro,
    as: "miembros",
    required: false,

    where: {
      activo: true,
    },

    include: [
      {
        model: Usuario,
        as: "usuario",
        attributes: ["id", "usuario"],
        required: false,
      },
    ],
  },

  {
    model: GestionTarea,
    as: "tareas",
    required: false,
    include: [
      {
        model: Usuario,
        as: "responsable",
        attributes: ["id", "usuario"],
        required: false,
      },
    ],
  },

  {
    model: GestionProyectoActividad,
    as: "actividades",
    required: false,
    include: [
      {
        model: Usuario,
        as: "usuario",
        attributes: ["id", "usuario"],
        required: false,
      },
    ],
  },
];


const validarPermisoProyecto = async (
  user,
  proyecto
) => {

  if (user.rol_id === 1) {
    return;
  }

  const esCreador =
    proyecto.creado_por_id === user.id;

  const esResponsable =
    proyecto.responsable_id === user.id;

  const esSupervisorPrincipal =
    proyecto.supervisor_id === user.id;

  const supervisorMiembro =
    await GestionProyectoMiembro.findOne({
      where: {
        proyecto_id: proyecto.id,
        usuario_id: user.id,
        rol: "SUPERVISOR",
        activo: true,
      },
    });

  if (
    !esCreador &&
    !esResponsable &&
    !esSupervisorPrincipal &&
    !supervisorMiembro
  ) {
    throw new Error(
      "No tiene permisos sobre este proyecto"
    );
  }

};

const puedeVerProyecto = (
  user,
  proyecto
) => {

  return (
    proyecto.creado_por_id === user.id ||
    proyecto.responsable_id === user.id ||
    proyecto.supervisor_id === user.id ||
    proyecto.miembros?.some(
      (m) =>
        m.usuario_id === user.id &&
        m.activo
    )
  );

};

const getAll = async (user) => {
  const where = {
    activo: true,
  };

  // if (user?.sucursal_id) {
  //   where[Op.or] = [
  //     { sucursal_id: user.sucursal_id },
  //     { sucursal_id: null }
  //   ];
  // }
  

  if (
    Number(user.rol_id) === 1
  ) {
    return GestionProyecto.findAll({
      where,
      include: includeResumen,
      order: [["id", "DESC"]],
    });
  }


  return GestionProyecto.findAll({
    where,
    include: [
      ...includeResumen,
      {
        model: GestionProyectoMiembro,
        as: "miembros",
        required: false,
      },
    ],
    order: [["id", "DESC"]],
  }).then((proyectos) =>
    proyectos.filter(
      (p) =>
        puedeVerProyecto(
          user,
          p
        )
    )
  );
};

const getById = async (user, id) => {
  const proyecto = await GestionProyecto.findOne({ where: { id, activo: true }, include: includeDetalle });
  if (!proyecto) throw new Error("Proyecto no encontrado");

  if (
    Number(user.rol_id) === 1
  ) {
    return proyecto;
  }

  if (
    !puedeVerProyecto(
      user,
      proyecto
    )
  ) {
    throw new Error(
      "No tiene acceso a este proyecto"
    );
  }
  return proyecto;
};

const create = async (user, body) => {
  if (!body.nombre) throw new Error("El nombre es obligatorio");

  if (body.responsable_id) {

    const responsable =
      await Usuario.findByPk(
        body.responsable_id
      );

    if (!responsable) {
      throw new Error(
        "Responsable no encontrado"
      );
    }

  }
  const proyecto = await GestionProyecto.create({
    sucursal_id: body.sucursal_id || user.sucursal_id || null,
    creado_por_id: user.id,
    nombre: body.nombre,
    descripcion: body.descripcion || null,
    prioridad: body.prioridad || "NORMAL",
    responsable_id: body.responsable_id || user.id,
    supervisor_id: body.supervisor_id || null,
    fecha_inicio: body.fecha_inicio || null,
    fecha_fin: body.fecha_fin || null,
    color: body.color || null,
  });



  await proyecto.update({ codigo: body.codigo || generarCodigo(proyecto.id) });

  await GestionProyectoMiembro.findOrCreate({
    where: { proyecto_id: proyecto.id, usuario_id: proyecto.responsable_id },
    defaults: { proyecto_id: proyecto.id, usuario_id: proyecto.responsable_id, rol: "RESPONSABLE", activo: true },
  });

  await gestionProyectoActividadService.crear({
    proyecto_id: proyecto.id,
    usuario_id: user.id,
    tipo: "PROYECTO_CREADO",
    comentario: `Proyecto creado: ${proyecto.nombre}`,
  });

  return getById(user, proyecto.id);
};

const update = async (user, id, body) => {
  const proyecto = await GestionProyecto.findOne({ where: { id, activo: true } });
  if (!proyecto) throw new Error("Proyecto no encontrado");
  await validarPermisoProyecto(
    user,
    proyecto
  );

  const allowed = ["nombre", "descripcion", "estado", "prioridad", "responsable_id", "supervisor_id", "fecha_inicio", "fecha_fin", "color"];
  const payload = {};
  allowed.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) payload[field] = body[field];
  });

  await proyecto.update(payload);

  await gestionProyectoActividadService.crear({
    proyecto_id: id,
    usuario_id: user.id,
    tipo: "PROYECTO_ACTUALIZADO",
    comentario: "Proyecto actualizado",
    metadata: payload,
  });

  return getById(user, id);
};

const addMember = async (user, id, body) => {

  const proyecto =
    await GestionProyecto.findByPk(id);

  if (!proyecto) {
    throw new Error(
      "Proyecto no encontrado"
    );
  }

  await validarPermisoProyecto(
    user,
    proyecto
  );

  if (!body.usuario_id) {
    throw new Error(
      "usuario_id obligatorio"
    );
  }

  const miembroExistente =
    await GestionProyectoMiembro.findOne({
      where: {
        proyecto_id: id,
        usuario_id: body.usuario_id,
      },
    });

  if (miembroExistente) {

    await miembroExistente.update({
      activo: true,
      rol:
        body.rol ||
        miembroExistente.rol,
    });

  } else {

    await GestionProyectoMiembro.create({
      proyecto_id: id,
      usuario_id: body.usuario_id,
      rol:
        body.rol ||
        "COLABORADOR",
      activo: true,
    });

  }

  await gestionProyectoActividadService.crear({
    proyecto_id: id,
    usuario_id: user.id,
    tipo: "MIEMBRO_AGREGADO",
    comentario: `Usuario ${body.usuario_id} agregado al proyecto`,
    metadata: {
      usuario_id: body.usuario_id,
      rol: body.rol,
    },
  });

  return getById(user, id);
};

const removeMember = async (
  user,
  proyecto_id,
  miembro_id
) => {

  const proyecto =
    await GestionProyecto.findByPk(
      proyecto_id
    );

  if (!proyecto) {
    throw new Error(
      "Proyecto no encontrado"
    );
  }

  await validarPermisoProyecto(
    user,
    proyecto
  );


  const miembro =
    await GestionProyectoMiembro.findByPk(
      miembro_id
    );

  if (!miembro)
    throw new Error("Miembro no encontrado");

  await miembro.update({
    activo: false,
  });

  await gestionProyectoActividadService.crear({
    proyecto_id,
    usuario_id: user.id,
    tipo: "MIEMBRO_ELIMINADO",
    comentario: "Miembro eliminado",
    metadata: {
      usuario_id: miembro.usuario_id,
    },
  });

  return getById(user, proyecto_id);
};

const addComment = async (
  user,
  proyecto_id,
  comentario
) => {

  if (
    Number(user.rol_id) === 1
  ) {

    await gestionProyectoActividadService.crear({
      proyecto_id,
      usuario_id: user.id,
      tipo: "COMENTARIO",
      comentario,
    });

    return getById(
      user,
      proyecto_id
    );

  }

  const miembroProyecto =
    await GestionProyectoMiembro.findOne({
      where: {
        proyecto_id,
        usuario_id: user.id,
        activo: true,
      },
    });

  if (!miembroProyecto) {
    throw new Error(
      "No participa del proyecto"
    );
  }

  await gestionProyectoActividadService.crear({
    proyecto_id,
    usuario_id: user.id,
    tipo: "COMENTARIO",
    comentario,
  });

  return getById(user, proyecto_id);
};

const closeProject = async (
  user,
  proyecto_id
) => {

  const proyecto =
    await GestionProyecto.findByPk(
      proyecto_id
    );

  if (!proyecto)
    throw new Error(
      "Proyecto no encontrado"
    );

  await validarPermisoProyecto(
    user,
    proyecto
  );

  await proyecto.update({
    estado: "FINALIZADO",
  });

  await gestionProyectoActividadService.crear({
    proyecto_id,
    usuario_id: user.id,
    tipo: "PROYECTO_CERRADO",
    comentario: "Proyecto finalizado",
  });

  return getById(user, proyecto_id);
};

const remove = async (
  user,
  proyecto_id
) => {

  const proyecto =
    await GestionProyecto.findByPk(
      proyecto_id
    );

  if (!proyecto) {
    throw new Error(
      "Proyecto no encontrado"
    );
  }

  await validarPermisoProyecto(
    user,
    proyecto
  );

  await proyecto.update({
    activo: false,
  });

  await gestionProyectoActividadService.crear({
    proyecto_id,
    usuario_id: user.id,
    tipo: "PROYECTO_ELIMINADO",
    comentario:
      "Proyecto eliminado",
  });

  return true;

};

export default { getAll, getById, create, update, addMember, removeMember, addComment, closeProject, remove };
