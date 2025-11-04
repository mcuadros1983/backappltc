import { Router } from "express";
import * as controller from "../../controllers/tesoreria/pagoTransferenciaBancariaController.js";

const pagoTransferenciaBancariaRouter = Router();

pagoTransferenciaBancariaRouter.post("/pagos-transferencia-bancaria", controller.crearPagoTransferenciaBancaria);
pagoTransferenciaBancariaRouter.get("/pagos-transferencia-bancaria", controller.listarPagosTransferenciaBancaria);
pagoTransferenciaBancariaRouter.get("/pagos-transferencia-bancaria/:id", controller.obtenerPagoTransferenciaBancariaPorId);
pagoTransferenciaBancariaRouter.put("/pagos-transferencia-bancaria/:id", controller.actualizarPagoTransferenciaBancaria);
pagoTransferenciaBancariaRouter.delete("/pagos-transferencia-bancaria/:id", controller.eliminarPagoTransferenciaBancaria);

export default pagoTransferenciaBancariaRouter;
