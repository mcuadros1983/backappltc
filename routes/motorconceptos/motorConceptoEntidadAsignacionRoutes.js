import {
    Router,
} from "express";

import motorConceptoEntidadAsignacionController
    from "../../controllers/motorConceptos/motorConceptoEntidadAsignacionController.js";

// import auth
//     from "../middleware/auth.js";

const router =
    Router();

/*
|--------------------------------------------------------------------------
| Listado
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    // auth,
    motorConceptoEntidadAsignacionController.getAll
);

/*
|--------------------------------------------------------------------------
| Obtener por Id
|--------------------------------------------------------------------------
*/

router.get(
    "/entidad",
    // auth,
    motorConceptoEntidadAsignacionController.getByEntidad
);


router.get(
    "/:id",
    // auth,
    motorConceptoEntidadAsignacionController.getById
);

/*
|--------------------------------------------------------------------------
| Crear
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    // auth,
    motorConceptoEntidadAsignacionController.create
);

/*
|--------------------------------------------------------------------------
| Actualizar
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    // auth,
    motorConceptoEntidadAsignacionController.update
);

/*
|--------------------------------------------------------------------------
| Eliminación lógica
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    // auth,
    motorConceptoEntidadAsignacionController.remove
);



export default router;