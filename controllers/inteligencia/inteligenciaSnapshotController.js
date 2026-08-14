import {
  crearSnapshotComercial,
  listarSnapshots,
  obtenerSnapshotPorId,
  eliminarSnapshot,
} from "../../services/inteligencia/inteligenciaSnapshotService.js";

export const listar = async (req, res) => {

  try {

    const snapshots =
      await listarSnapshots();


    return res.json({
      ok: true,
      data: snapshots,
    });

  }
  catch (error) {

    console.error(
      "Error listando snapshots:",
      error
    );


    return res.status(500).json({
      ok: false,
      message:
        error.message ||
        "Error al obtener las instantáneas",
    });

  }

};


export const obtener = async (req, res) => {

  try {

    const snapshot =
      await obtenerSnapshotPorId(
        req.params.id
      );


    return res.json({
      ok: true,
      data: snapshot,
    });

  }
  catch (error) {

    console.error(
      "Error obteniendo snapshot:",
      error
    );


    return res.status(404).json({
      ok: false,
      message:
        error.message ||
        "Instantánea no encontrada",
    });

  }

};


export const eliminar = async (req, res) => {

  try {

    const resultado =
      await eliminarSnapshot(
        req.params.id
      );


    return res.json({
      ok: true,

      message:
        "Instantánea eliminada correctamente",

      data: resultado,
    });

  }
  catch (error) {

    console.error(
      "Error eliminando snapshot:",
      error
    );


    return res.status(500).json({
      ok: false,
      message:
        error.message ||
        "Error al eliminar la instantánea",
    });

  }

};

export const crearSnapshot = async (
  req,
  res
) => {

  try {

    const {
      fecha,
      observaciones,
    } = req.body;


    if (!fecha) {

      return res.status(400).json({
        ok: false,
        message:
          "La fecha es obligatoria",
      });

    }


    /*
    | Por ahora lo dejamos preparado.
    |
    | Cuando veamos exactamente cómo viene
    | el usuario autenticado en req,
    | reemplazamos esto por:
    |
    | req.user.id
    | req.usuario.id
    | etc.
    */

    const usuario_id =
      req.user?.id ??
      req.usuario?.id ??
      null;


    const resultado =
      await crearSnapshotComercial({
        fecha,
        observaciones,
        usuario_id,
      });


    return res.status(201).json({
      ok: true,

      message:
        "Instantánea comercial creada correctamente",

      data: resultado,
    });

  }
  catch (error) {

    console.error(
      "Error creando snapshot comercial:",
      error
    );


    return res.status(500).json({
      ok: false,
      message:
        error.message ||
        "Error al crear la instantánea comercial",
    });

  }

};