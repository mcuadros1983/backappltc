import { Router } from "express";
import * as controller from "../../controllers/sistfinanciero/pagoClienteController.js";

const pagoClienteRouter = Router();

pagoClienteRouter.post("/pagosclientes", controller.crearPagoCliente);
pagoClienteRouter.get("/pagosclientes", controller.listarPagosCliente);
pagoClienteRouter.get("/pagosclientes/:id", controller.obtenerPagoClientePorId);
pagoClienteRouter.put("/pagosclientes/:id", controller.actualizarPagoCliente);
pagoClienteRouter.delete("/pagosclientes/:id", controller.eliminarPagoCliente);

export default pagoClienteRouter;
