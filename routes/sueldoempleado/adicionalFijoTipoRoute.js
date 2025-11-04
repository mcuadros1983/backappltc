import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/adicionalFijoTipoController.js";

const adicionalFijoTipoRouter = Router();

adicionalFijoTipoRouter.get("/adicionalfijotipo", controller.listarTiposFijos);
adicionalFijoTipoRouter.post("/adicionalfijotipo", controller.crearTipoFijo);
adicionalFijoTipoRouter.put("/adicionalfijotipo/:id", controller.actualizarTipoFijo);
adicionalFijoTipoRouter.delete("/adicionalfijotipo/:id", controller.eliminarTipoFijo);

export default adicionalFijoTipoRouter;
