import { Router } from "express";
import * as controller from "../../controllers/sistfinanciero/deudaClienteController.js";

const deudaClienteRouter = Router();

deudaClienteRouter.post("/deudasclientes", controller.crearDeudaCliente);
deudaClienteRouter.get("/deudasclientes", controller.listarDeudasClientes);
deudaClienteRouter.get("/deudasclientes/:id", controller.obtenerDeudaClientePorId);
deudaClienteRouter.put("/deudasclientes/:id", controller.actualizarDeudaCliente);
deudaClienteRouter.delete("/deudasclientes/:id", controller.eliminarDeudaCliente);

export default deudaClienteRouter;
