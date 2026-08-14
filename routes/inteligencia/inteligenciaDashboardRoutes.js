import { Router } from "express";

import {
    obtenerDashboard,
} from "../../controllers/inteligencia/inteligenciaDashboardController.js";


const router = Router();


/*
|--------------------------------------------------------------------------
| DASHBOARD INTELIGENCIA COMERCIAL
|--------------------------------------------------------------------------
|
| Ruta final:
|
| GET /inteligencia/dashboard
|
| El prefijo /inteligencia se agrega desde indexRoute.js
|
|--------------------------------------------------------------------------
*/

router.get(
    "/dashboard",
    obtenerDashboard
);


export default router;