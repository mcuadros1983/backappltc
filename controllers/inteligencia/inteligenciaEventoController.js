import {
  crearEvento,
  listarEventos,
  obtenerEventoPorId,
  actualizarEvento,
  eliminarEvento,
  obtenerCatalogoEventos,
} from "../../services/inteligencia/inteligenciaEventoService.js";

import {
  INTELIGENCIA_EVENTOS,
} from "../../config/inteligenciaEventos.js";


/*
|--------------------------------------------------------------------------
| OBTENER CONFIGURACIÓN DE EVENTOS
|--------------------------------------------------------------------------
|
| Devuelve al frontend el catálogo oficial de categorías,
| tipos y campos permitidos.
|
| El backend sigue siendo la única fuente de verdad.
|--------------------------------------------------------------------------
*/

export const obtenerConfiguracionEventos =
  async (req, res) => {

    try {

      return res.json({
        categorias:
          INTELIGENCIA_EVENTOS,
      });

    }
    catch (error) {

      console.error(
        "Error obteniendo configuración de eventos:",
        error
      );

      return res.status(500).json({
        error:
          "No se pudo obtener la configuración de eventos",
      });

    }

  };

export const crear = async (
  req,
  res
) => {

  try {

    const usuario_id =
      req.user?.id ?? null;


    const evento =
      await crearEvento({
        ...req.body,
        usuario_id,
      });


    return res.status(201).json({
      ok: true,
      message:
        "Evento creado correctamente",
      data: evento,
    });

  }
  catch (error) {

    console.error(
      "Error creando evento de inteligencia:",
      error
    );


    return res.status(400).json({
      ok: false,
      message: error.message,
    });

  }

};


export const listar = async (
  req,
  res
) => {

  try {

    const eventos =
      await listarEventos({
        fecha_desde:
          req.query.fecha_desde,

        fecha_hasta:
          req.query.fecha_hasta,

        categoria:
          req.query.categoria,

        tipo:
          req.query.tipo,

        sucursal_id:
          req.query.sucursal_id,

        articulo_id:
          req.query.articulo_id,

        activo:
          req.query.activo !== undefined
            ? req.query.activo === "true"
            : null,
      });


    return res.json({
      ok: true,
      data: eventos,
    });

  }
  catch (error) {

    console.error(
      "Error listando eventos:",
      error
    );


    return res.status(500).json({
      ok: false,
      message: error.message,
    });

  }

};


export const obtener = async (
  req,
  res
) => {

  try {

    const evento =
      await obtenerEventoPorId(
        req.params.id
      );


    return res.json({
      ok: true,
      data: evento,
    });

  }
  catch (error) {

    return res.status(404).json({
      ok: false,
      message: error.message,
    });

  }

};


// export const actualizar = async (
//   req,
//   res
// ) => {

//   try {

//     const evento =
//       await actualizarEvento(
//         req.params.id,
//         req.body
//       );


//     return res.json({
//       ok: true,
//       message:
//         "Evento actualizado correctamente",
//       data: evento,
//     });

//   }
//   catch (error) {

//     console.error(
//       "Error actualizando evento:",
//       error
//     );


//     return res.status(400).json({
//       ok: false,
//       message: error.message,
//     });

//   }

// };


// export const eliminar = async (
//   req,
//   res
// ) => {

//   try {

//     const resultado =
//       await eliminarEvento(
//         req.params.id
//       );


//     return res.json({
//       ok: true,
//       message:
//         "Evento eliminado correctamente",
//       data: resultado,
//     });

//   }
//   catch (error) {

//     return res.status(404).json({
//       ok: false,
//       message: error.message,
//     });

//   }

// };

/*
|--------------------------------------------------------------------------
| CATÁLOGO DE EVENTOS
|--------------------------------------------------------------------------
*/

export const catalogo = async (
  req,
  res
) => {

  try {

    const data =
      obtenerCatalogoEventos();


    return res.json({
      ok: true,
      data,
    });

  }
  catch (error) {

    console.error(
      "Error obteniendo catálogo de eventos:",
      error
    );


    return res.status(500).json({
      ok: false,
      message:
        "Error al obtener el catálogo de eventos",
    });

  }

};

export const actualizar = async (
  req,
  res
) => {

  try {

    const evento =
      await actualizarEvento(
        req.params.id,
        req.body
      );


    return res.json({
      ok: true,

      message:
        "Evento actualizado correctamente",

      data: evento,
    });

  }
  catch (error) {

    console.error(
      "Error actualizando evento:",
      error
    );


    return res.status(400).json({
      ok: false,
      message: error.message,
    });

  }

};

export const eliminar = async (
  req,
  res
) => {

  try {

    const resultado =
      await eliminarEvento(
        req.params.id
      );


    return res.json({
      ok: true,

      message:
        "Evento eliminado correctamente",

      data: resultado,
    });

  }
  catch (error) {

    console.error(
      "Error eliminando evento:",
      error
    );


    return res.status(404).json({
      ok: false,
      message: error.message,
    });

  }

};