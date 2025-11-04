import { Router } from "express";
import * as controller from "../../controllers/sistfinanciero/deudaProveedorController.js";

const deudaProveedorRouter = Router();

deudaProveedorRouter.post("/deudasproveedores", controller.crearDeudaProveedor);
deudaProveedorRouter.get("/deudasproveedores", controller.listarDeudasProveedor);
deudaProveedorRouter.get("/deudasproveedores/:id", controller.obtenerDeudaProveedorPorId);
deudaProveedorRouter.put("/deudasproveedores/:id", controller.actualizarDeudaProveedor);
deudaProveedorRouter.delete("/deudasproveedores/:id", controller.eliminarDeudaProveedor);

export default deudaProveedorRouter;
