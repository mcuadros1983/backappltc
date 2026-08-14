import express from "express";

import {
    obtenerStockFabrica,
    obtenerDetalleStockFabrica,
    listarTransferenciasFabrica,
    listarDetalleTransferenciaFabrica,
    transferirDesdeFabrica,
    obtenerInventariosFabrica
} from "../../controllers/fabrica/stockFabricaController.js";

// import {
//     transferirDesdeFabrica
// } from "../../controllers/fabrica/transferenciaFabricaController.js";

const router = express.Router();

router.get(
  "/inventarios",
  obtenerInventariosFabrica
);

router.get(
    "/detalle/:codigobarra",
    obtenerDetalleStockFabrica
);

router.get(
    "/",
    obtenerStockFabrica
);

router.post(
    "/transferir",
    transferirDesdeFabrica
);

router.get(
  "/transferencias",
  listarTransferenciasFabrica
);

router.get(
  "/transferencias/detalle",
  listarDetalleTransferenciaFabrica
);


export default router;  
