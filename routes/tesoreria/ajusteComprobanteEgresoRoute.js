import { Router } from "express";

import * as controller
  from "../../controllers/tesoreria/ajusteComprobanteEgresoController.js";


const ajusteComprobanteEgresoRouter =
  Router();


/* ----------------- COLECCIÓN ----------------- */

ajusteComprobanteEgresoRouter.get(
  "/ajustes-comprobante-egreso",
  controller.listarAjustesComprobanteEgreso
);


/* ----------------- ITEM ----------------- */

ajusteComprobanteEgresoRouter.get(
  "/ajustes-comprobante-egreso/:id(\\d+)",
  controller.obtenerAjusteComprobanteEgresoPorId
);


ajusteComprobanteEgresoRouter.delete(
  "/ajustes-comprobante-egreso/:id(\\d+)",
  controller.eliminarAjusteComprobanteEgreso
);


export default ajusteComprobanteEgresoRouter;