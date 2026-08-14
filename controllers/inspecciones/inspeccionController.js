import {
  sequelize,
  Inspeccion,
  InspeccionPlantilla,
  InspeccionCategoria,
  InspeccionItem,
  InspeccionRespuesta,
  InspeccionEvidencia
} from "../../models/index.js";

import {
  InspeccionHistorial,
} from "../../models/index.js";

import { uploadToDrive, deleteFromDrive } from "../../services/googleDriveService.js";

import { crearNotificacion } from "../../services/inspeccion/inspeccionNotificacionService.js";

import Sucursal from "../../models/gmedias/sucursalModel.js";
import Usuario from "../../models/auth/usuarioModel.js";
// import InspeccionPlantilla from "../../models/inspecciones/inspeccionPlantillaModel.js";

import { Op } from "sequelize";

export const crearInspeccion = async (req, res) => {


  const transaction = await sequelize.transaction();

  try {
    const {
      plantilla_id,
      sucursal_id,
      fecha_inspeccion,
      observacion_general,
    } = req.body;

    const usuario_inspector_id = req.user.id;

    // =====================================
    // Validaciones
    // =====================================

    if (!plantilla_id) {
      await transaction.rollback();

      return res.status(400).json({
        message: "Debe seleccionar una plantilla.",
      });
    }

    if (!sucursal_id) {
      await transaction.rollback();

      return res.status(400).json({
        message: "Debe seleccionar una sucursal.",
      });
    }

    // =====================================
    // Solo una inspección abierta por sucursal
    // =====================================

    // const inspeccionAbierta =
    //   await Inspeccion.findOne({
    //     where: {
    //       sucursal_id,
    //       estado: [
    //         "ABIERTA",
    //         "PARCIAL",
    //       ],
    //     },
    //     transaction,
    //   });

    // if (inspeccionAbierta) {
    //   await transaction.rollback();

    //   return res.status(400).json({
    //     message:
    //       "La sucursal ya posee una inspección abierta.",
    //   });
    // }

    // =====================================
    // Buscar plantilla completa
    // =====================================

    const plantilla =
      await InspeccionPlantilla.findByPk(
        plantilla_id,
        {
          include: [
            {
              model: InspeccionCategoria,
              as: "categorias",
              include: [
                {
                  model: InspeccionItem,
                  as: "items",
                },
              ],
            },
          ],
          transaction,
        }
      );

    if (!plantilla) {
      await transaction.rollback();

      return res.status(404).json({
        message: "Plantilla no encontrada.",
      });
    }

    // =====================================
    // Crear inspección
    // =====================================

    const inspeccion =
      await Inspeccion.create(
        {
          plantilla_id,
          sucursal_id,
          usuario_inspector_id,
          fecha_inspeccion:
            fecha_inspeccion ||
            new Date(),

          observacion_general:
            observacion_general || null,

          estado: "ABIERTA",

          empresa_id:
            req.user.empresa_id || null,
        },
        {
          transaction,
        }
      );

    // =====================================
    // Generar respuestas automáticamente
    // =====================================

    const respuestas = [];

    for (const categoria of plantilla.categorias) {
      for (const item of categoria.items) {
        respuestas.push({
          inspeccion_id: inspeccion.id,

          categoria_id: categoria.id,

          categoria_nombre: categoria.nombre,

          item_id: item.id,

          descripcion_item:
            item.descripcion,

          peso_item:
            item.peso,

          tipo_respuesta_item:
            item.tipo_respuesta,

          criticidad_item:
            item.criticidad,

          requiere_accion: false,

          requiere_foto:
            item.requiere_foto_default,

          criticidad_observacion:
            item.criticidad,

          estado: "PENDIENTE",
        });
      }
    }

    if (respuestas.length > 0) {
      await InspeccionRespuesta.bulkCreate(
        respuestas,
        {
          transaction,
        }
      );
    }

    await transaction.commit();

    return res.status(201).json({
      message:
        "Inspección creada correctamente.",
      inspeccion_id:
        inspeccion.id,
    });
  } catch (error) {
    await transaction.rollback();

    console.error(error);

    return res.status(500).json({
      message:
        "Error al crear la inspección.",
      error: error.message,
    });
  }
};

export const obtenerInspecciones = async (
  req,
  res
) => {
  try {
    const where = {};

    const { incluir_anuladas } =
      req.query;

    if (
      incluir_anuladas !== "true"
    ) {
      where.estado = {
        [Op.ne]: "ANULADA",
      };
    }

    const esAdmin =
      Number(req.user.rol_id) === 1 ||
      req.user.permissions?.includes(
        "inspecciones:admin"
      );

    if (!esAdmin) {
      where.sucursal_id =
        req.user.sucursal_id;
    }

    const inspecciones =
      await Inspeccion.findAll({
        where,

        include: [
          {
            model: InspeccionPlantilla,
            as: "plantilla",
          },
          {
            model: Sucursal,
            as: "sucursal",
          },
          {
            model: Usuario,
            as: "inspector",
            attributes: [
              "id",
              "usuario",
            ],
          },
        ],

        order: [
          ["createdAt", "DESC"],
        ],
      });

    return res.json(inspecciones);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Error obteniendo inspecciones",
    });
  }
};

export const obtenerInspeccionPorId =
  async (req, res) => {
    try {
      const { id } = req.params;

      const inspeccion =
        await Inspeccion.findByPk(id, {
          include: [
            {
              model: Sucursal,
              as: "sucursal",
            },

            {
              model: Usuario,
              as: "inspector",
              attributes: [
                "id",
                "usuario",
              ],
            },

            {
              model: InspeccionPlantilla,
              as: "plantilla",
            },

            {
              model:
                InspeccionRespuesta,

              as: "respuestas",

              include: [
                {
                  model:
                    InspeccionEvidencia,

                  as: "evidencias",

                  separate: true,

                  order: [
                    [
                      "createdAt",
                      "DESC",
                    ],
                  ],
                },

                {
                  model:
                    InspeccionHistorial,

                  as: "historial",

                  include: [
                    {
                      model:
                        Usuario,

                      as: "usuario",

                      attributes: [
                        "id",
                        "usuario",
                      ],
                    },
                  ],
                },

                {
                  model:
                    Usuario,

                  as:
                    "usuario_inspector",

                  attributes: [
                    "id",
                    "usuario",
                  ],
                },

                {
                  model:
                    Usuario,

                  as:
                    "usuario_corrector",

                  attributes: [
                    "id",
                    "usuario",
                  ],
                },

                {
                  model:
                    Usuario,

                  as:
                    "usuario_revisor",

                  attributes: [
                    "id",
                    "usuario",
                  ],
                },
              ],
            },
          ],
        });

      if (!inspeccion) {
        return res.status(404).json({
          message:
            "Inspección no encontrada",
        });
      }

      const esAdmin =
        Number(req.user.rol_id) === 1 ||
        req.user.permissions?.includes(
          "inspecciones:admin"
        );

      if (
        !esAdmin &&
        Number(
          inspeccion.sucursal_id
        ) !==
        Number(
          req.user.sucursal_id
        )
      ) {
        return res.status(403).json({
          message:
            "No autorizado",
        });
      }

      return res.json(inspeccion);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Error obteniendo inspección",
      });
    }
  };



export const actualizarRespuesta =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        resultado,
        comentario_admin,
        requiere_accion,
        requiere_foto,
        criticidad_observacion,
        fecha_limite,
      } = req.body;

      const respuesta =
        await InspeccionRespuesta.findByPk(
          id
        );

      if (!respuesta) {
        return res.status(404).json({
          message:
            "Respuesta no encontrada",
        });
      }

      const estadoAnterior =
        respuesta.estado;

      let nuevoEstado =
        estadoAnterior;

      if (resultado === "CUMPLE") {
        nuevoEstado = "CERRADA";
      }

      if (
        resultado === "NO_CUMPLE" &&
        !requiere_accion
      ) {
        nuevoEstado = "CERRADA";
      }

      if (
        resultado === "NO_CUMPLE" &&
        requiere_accion
      ) {
        nuevoEstado = "PENDIENTE";
      }

      await respuesta.update({
        resultado,

        comentario_admin,

        requiere_accion,

        requiere_foto,

        criticidad_observacion,

        fecha_limite,

        usuario_inspector_id:
          req.user.id,

        estado: nuevoEstado,
      });

      if (
        resultado === "NO_CUMPLE" &&
        requiere_accion
      ) {
        const inspeccion =
          await Inspeccion.findByPk(
            respuesta.inspeccion_id
          );

        await crearNotificacion({
          inspeccion_id:
            respuesta.inspeccion_id,

          respuesta_id:
            respuesta.id,

          sucursal_id:
            inspeccion.sucursal_id,

          titulo:
            "Nueva observación",

          mensaje:
            respuesta.descripcion_item,

          tipo:
            "OBSERVACION_NUEVA",
        });
      }

      await InspeccionHistorial.create({
        respuesta_id:
          respuesta.id,

        usuario_id:
          req.user.id,

        accion:
          "INSPECCION_COMPLETADA",

        estado_anterior:
          estadoAnterior,

        estado_nuevo:
          nuevoEstado,

        comentario:
          comentario_admin,
      });

      return res.json({
        message:
          "Respuesta actualizada correctamente",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Error actualizando respuesta",
      });
    }
  };

export const actualizarRespuestasMasivo =
  async (req, res) => {
    const transaction =
      await sequelize.transaction();

    try {
      const { id } = req.params;

      const {
        respuestas,
      } = req.body;

      if (
        !Array.isArray(
          respuestas
        ) ||
        respuestas.length === 0
      ) {
        await transaction.rollback();

        return res.status(400).json({
          message:
            "Debe enviar respuestas.",
        });
      }

      const inspeccion =
        await Inspeccion.findByPk(
          id,
          {
            transaction,
          }
        );

      if (!inspeccion) {
        await transaction.rollback();

        return res.status(404).json({
          message:
            "Inspección no encontrada.",
        });
      }

      for (const item of respuestas) {
        const respuesta =
          await InspeccionRespuesta.findOne(
            {
              where: {
                id: item.id,
                inspeccion_id:
                  inspeccion.id,
              },
              transaction,
            }
          );

        if (!respuesta) {
          continue;
        }

        const estadoAnterior =
          respuesta.estado;

        let nuevoEstado =
          estadoAnterior;

        if (
          item.resultado ===
          "CUMPLE"
        ) {
          nuevoEstado =
            "CERRADA";
        }

        if (
          item.resultado ===
          "NO_CUMPLE" &&
          !item.requiere_accion
        ) {
          nuevoEstado =
            "CERRADA";
        }

        if (
          item.resultado ===
          "NO_CUMPLE" &&
          item.requiere_accion
        ) {
          nuevoEstado =
            "PENDIENTE";
        }

        await respuesta.update(
          {
            resultado:
              item.resultado,

            comentario_admin:
              item.comentario_admin,

            requiere_accion:
              item.requiere_accion,

            requiere_foto:
              item.requiere_foto,

            criticidad_observacion:
              item.criticidad_observacion,

            fecha_limite:
              item.fecha_limite,

            usuario_inspector_id:
              req.user.id,

            estado:
              nuevoEstado,
          },
          {
            transaction,
          }
        );

        if (
          item.resultado ===
          "NO_CUMPLE" &&
          item.requiere_accion
        ) {
          await crearNotificacion({
            inspeccion_id:
              inspeccion.id,

            respuesta_id:
              respuesta.id,

            sucursal_id:
              inspeccion.sucursal_id,

            titulo:
              "Nueva observación",

            mensaje:
              respuesta.descripcion_item,

            tipo:
              "OBSERVACION_NUEVA",
          });
        }

        await InspeccionHistorial.create(
          {
            respuesta_id:
              respuesta.id,

            usuario_id:
              req.user.id,

            accion:
              "INSPECCION_COMPLETADA",

            estado_anterior:
              estadoAnterior,

            estado_nuevo:
              nuevoEstado,

            comentario:
              item.comentario_admin,
          },
          {
            transaction,
          }
        );
      }

      await recalcularEstadoInspeccion(
        inspeccion.id,
        transaction
      );

      await transaction.commit();

      return res.json({
        ok: true,
        message:
          "Inspección actualizada correctamente.",
      });
    } catch (error) {
      await transaction.rollback();

      console.error(error);

      return res.status(500).json({
        message:
          "Error actualizando inspección.",
        error:
          error.message,
      });
    }
  };

export const trabajarRespuesta = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      comentario_sucursal,
      fecha_compromiso_sucursal,
    } = req.body;

    const respuesta =
      await InspeccionRespuesta.findByPk(id);

    if (!respuesta) {
      return res.status(404).json({
        message: "Respuesta no encontrada",
      });
    }

    const estadoAnterior = respuesta.estado;

    await respuesta.update({
      comentario_sucursal,
      fecha_compromiso_sucursal,

      fecha_inicio_trabajo:
        respuesta.fecha_inicio_trabajo ||
        new Date(),

      fecha_respuesta_sucursal:
        new Date(),

      usuario_corrector_id:
        req.user.id,

      estado:
        "EN_TRABAJO",
    });
    await InspeccionHistorial.create({
      respuesta_id: respuesta.id,
      usuario_id: req.user.id,
      accion: "SUCURSAL_INICIA_TRABAJO",
      estado_anterior: estadoAnterior,
      estado_nuevo: "EN_TRABAJO",
    });

    await recalcularEstadoInspeccion(
      respuesta.inspeccion_id
    );

    return res.json({
      message: "Trabajo iniciado",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};

export const subirEvidencia = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const respuesta =
      await InspeccionRespuesta.findByPk(id);

    if (!respuesta) {
      return res.status(404).json({
        message:
          "Respuesta no encontrada",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message:
          "Debe enviar un archivo",
      });
    }

    const {
      originalname,
      mimetype,
      path: localPath,
    } = req.file;

    const driveInfo =
      await uploadToDrive({
        originalName:
          originalname,
        mimeType: mimetype,
        localPath,
      });

    const evidencia =
      await InspeccionEvidencia.create({
        respuesta_id:
          respuesta.id,

        archivo:
          driveInfo.webViewLink ||
          driveInfo.webContentLink,

        drive_file_id:
          driveInfo.fileId,

        web_content_link:
          driveInfo.webContentLink || null,

        comentario:
          req.body.comentario ||
          null,

        usuario_id:
          req.user.id,
      });

    await InspeccionHistorial.create({
      respuesta_id:
        respuesta.id,

      usuario_id:
        req.user.id,

      accion:
        "EVIDENCIA_CARGADA",
    });

    return res.json({
      ok: true,
      evidencia,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Error subiendo evidencia",
      error:
        error.message,
    });
  }
};

export const enviarRevision = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const respuesta =
      await InspeccionRespuesta.findByPk(id);

    if (!respuesta) {
      return res.status(404).json({
        message: "Respuesta no encontrada",
      });
    }

    if (respuesta.requiere_foto) {
      const cantidad =
        await InspeccionEvidencia.count({
          where: {
            respuesta_id: respuesta.id,
          },
        });

      if (cantidad === 0) {
        return res.status(400).json({
          message:
            "Debe cargar evidencia fotográfica.",
        });
      }
    }

    const estadoAnterior =
      respuesta.estado;

    await respuesta.update({
      estado: "EN_REVISION",
    });

    const inspeccion =
      await Inspeccion.findByPk(
        respuesta.inspeccion_id
      );

    await crearNotificacion({
      inspeccion_id:
        respuesta.inspeccion_id,

      respuesta_id:
        respuesta.id,

      usuario_destino_id:
        inspeccion.usuario_inspector_id,

      titulo:
        "Revisión solicitada",

      mensaje:
        respuesta.descripcion_item,

      tipo:
        "REVISION_SOLICITADA",
    });


    await InspeccionHistorial.create({
      respuesta_id: respuesta.id,
      usuario_id: req.user.id,
      accion: "ENVIA_REVISION",
      estado_anterior: estadoAnterior,
      estado_nuevo: "EN_REVISION",
    });

    await recalcularEstadoInspeccion(
      respuesta.inspeccion_id
    );

    return res.json({
      message:
        "Enviado a revisión",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};

export const aprobarRespuesta = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const respuesta =
      await InspeccionRespuesta.findByPk(id);

    if (!respuesta) {
      return res.status(404).json({
        message: "Respuesta no encontrada",
      });
    }

    const estadoAnterior =
      respuesta.estado;

    const fechaAprobacion =
      new Date();

    const fechaInicio =
      respuesta.fecha_inicio_trabajo ||
      respuesta.createdAt;

    const diasResolucion =
      Math.ceil(
        (
          fechaAprobacion -
          new Date(
            fechaInicio
          )
        ) /
        (
          1000 *
          60 *
          60 *
          24
        )
      );

    let diasObjetivo = 7;

    switch (
    respuesta.criticidad_observacion
    ) {
      case "CRITICA":
        diasObjetivo = 1;
        break;

      case "ALTA":
        diasObjetivo = 3;
        break;

      case "MEDIA":
        diasObjetivo = 7;
        break;

      case "BAJA":
        diasObjetivo = 15;
        break;

      default:
        diasObjetivo = 7;
    }

    await respuesta.update({
      estado: "APROBADA",

      usuario_revisor_id:
        req.user.id,

      fecha_aprobacion:
        fechaAprobacion,

      dias_resolucion:
        diasResolucion,

      dias_objetivo:
        diasObjetivo,

      vencida:
        diasResolucion >
        diasObjetivo,
    });

    const inspeccion =
      await Inspeccion.findByPk(
        respuesta.inspeccion_id
      );

    await crearNotificacion({
      inspeccion_id:
        respuesta.inspeccion_id,

      respuesta_id:
        respuesta.id,

      sucursal_id:
        inspeccion.sucursal_id,

      titulo:
        "Observación aprobada",

      mensaje:
        respuesta.descripcion_item,

      tipo:
        "APROBADA",
    });

    await InspeccionHistorial.create({
      respuesta_id: respuesta.id,
      usuario_id: req.user.id,
      accion: "APROBADA",
      estado_anterior:
        estadoAnterior,
      estado_nuevo: "APROBADA",
    });

    await recalcularEstadoInspeccion(
      respuesta.inspeccion_id
    );

    return res.json({
      message:
        "Respuesta aprobada",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};

export const rechazarRespuesta = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const respuesta =
      await InspeccionRespuesta.findByPk(id);

    const estadoAnterior =
      respuesta.estado;

    await respuesta.update({
      estado: "RECHAZADA",
      usuario_revisor_id:
        req.user.id,
    });

    const inspeccion =
      await Inspeccion.findByPk(
        respuesta.inspeccion_id
      );

    await crearNotificacion({
      inspeccion_id:
        respuesta.inspeccion_id,

      respuesta_id:
        respuesta.id,

      sucursal_id:
        inspeccion.sucursal_id,

      titulo:
        "Observación rechazada",

      mensaje:
        respuesta.descripcion_item,

      tipo:
        "RECHAZADA",
    });

    await InspeccionHistorial.create({
      respuesta_id: respuesta.id,
      usuario_id: req.user.id,
      accion: "RECHAZADA",
      estado_anterior:
        estadoAnterior,
      estado_nuevo: "RECHAZADA",
      comentario:
        req.body.comentario,
    });

    await recalcularEstadoInspeccion(
      respuesta.inspeccion_id
    );

    return res.json({
      message:
        "Respuesta rechazada",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};

export const reabrirRespuesta = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const respuesta =
      await InspeccionRespuesta.findByPk(id);

    const estadoAnterior =
      respuesta.estado;

    await respuesta.update({
      estado: "REABIERTA",
      usuario_revisor_id: null,
      fecha_aprobacion: null,
    });

    const inspeccion =
      await Inspeccion.findByPk(
        respuesta.inspeccion_id
      );

    await crearNotificacion({
      inspeccion_id:
        respuesta.inspeccion_id,

      respuesta_id:
        respuesta.id,

      sucursal_id:
        inspeccion.sucursal_id,

      titulo:
        "Observación reabierta",

      mensaje:
        respuesta.descripcion_item,

      tipo:
        "REABIERTA",
    });

    await InspeccionHistorial.create({
      respuesta_id: respuesta.id,
      usuario_id: req.user.id,
      accion: "REABIERTA",
      estado_anterior:
        estadoAnterior,
      estado_nuevo: "REABIERTA",
      comentario:
        req.body.comentario,
    });

    await recalcularEstadoInspeccion(
      respuesta.inspeccion_id
    );

    return res.json({
      message:
        "Observación reabierta",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};

const recalcularEstadoInspeccion = async (
  inspeccion_id,
  transaction = null
) => {
  const respuestas = await InspeccionRespuesta.findAll({
    where: { inspeccion_id },
    transaction,
  });

  const inspeccion = await Inspeccion.findByPk(
    inspeccion_id,
    { transaction }
  );

  if (!inspeccion) return;

  const total = respuestas.length;

  const cerradas = respuestas.filter((r) =>
    ["APROBADA", "CERRADA"].includes(r.estado)
  ).length;

  const iniciadas = respuestas.filter((r) =>
    ["EN_TRABAJO", "EN_REVISION", "RECHAZADA", "REABIERTA", "APROBADA"].includes(r.estado)
  ).length;

  if (total > 0 && cerradas === total) {
    await inspeccion.update(
      { estado: "CERRADA", fecha_cierre: new Date() },
      { transaction }
    );
    return;
  }

  if (iniciadas === 0) {
    await inspeccion.update(
      { estado: "ABIERTA", fecha_cierre: null },
      { transaction }
    );
    return;
  }

  await inspeccion.update(
    { estado: "PARCIAL", fecha_cierre: null },
    { transaction }
  );
};

export const eliminarEvidencia =
  async (req, res) => {
    try {

      const evidencia =
        await InspeccionEvidencia.findByPk(
          req.params.id
        );

      if (!evidencia) {
        return res.status(404).json({
          message:
            "Evidencia no encontrada",
        });
      }

      if (
        evidencia.drive_file_id
      ) {
        await deleteFromDrive(
          evidencia.drive_file_id
        );
      }

      await evidencia.destroy();

      return res.json({
        message:
          "Evidencia eliminada",
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        message:
          "Error eliminando evidencia",
      });
    }
  };

export const anularInspeccion =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        motivo_anulacion,
      } = req.body;

      const inspeccion =
        await Inspeccion.findByPk(id);

      if (!inspeccion) {
        return res.status(404).json({
          message:
            "Inspección no encontrada",
        });
      }

      if (
        inspeccion.estado ===
        "ANULADA"
      ) {
        return res.status(400).json({
          message:
            "La inspección ya está anulada",
        });
      }

      await inspeccion.update({
        estado: "ANULADA",

        fecha_anulacion:
          new Date(),

        usuario_anulacion_id:
          req.user.id,

        motivo_anulacion:
          motivo_anulacion ||
          null,
      });

      await InspeccionHistorial.create({
        respuesta_id: null,

        usuario_id:
          req.user.id,

        accion:
          "INSPECCION_ANULADA",

        estado_anterior:
          inspeccion.estado,

        estado_nuevo:
          "ANULADA",

        comentario:
          motivo_anulacion ||
          null,
      }).catch(() => null);

      return res.json({
        ok: true,
        message:
          "Inspección anulada correctamente",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Error anulando inspección",
        error:
          error.message,
      });
    }
  };

