// routes/tesoreria/disponiblesRoutes.js
import { Router } from "express";
import { listarDisponibles } from "../../controllers/tesoreria/disponiblesController.js";

const disponiblesRouter = Router();

// GET /tesoreria/disponibles?medio=...&empresa_id=...&proveedor_id=...&desde=YYYY-MM-DD&hasta=YYYY-MM-DD&q=...
disponiblesRouter.get("/tesoreria/disponibles", listarDisponibles);

export default disponiblesRouter;