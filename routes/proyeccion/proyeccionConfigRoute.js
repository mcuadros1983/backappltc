// server/routes/proyeccionConfigRoute.js
import { Router } from "express";
import { proyeccionFactorController } from "../../controllers/proyeccion/proyeccionFactorController.js";
import { proyeccionFeriadoController } from "../../controllers/proyeccion/proyeccionFeriadoController.js";

const proyeccionConfigRouter = Router();

// FACTORES GENERALES
proyeccionConfigRouter.get("/proyeccion/config/factores", proyeccionFactorController.list);
proyeccionConfigRouter.post("/proyeccion/config/factores", proyeccionFactorController.create);
proyeccionConfigRouter.put("/proyeccion/config/factores/:id", proyeccionFactorController.update);
proyeccionConfigRouter.delete("/proyeccion/config/factores/:id", proyeccionFactorController.remove);

// FERIADOS ESPECIALES
proyeccionConfigRouter.get("/proyeccion/config/feriados", proyeccionFeriadoController.list);
proyeccionConfigRouter.post("/proyeccion/config/feriados", proyeccionFeriadoController.create);
proyeccionConfigRouter.put("/proyeccion/config/feriados/:id", proyeccionFeriadoController.update);
proyeccionConfigRouter.delete("/proyeccion/config/feriados/:id", proyeccionFeriadoController.remove);

export default proyeccionConfigRouter;
