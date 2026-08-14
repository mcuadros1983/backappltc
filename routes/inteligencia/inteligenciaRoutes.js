import { Router } from "express";

import inteligenciaSnapshotRoutes
    from "./inteligenciaSnapshotRoutes.js";

import inteligenciaEventoRoutes
    from "./inteligenciaEventoRoutes.js";

import inteligenciaClimaRoutes
    from "./inteligenciaClimaRoutes.js";

import inteligenciaDashboardRoutes
    from "./inteligenciaDashboardRoutes.js";

const router = Router();


router.use(
    inteligenciaSnapshotRoutes
);


router.use(
    inteligenciaEventoRoutes
);


router.use(
    inteligenciaClimaRoutes
);

router.use(
    inteligenciaDashboardRoutes
);
export default router;