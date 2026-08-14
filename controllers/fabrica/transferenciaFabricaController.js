import {
  obtenerStockArticuloFabrica
} from "../../services/fabrica/stockFabricaService.js";

const stockInfo =
  await obtenerStockArticuloFabrica(
    articulo.codigobarra,
    fecha
  );

if (
  stockInfo.stock <
  Number(item.cantidad)
) {

  await transaction.rollback();

  return res.status(400).json({

    message:
      `Stock insuficiente para ${articulo.descripcion}`,

    stockDisponible:
      stockInfo.stock,

    solicitado:
      Number(item.cantidad)

  });

}