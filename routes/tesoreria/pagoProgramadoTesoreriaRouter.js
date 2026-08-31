import { Router } from "express";

import * as controller
  from "../../controllers/tesoreria/pagoProgramadoTesoreriaController.js";


const pagoProgramadoTesoreriaRouter =
  Router();


/*
 * Registrar nuevo compromiso
 */
pagoProgramadoTesoreriaRouter.post(
  "/pagos-programados",
  controller.registrarPagoProgramado
);

pagoProgramadoTesoreriaRouter.put(
  "/pagos-programados/:id",
  controller.actualizarPagoProgramado
);


/*
 * Listar
 */
pagoProgramadoTesoreriaRouter.get(
  "/pagos-programados",
  controller.listarPagosProgramados
);


/*
 * Acreditar:
 * transforma el compromiso en movimiento
 * real de Caja/Banco.
 */
pagoProgramadoTesoreriaRouter.post(
  "/pagos-programados/:id(\\d+)/acreditar",
  controller.acreditarPagoProgramado
);


/*
 * "Eliminar" para el usuario.
 *
 * Internamente queda anulado para conservar
 * trazabilidad.
 */
pagoProgramadoTesoreriaRouter.delete(
  "/pagos-programados/:id(\\d+)",
  controller.eliminarPagoProgramado
);


export default pagoProgramadoTesoreriaRouter;