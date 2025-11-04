import { Router } from "express";
import * as controller from "../../controllers/sistfinanciero/estadoDeudaClienteController.js";

const estadoDeudaClienteRouter = Router();

estadoDeudaClienteRouter.post("/estadodeudaclientes", controller.crearEstadoDeudaCliente);
estadoDeudaClienteRouter.get("/estadodeudaclientes", controller.listarEstadosDeudaCliente);
estadoDeudaClienteRouter.get("/estadodeudaclientes/:id", controller.obtenerEstadoDeudaClientePorId);
estadoDeudaClienteRouter.put("/estadodeudaclientes/:id", controller.actualizarEstadoDeudaCliente);
estadoDeudaClienteRouter.delete("/estadodeudaclientes/:id", controller.eliminarEstadoDeudaCliente);

export default estadoDeudaClienteRouter;
