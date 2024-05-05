// // import DetalleVenta from '../models/detalleVentaModel.js';
// // import {Venta} from '../models/ventaModel.js';
// // import Producto from '../models/productoModel.js';
// // import respuesta from '../utils/respuesta.js';

// // const obtenerDetallesVentas = async (req, res, next) => {
// //   try {
// //     const detallesVentas = await DetalleVenta.findAll({
// //       include: [Venta, Producto],
// //     });
// //     respuesta.ok(res, detallesVentas);
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // const obtenerDetalleVentaPorId = async (req, res, next) => {
// //   const detalleVentaId = req.params.detalleVentaId;

// //   try {
// //     const detalleVenta = await DetalleVenta.findByPk(detalleVentaId, {
// //       include: [Venta, Producto],
// //     });

// //     if (!detalleVenta) {
// //       return respuesta.error(res, 'Detalle de venta no encontrado', 404);
// //     }

// //     respuesta.ok(res, detalleVenta);
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // const crearDetalleVenta = async (req, res, next) => {
// //   const { ventaId, productoId, cantidad, precioUnitario } = req.body;

// //   try {
// //     const nuevoDetalleVenta = await DetalleVenta.create({
// //       ventaId,
// //       productoId,
// //       cantidad,
// //       precioUnitario,
// //     });

// //     respuesta.ok(res, nuevoDetalleVenta, 'Detalle de venta creado exitosamente');
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // const actualizarDetalleVenta = async (req, res, next) => {
// //   const detalleVentaId = req.params.detalleVentaId;
// //   const { ventaId, productoId, cantidad, precioUnitario } = req.body;

// //   try {
// //     const detalleVenta = await DetalleVenta.findByPk(detalleVentaId);

// //     if (!detalleVenta) {
// //       return respuesta.error(res, 'Detalle de venta no encontrado', 404);
// //     }

// //     detalleVenta.ventaId = ventaId;
// //     detalleVenta.productoId = productoId;
// //     detalleVenta.cantidad = cantidad;
// //     detalleVenta.precioUnitario = precioUnitario;
// //     await detalleVenta.save();

// //     respuesta.ok(res, detalleVenta, 'Detalle de venta actualizado exitosamente');
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // const eliminarDetalleVenta = async (req, res, next) => {
// //   const detalleVentaId = req.params.detalleVentaId;

// //   try {
// //     const detalleVenta = await DetalleVenta.findByPk(detalleVentaId);

// //     if (!detalleVenta) {
// //       return respuesta.error(res, 'Detalle de venta no encontrado', 404);
// //     }

// //     await detalleVenta.destroy();

// //     res.sendStatus(204);
// //   } catch (error) {
// //     next(error);
// //   }
// // };

// // export {
// //   obtenerDetallesVentas,
// //   obtenerDetalleVentaPorId,
// //   crearDetalleVenta,
// //   actualizarDetalleVenta,
// //   eliminarDetalleVenta,
// // };

// // detallesVentasController.js

// import Producto from '../models/productoModel.js';
// // import DetalleVenta from '../models/detalleVentaModel.js';
// import { Venta } from '../models/ventaModel.js';
// import Producto from '../models/productoModel.js';
// import respuesta from '../utils/respuesta.js';

// const obtenerDetallesVentas = async (req, res, next) => {
//   try {
//     const productos = await Producto.findAll({
//       include: [Venta],
//     });
//     res.json(productos);
//   } catch (error) {
//     next(error);
//   }
// };

// const obtenerDetalleVentaPorId = async (req, res, next) => {
//   const detalleVentaId = req.params.detalleVentaId;

//   try {
//     const detalleVenta = await DetalleVenta.findByPk(detalleVentaId, {
//       include: [
//         {
//           model: Venta, // Asegúrate de tener el modelo correcto aquí
//         },
//         {
//           model: Producto,
//           as: 'productos', // Usa el alias definido en la relación
//         },
//       ],
//     });

//     if (!detalleVenta) {
//       return respuesta.error(res, 'Detalle de venta no encontrado', 404);
//     }

//     res.json(detalleVenta);
//   } catch (error) {
//     next(error);
//   }
// };

// const crearDetalleVenta = async (cantidad, precioUnitario, venta_id) => {   
// // const crearDetalleVenta = async (ventaId, productoId, cantidad, precioUnitario) => { 
// // const crearDetalleVenta = async (req, res, next) => { 
//   // const { ventaId, productoId, cantidad, precioUnitario } = req.body;

//   try {
//     const nuevoDetalleVenta = await DetalleVenta.create({
//       cantidad,
//       precioUnitario,
//       venta_id,
//       // productoId,
//     });

//     res.json(nuevoDetalleVenta);
//   } catch (error) {
//     next(error);
//   }
// };

// const actualizarDetalleVenta = async (req, res, next) => {
//   const detalleVentaId = req.params.detalleVentaId;
//   const { ventaId, productoId, cantidad, precioUnitario } = req.body;

//   try {
//     const detalleVenta = await DetalleVenta.findByPk(detalleVentaId);

//     if (!detalleVenta) {
//       return respuesta.error(res, 'Detalle de venta no encontrado', 404);
//     }

//     detalleVenta.ventaId = ventaId;
//     detalleVenta.productoId = productoId;
//     detalleVenta.cantidad = cantidad;
//     detalleVenta.precioUnitario = precioUnitario;
//     await detalleVenta.save();

//     res.json(detalleVenta);
//   } catch (error) {
//     next(error);
//   }
// };

// const eliminarDetalleVenta = async (req, res, next) => {
//   const detalleVentaId = req.params.detalleVentaId;

//   try {
//     const detalleVenta = await DetalleVenta.findByPk(detalleVentaId);

//     if (!detalleVenta) {
//       return respuesta.error(res, 'Detalle de venta no encontrado', 404);
//     }

//     await detalleVenta.destroy();

//     res.json({ mensaje: 'Detalle de venta eliminado con éxito' });
//   } catch (error) {
//     next(error);
//   }
// };

// export {
//   obtenerDetallesVentas,
//   obtenerDetalleVentaPorId,
//   crearDetalleVenta,
//   actualizarDetalleVenta,
//   eliminarDetalleVenta,
// };

