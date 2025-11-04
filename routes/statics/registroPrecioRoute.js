// routes/sueldoempleado/adelantoEmpleadoRoute.js
import { Router } from "express";
import * as controller from "../../controllers/statics/registroPrecioController.js";

const registroPrecioRouter = Router();


registroPrecioRouter.get("/registro-precios", controller.listarRegistroPrecios);
registroPrecioRouter.get("/registro-precios/:id", controller.obtenerRegistroPrecio);
registroPrecioRouter.post("/registro-precios", controller.crearRegistroPrecio);
registroPrecioRouter.put("/registro-precios/:id", controller.actualizarRegistroPrecio);
registroPrecioRouter.delete("/registro-precios/:id", controller.eliminarRegistroPrecio);

export default registroPrecioRouter;
