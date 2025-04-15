import { Router } from "express";
import multer from "multer";
import { uploadVentas, getVentas, deleteVentas, obtenerVentasAgrupadas } from "../../controllers/statics/ventaStaticsController.js";

const ventaStaticsRouter = Router();

const upload = multer({ dest: "uploads/" }); // Middleware para manejar archivos

// Cargar archivo Excel
ventaStaticsRouter.post("/statics-upload", upload.single("file"), uploadVentas);

// Obtener todas las ventas
ventaStaticsRouter.get("/statics-ventas", getVentas);

// Eliminar todas las ventas (opcional)
ventaStaticsRouter.delete("/statics-ventas", deleteVentas);

ventaStaticsRouter.post("/statics-ventas-agrupadas", obtenerVentasAgrupadas);

export default ventaStaticsRouter;
