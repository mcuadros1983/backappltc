import { Router } from "express";
import * as controller from "../../controllers/sistfinanciero/pagoProveedorController.js";

const pagoProveedorRouter = Router();

pagoProveedorRouter.post("/pagosproveedores", controller.crearPagoProveedor);
pagoProveedorRouter.get("/pagosproveedores", controller.listarPagosProveedor);
pagoProveedorRouter.get("/pagosproveedores/:id", controller.obtenerPagoProveedorPorId);
pagoProveedorRouter.put("/pagosproveedores/:id", controller.actualizarPagoProveedor);
pagoProveedorRouter.delete("/pagosproveedores/:id", controller.eliminarPagoProveedor);

export default pagoProveedorRouter;
