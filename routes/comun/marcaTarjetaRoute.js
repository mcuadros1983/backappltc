// routes/comun/marcaTarjetaRoute.js
import { Router } from "express";
import * as marcaTarjetaController from "../../controllers/comun/marcaTarjetaController.js";

const marcaTarjetaRouter = Router();

marcaTarjetaRouter.post("/marcas-tarjeta", marcaTarjetaController.crearMarcaTarjeta);
marcaTarjetaRouter.get("/marcas-tarjeta", marcaTarjetaController.listarMarcasTarjeta);
marcaTarjetaRouter.get("/marcas-tarjeta/:id", marcaTarjetaController.obtenerMarcaTarjetaPorId);
marcaTarjetaRouter.put("/marcas-tarjeta/:id", marcaTarjetaController.actualizarMarcaTarjeta);
marcaTarjetaRouter.delete("/marcas-tarjeta/:id", marcaTarjetaController.eliminarMarcaTarjeta);

export default marcaTarjetaRouter;
