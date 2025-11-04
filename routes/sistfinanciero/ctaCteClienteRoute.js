import { Router } from "express";
import * as controller from "../../controllers/sistfinanciero/ctaCteClienteController.js";

const ctaCteClienteRouter = Router();

ctaCteClienteRouter.post("/ctacteclientes", controller.crearCtaCteCliente);
ctaCteClienteRouter.get("/ctacteclientes", controller.listarCtaCteClientes);
ctaCteClienteRouter.get("/ctacteclientes/:id", controller.obtenerCtaCteClientePorId);
ctaCteClienteRouter.put("/ctacteclientes/:id", controller.actualizarCtaCteCliente);
ctaCteClienteRouter.delete("/ctacteclientes/:id", controller.eliminarCtaCteCliente);

export default ctaCteClienteRouter;
