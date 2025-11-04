// routes/conciliacion/rubroRoute.js
import { Router } from "express";
import * as rubroController from "../../controllers/conciliacion/rubroController.js";

const rubroRouter = Router();

rubroRouter.post("/conciliacion-rubros", rubroController.crearRubro);
rubroRouter.get("/conciliacion-rubros", rubroController.listarRubros);
rubroRouter.get("/conciliacion-rubros/:id", rubroController.obtenerRubroPorId);
rubroRouter.put("/conciliacion-rubros/:id", rubroController.actualizarRubro);
rubroRouter.delete("/conciliacion-rubros/:id", rubroController.eliminarRubro);

export default rubroRouter;
