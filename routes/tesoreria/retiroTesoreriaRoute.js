import { Router } from "express";
import * as controller from "../../controllers/tesoreria/retiroTesoreriaController.js";

const retiroTesoreriaRouter = Router();

retiroTesoreriaRouter.post("/retiros-tesoreria/retiros-sucursal", controller.registrarRetirosSucursalIngreso);
retiroTesoreriaRouter.get("/retiros-tesoreria/retiros", controller.listarRetiros);

// sync completo por movimiento
retiroTesoreriaRouter.put("/retiros-tesoreria/retiros-sucursal/:movimientoId", controller.actualizarRetirosPorMovimiento);
retiroTesoreriaRouter.delete("/retiros-tesoreria/retiros-sucursal/:movimientoId", controller.eliminarTodosPorMovimiento);

// CRUD unitario por retiro (si lo seguís usando en otros lados)
retiroTesoreriaRouter.get("/retiros-tesoreria/:id", controller.obtenerRetiroTesoreriaPorId);
retiroTesoreriaRouter.put("/retiros-tesoreria/:id", controller.actualizarRetiroTesoreria);
retiroTesoreriaRouter.delete("/retiros-tesoreria/:id", controller.eliminarRetiroTesoreria);
retiroTesoreriaRouter.get("/retiros-sucursal-informados", controller.listarRetirosInformados);
retiroTesoreriaRouter.get("/retiros-sucursal-recepcion", controller.getRecepcionPorFecha);
export default retiroTesoreriaRouter;
