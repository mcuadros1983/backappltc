// routes/sueldoempleado/adicionalFijoValorRoute.js
import { Router } from "express";
import * as controller from "../../controllers/sueldoempleado/adicionalFijoValorController.js";

const adicionalFijoValorRouter = Router();

adicionalFijoValorRouter.get("/adicionalfijovalor", controller.listarValoresFijos);
adicionalFijoValorRouter.get("/adicionalfijovalor/vigente", controller.vigenteParaFecha);
adicionalFijoValorRouter.post("/adicionalfijovalor", controller.crearValorFijo);
adicionalFijoValorRouter.put("/adicionalfijovalor/:id/cerrar", controller.cerrarVigenciaValorFijo);
// 👇 nuevo endpoint atómico
adicionalFijoValorRouter.post("/adicionalfijovalor/seguro", controller.crearValorFijoSeguro);


adicionalFijoValorRouter.put("/adicionalfijovalor/:id", controller.actualizarValorFijo);
export default adicionalFijoValorRouter;
