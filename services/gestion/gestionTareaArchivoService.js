import {
  GestionTareaArchivo,
  GestionTarea,
  GestionTareaParticipante
} from "../../models/index.js";

import {
  uploadToDrive,
} from "../googleDriveService.js";

import gestionActividadService
  from "./gestionActividadService.js";

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

const uploadArchivo = async (
  user,
  tarea_id,
  file
) => {

  const tarea =
    await GestionTarea.findOne({
      where: {
        id: tarea_id,
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

  if (!file) {
    throw new Error(
      "Debe seleccionar un archivo"
    );
  }

  const drive =
    await uploadToDrive({
      originalName: file.originalname,
      mimeType: file.mimetype,
      localPath: file.path,
    });

  const archivo =
    await GestionTareaArchivo.create({
      tarea_id,
      usuario_id: user.id,
      nombre_original:
        file.originalname,
      mime_type:
        file.mimetype,
      drive_file_id:
        drive.fileId,
      drive_url:
        drive.webViewLink,
    });

  await gestionActividadService.crear({
    tarea_id,
    usuario_id: user.id,
    tipo: "ARCHIVO",
    comentario:
      file.originalname,
  });

  return archivo;
};

export default {
  uploadArchivo,
};