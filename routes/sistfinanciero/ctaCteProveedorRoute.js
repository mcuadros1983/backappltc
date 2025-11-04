import { Router } from "express";
import * as controller from "../../controllers/sistfinanciero/ctaCteProveedorController.js";

const ctaCteProveedorRouter = Router();

ctaCteProveedorRouter.post("/ctacteproveedores", controller.crearCtaCteProveedor);
ctaCteProveedorRouter.get("/ctacteproveedores", controller.listarCtaCteProveedores);
ctaCteProveedorRouter.get("/ctacteproveedores/:id", controller.obtenerCtaCteProveedorPorId);
ctaCteProveedorRouter.put("/ctacteproveedores/:id", controller.actualizarCtaCteProveedor);
ctaCteProveedorRouter.delete("/ctacteproveedores/:id", controller.eliminarCtaCteProveedor);

export default ctaCteProveedorRouter;
