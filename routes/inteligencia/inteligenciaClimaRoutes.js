import { Router } from "express";

import {
  importar,
  completarHistorico,
  listar,
  obtenerPorFecha,
} from "../../controllers/inteligencia/inteligenciaClimaController.js";


const router = Router();


/*
|--------------------------------------------------------------------------
| IMPORTAR RANGO HISTÓRICO MANUAL
|--------------------------------------------------------------------------
|
| POST /inteligencia/clima/importar
|
| Body:
|
| {
|   "fecha_desde": "2025-01-01",
|   "fecha_hasta": "2025-12-31"
| }
|
|--------------------------------------------------------------------------
*/

router.post(
  "/clima/importar",
  importar
);


/*
|--------------------------------------------------------------------------
| COMPLETAR TODO EL HISTÓRICO
|--------------------------------------------------------------------------
|
| Busca automáticamente:
|
| MIN(VentaArticulo.fecha)
|          ↓
|         AYER
|
| POST /inteligencia/clima/completar-historico
|
|--------------------------------------------------------------------------
*/

router.post(
  "/clima/completar-historico",
  completarHistorico
);


/*
|--------------------------------------------------------------------------
| LISTAR HISTÓRICO CLIMÁTICO
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

router.get(
  "/clima",
  listar
);


/*
|--------------------------------------------------------------------------
| OBTENER CLIMA DE UNA FECHA
|--------------------------------------------------------------------------
|
| GET /inteligencia/clima/2026-08-10
|
| IMPORTANTE:
| Esta ruta debe quedar después de las rutas específicas anteriores.
|--------------------------------------------------------------------------
*/

router.get(
  "/clima/:fecha",
  obtenerPorFecha
);


export default router;