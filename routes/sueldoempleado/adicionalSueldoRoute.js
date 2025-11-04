import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/adicionalSueldoController.js";

const adicionalSueldoRouter = Router();

adicionalSueldoRouter.post("/adicionalessueldo", controller.crearAdicionalSueldo);
adicionalSueldoRouter.get("/adicionalessueldo", controller.listarAdicionalesSueldo);
adicionalSueldoRouter.get("/adicionalessueldo/:id", controller.obtenerAdicionalSueldoPorId);
adicionalSueldoRouter.put("/adicionalessueldo/:id", controller.actualizarAdicionalSueldo);
adicionalSueldoRouter.delete("/adicionalessueldo/:id", controller.eliminarAdicionalSueldo);

export default adicionalSueldoRouter;
