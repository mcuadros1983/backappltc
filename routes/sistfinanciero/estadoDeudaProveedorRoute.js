import { Router } from "express";
import * as controller from "../../controllers/sistfinanciero/estadoDeudaProveedorController.js";

const estadoDeudaProveedorRouter = Router();

estadoDeudaProveedorRouter.post("/estadodeudaproveedores", controller.crearEstadoDeudaProveedor);
estadoDeudaProveedorRouter.get("/estadodeudaproveedores", controller.listarEstadosDeudaProveedor);
estadoDeudaProveedorRouter.get("/estadodeudaproveedores/:id", controller.obtenerEstadoDeudaProveedorPorId);
estadoDeudaProveedorRouter.put("/estadodeudaproveedores/:id", controller.actualizarEstadoDeudaProveedor);
estadoDeudaProveedorRouter.delete("/estadodeudaproveedores/:id", controller.eliminarEstadoDeudaProveedor);

export default estadoDeudaProveedorRouter;
