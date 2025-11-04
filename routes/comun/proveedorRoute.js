// routes/comun/proveedorRoute.js
import { Router } from "express";
import * as proveedorController from "../../controllers/comun/proveedorController.js";

const proveedorRouter = Router();

proveedorRouter.post("/proveedores", proveedorController.crearProveedor);
proveedorRouter.get("/proveedores", proveedorController.listarProveedores);
proveedorRouter.get("/proveedores/:id", proveedorController.obtenerProveedorPorId);
proveedorRouter.put("/proveedores/:id", proveedorController.actualizarProveedor);
proveedorRouter.delete("/proveedores/:id", proveedorController.eliminarProveedor);

export default proveedorRouter;
