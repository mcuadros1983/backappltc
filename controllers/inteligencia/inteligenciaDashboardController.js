import inteligenciaDashboardService
    from "../../services/inteligencia/inteligenciaDashboardService.js";


/*
|--------------------------------------------------------------------------
| OBTENER DASHBOARD DE INTELIGENCIA COMERCIAL
|--------------------------------------------------------------------------
|
| GET /inteligencia/dashboard
|
| Devuelve el estado general de las fuentes que alimentan
| Inteligencia Comercial:
|
| - Ventas totales
| - Ventas por artículo
| - Snapshots de precios y promociones
| - Clima
| - Eventos
| - Eventos activos hoy
| - Próximos eventos
|
|--------------------------------------------------------------------------
*/

export const obtenerDashboard = async (
    req,
    res,
    next
) => {

    try {

        const dashboard =
            await inteligenciaDashboardService
                .obtenerDashboardInteligencia();


        return res.status(200).json({

            ok: true,

            dashboard,

        });

    }
    catch (error) {

        console.error(
            "[InteligenciaDashboardController] Error obteniendo dashboard:",
            error
        );


        return next(error);

    }

};


/*
|--------------------------------------------------------------------------
| EXPORT DEFAULT
|--------------------------------------------------------------------------
*/

export default {

    obtenerDashboard,

};