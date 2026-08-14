import { Router } from "express";

import {
  crear,
  listar,
  obtener,
  actualizar,
  eliminar,
  catalogo,
  obtenerConfiguracionEventos,
} from "../../controllers/inteligencia/inteligenciaEventoController.js";


const router = Router();

router.get(
  "/eventos/configuracion",
  obtenerConfiguracionEventos
);

/*
|--------------------------------------------------------------------------
| CATÁLOGO
|--------------------------------------------------------------------------
|
| IMPORTANTE:
| Tiene que estar antes de /eventos/:id
|--------------------------------------------------------------------------
*/

router.get(
  "/eventos/catalogo",
  catalogo
);


/*
|--------------------------------------------------------------------------
| CRUD
|--------------------------------------------------------------------------
*/

router.get(
  "/eventos",
  listar
);


router.get(
  "/eventos/:id",
  obtener
);


router.post(
  "/eventos",
  crear
);


router.put(
  "/eventos/:id",
  actualizar
);


router.delete(
  "/eventos/:id",
  eliminar
);


export default router;