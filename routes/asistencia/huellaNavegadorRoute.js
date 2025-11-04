import { Router } from "express";
import * as controller from "../../controllers/asistencia/huellaNavegadorController.js"; 

const huellaNavegadorRouter = Router();

huellaNavegadorRouter.get("/huellanavegador/exists", controller.existeHuellaPorFingerprint);
huellaNavegadorRouter.post("/huellanavegador", controller.crearHuellaNavegador);
huellaNavegadorRouter.get("/huellanavegador", controller.listarHuellasNavegador);
huellaNavegadorRouter.get("/huellanavegador/:id(\\d+)", controller.obtenerHuellaNavegadorPorId);
huellaNavegadorRouter.put("/huellanavegador/:id(\\d+)", controller.actualizarHuellaNavegador);
huellaNavegadorRouter.delete("/huellanavegador/:id(\\d+)", controller.eliminarHuellaNavegador);

export default huellaNavegadorRouter;
