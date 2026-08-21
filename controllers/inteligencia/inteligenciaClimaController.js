import {
  importarClimaHistorico,
  sincronizarHistoricoClima,
  listarClima,
  obtenerClimaPorFecha,
} from "../../services/inteligencia/inteligenciaClimaService.js";
/*
|--------------------------------------------------------------------------
| IMPORTAR CLIMA HISTÓRICO POR RANGO
|--------------------------------------------------------------------------
|
| POST /inteligencia/clima/importar
|
| Body:
|
| {
|   "fecha_desde": "2024-01-01",
|   "fecha_hasta": "2026-08-10"
| }
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CAPTURA / SINCRONIZACIÓN MANUAL
|--------------------------------------------------------------------------
|
| Ejecuta manualmente el mismo proceso utilizado por el scheduler.
|
| Si no existe histórico:
|   -> realiza carga inicial
|
| Si ya existe histórico:
|   -> completa hasta ayer
|
|--------------------------------------------------------------------------
*/

export const capturar =
  async (
    req,
    res
  ) => {

    try {

      const resultado =
        await sincronizarHistoricoClima();


      return res.status(200).json({

        ok: true,

        ...resultado,

      });

    }
    catch (error) {

      console.error(
        "[Inteligencia Comercial] Error capturando clima:",
        error
      );


      return res.status(500).json({

        ok: false,

        error:
          error.message ||
          "No se pudo sincronizar el clima.",

      });

    }

  };

export const importar = async (
  req,
  res
) => {

  try {

    const {
      fecha_desde,
      fecha_hasta,
    } = req.body;


    if (!fecha_desde) {

      return res.status(400).json({
        ok: false,
        message:
          "fecha_desde es obligatoria",
      });

    }


    if (!fecha_hasta) {

      return res.status(400).json({
        ok: false,
        message:
          "fecha_hasta es obligatoria",
      });

    }


    const resultado =
      await importarClimaHistorico({
        fecha_desde,
        fecha_hasta,
      });


    return res.status(200).json({
      ok: true,

      message:
        "Histórico climático importado correctamente",

      data: resultado,
    });

  }
  catch (error) {

    console.error(
      "Error importando clima histórico:",
      error
    );


    return res.status(400).json({
      ok: false,

      message:
        error.message ||
        "Error al importar el histórico climático",
    });

  }

};


/*
|--------------------------------------------------------------------------
| LISTAR CLIMA
|--------------------------------------------------------------------------
|
| GET /inteligencia/clima
|
| Opcional:
|
| ?fecha_desde=2026-01-01
| &fecha_hasta=2026-08-10
|
|--------------------------------------------------------------------------
*/

export const listar = async (
  req,
  res
) => {

  try {

    const {
      fecha_desde,
      fecha_hasta,
    } = req.query;


    const clima =
      await listarClima({
        fecha_desde:
          fecha_desde || null,

        fecha_hasta:
          fecha_hasta || null,
      });


    return res.json({
      ok: true,
      data: clima,
    });

  }
  catch (error) {

    console.error(
      "Error listando clima:",
      error
    );


    return res.status(500).json({
      ok: false,

      message:
        error.message ||
        "Error al obtener el histórico climático",
    });

  }

};


/*
|--------------------------------------------------------------------------
| OBTENER CLIMA POR FECHA
|--------------------------------------------------------------------------
|
| GET /inteligencia/clima/2026-08-10
|
|--------------------------------------------------------------------------
*/

export const obtenerPorFecha = async (
  req,
  res
) => {

  try {

    const {
      fecha,
    } = req.params;


    const clima =
      await obtenerClimaPorFecha(
        fecha
      );


    return res.json({
      ok: true,
      data: clima,
    });

  }
  catch (error) {

    console.error(
      "Error obteniendo clima por fecha:",
      error
    );


    return res.status(404).json({
      ok: false,

      message:
        error.message ||
        "No se encontró información climática",
    });

  }

};
/*
|--------------------------------------------------------------------------
| COMPLETAR HISTÓRICO CLIMÁTICO AUTOMÁTICAMENTE
|--------------------------------------------------------------------------
|
| POST /inteligencia/clima/completar-historico
|
| No requiere body.
|--------------------------------------------------------------------------
*/
export const completarHistorico = async (
  req,
  res
) => {

  try {

    const resultado =
      await sincronizarHistoricoClima();


    return res.json({
      ok: true,

      message:
        resultado.tipo ===
          "CARGA_INICIAL"
          ? "Histórico climático inicial cargado correctamente"
          : resultado
            .ya_estaba_actualizado
            ? "El histórico climático ya estaba actualizado"
            : "Histórico climático actualizado correctamente",

      data:
        resultado,
    });

  }
  catch (error) {

    console.error(
      "Error sincronizando histórico climático:",
      error
    );


    return res.status(400).json({
      ok: false,

      message:
        error.message ||
        "Error al sincronizar el histórico climático",
    });

  }

};

