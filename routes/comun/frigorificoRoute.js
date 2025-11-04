// routes/comun/frigorificoRoute.js
import { Router } from "express";
import * as frigorificoController from "../../controllers/comun/frigorificoController.js";

const frigorificoRouter = Router();

frigorificoRouter.post("/frigorificos", frigorificoController.crearFrigorifico);
frigorificoRouter.get("/frigorificos", frigorificoController.listarFrigorificos);
frigorificoRouter.get("/frigorificos/:id", frigorificoController.obtenerFrigorificoPorId);
frigorificoRouter.put("/frigorificos/:id", frigorificoController.actualizarFrigorifico);
frigorificoRouter.delete("/frigorificos/:id", frigorificoController.eliminarFrigorifico);

export default frigorificoRouter;
