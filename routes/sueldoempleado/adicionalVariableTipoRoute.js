// routes/sueldoempleado/adicionalVariableTipoRoute.js
import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/adicionalVariableTipoController.js";

const adicionalVariableTipoRouter = Router();

adicionalVariableTipoRouter.get("/adicionalvariabletipo", controller.listarTiposVariables);
adicionalVariableTipoRouter.post("/adicionalvariabletipo", controller.crearTipoVariable);
adicionalVariableTipoRouter.put("/adicionalvariabletipo/:id", controller.actualizarTipoVariable);
adicionalVariableTipoRouter.delete("/adicionalvariabletipo/:id", controller.eliminarTipoVariable);

export default adicionalVariableTipoRouter;
