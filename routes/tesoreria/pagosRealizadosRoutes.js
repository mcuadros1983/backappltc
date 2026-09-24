import { Router } from "express";

import {
  listarPagosRealizados,
} from "../../controllers/tesoreria/pagosRealizadosController.js";


const pagosRealizadosRouter =
  Router();


pagosRealizadosRouter.get(
  "/tesoreria/pagos-realizados",
  listarPagosRealizados
);


export default pagosRealizadosRouter;