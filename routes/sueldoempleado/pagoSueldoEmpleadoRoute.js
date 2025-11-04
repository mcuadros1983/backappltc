import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/pagoSueldoEmpleadoController.js";

const pagoSueldoEmpleadoRouter = Router();

pagoSueldoEmpleadoRouter.post("/pagossueldoempleado", controller.crearPagoSueldoEmpleado);
pagoSueldoEmpleadoRouter.get("/pagossueldoempleado", controller.listarPagosSueldoEmpleado);
pagoSueldoEmpleadoRouter.get("/pagossueldoempleado/:id", controller.obtenerPagoSueldoEmpleadoPorId);
pagoSueldoEmpleadoRouter.put("/pagossueldoempleado/:id", controller.actualizarPagoSueldoEmpleado);
pagoSueldoEmpleadoRouter.delete("/pagossueldoempleado/:id", controller.eliminarPagoSueldoEmpleado);

// 👉 Nuevo endpoint transaccional (recomendado para la UI)
pagoSueldoEmpleadoRouter.post("/pagossueldoempleado/pagar", controller.pagarSueldoEmpleado);



export default pagoSueldoEmpleadoRouter;
