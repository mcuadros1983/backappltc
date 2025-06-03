import { Router } from 'express';
import * as ventasRindeController from '../../controllers/rinde/ventasRindeController.js';

const ventasRindeRouter = Router();

// Rutas para ventas
ventasRindeRouter.get('/ventas/totales', ventasRindeController.obtenerVentasTotales); 
ventasRindeRouter.post('/ventas/filtradas', ventasRindeController.obtenerVentasFiltradas);
ventasRindeRouter.post('/ventas/totales', ventasRindeController.crearVentaTotal); // ruta crear VentasTotales
ventasRindeRouter.get('/ventas/anuladas', ventasRindeController.obtenerVentasAnuladas);
ventasRindeRouter.post('/ventas/anuladasfiltradas', ventasRindeController.obtenerVentasAnuladasFiltradas);
ventasRindeRouter.post('/ventas/anuladas', ventasRindeController.crearVentasAnuladas);
ventasRindeRouter.get('/ventas/con_descuento', ventasRindeController.obtenerVentasConDescuento);
ventasRindeRouter.post('/ventas/con_descuento_filtradas', ventasRindeController.obtenerVentasConDescuentoFiltradas);
ventasRindeRouter.post('/ventas/con_descuento', ventasRindeController.crearVentasConDescuento);
ventasRindeRouter.get('/ventas/por_cliente', ventasRindeController.obtenerVentasPorCliente);
ventasRindeRouter.post('/ventas/por_cliente_filtradas', ventasRindeController.obtenerVentasPorClienteFiltradas);
ventasRindeRouter.post('/ventas/por_cliente', ventasRindeController.crearVentasPorCliente);
ventasRindeRouter.get('/ventas/con_articulo', ventasRindeController.obtenerVentasConArticulo);
ventasRindeRouter.post('/ventas/con_articulo_filtradas', ventasRindeController.obtenerVentasConArticuloFiltradas);
ventasRindeRouter.post('/ventas/monto_con_articulo_filtradas', ventasRindeController.obtenerMontoVentasConArticuloFiltradas); // `${apiUrl}/ventas/monto_con_articulo_filtradas`, ventas para rinde
ventasRindeRouter.post('/ventas/con_articulo', ventasRindeController.crearVentasConArticulo);
ventasRindeRouter.post('/ventas/con_articulo_por_usuario', ventasRindeController.crearVentasPorUsuario);
ventasRindeRouter.post('/ventas/con_articulo_kg_por_usuario', ventasRindeController.crearVentasArticulosKgPorUsuario);
ventasRindeRouter.post('/ventas/con_cantidad-ticket-usuario', ventasRindeController.crearCantidadTicketPorUsuario);
ventasRindeRouter.post('/ventas/por_usuario_filtradas', ventasRindeController.obtenerVentasPorUsuarioFiltradas);
ventasRindeRouter.post('/ventas/kg_por_usuario_filtradas', ventasRindeController.obtenerKgPorUsuarioFiltradas);
ventasRindeRouter.post('/ventas/kg_por_sucursal_filtradas', ventasRindeController.obtenerKgPorSucursalFiltradas);
ventasRindeRouter.post('/ventas/cantidad_ticket_por_usuario', ventasRindeController.obtenerCantidadTicketPorUsuario);
ventasRindeRouter.post('/ventas/dias-con-ventas', ventasRindeController.obtenerCantidadDiasConVentas);

// ventas/monto_con_articulo_filtradas

export default ventasRindeRouter;

