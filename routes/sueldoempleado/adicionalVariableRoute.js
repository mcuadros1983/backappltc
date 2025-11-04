import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/adicionalVariableController.js";

const adicionalVariableRouter = Router();

adicionalVariableRouter.get("/adicionalvariable", controller.listarAdicionalesVariables);
adicionalVariableRouter.get("/adicionalvariable/:id", controller.obtenerAdicionalVariable);
adicionalVariableRouter.post("/adicionalvariable", controller.crearAdicionalVariable);
adicionalVariableRouter.put("/adicionalvariable/:id", controller.actualizarAdicionalVariable);
adicionalVariableRouter.delete("/adicionalvariable/:id", controller.eliminarAdicionalVariable);

export default adicionalVariableRouter;




//adicionalVariableRouter.post("/adicionalvariable", controller.crearVariable);