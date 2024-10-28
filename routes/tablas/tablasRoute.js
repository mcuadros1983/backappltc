// tablasRouter.js
import { Router } from "express";
import multer from "multer"; // Middleware para manejar archivos
import * as tablasController from "../../controllers/tablas/tablasController.js";

const tablasRouter = Router();

// Configuración de multer para manejar la carga de archivos
const upload = multer({ dest: "uploads/" });

// Rutas para obtener las categorías
tablasRouter.get("/obtenercategorias", tablasController.obtenerCategorias);
tablasRouter.post("/crearcategorias", tablasController.crearCategorias);

// Rutas para obtener las categorías
tablasRouter.get(
  "/obtenersubcategorias",
  tablasController.obtenerSubcategorias
);
tablasRouter.post("/crearsubcategorias", tablasController.crearSubcategorias);

// Rutas para obtener las categorías
tablasRouter.get("/obtenerunidadmedida", tablasController.obtenerUnidadMedida);
tablasRouter.post("/crearunidadmedida", tablasController.crearUnidadMedida);

// Rutas para obtener los domicilios
tablasRouter.get("/obtenerdomicilio", tablasController.obtenerDomicilio);
tablasRouter.post("/creardomicilio", tablasController.crearDomicilio);

// Rutas para obtener las categorías
tablasRouter.get("/obtenerusuario", tablasController.obtenerUsuario);
tablasRouter.post("/crearusuario", tablasController.crearUsuario);

// Rutas para obtener las categorías
tablasRouter.get("/obtenergrupo", tablasController.obtenerGrupo);
tablasRouter.post("/creargrupo", tablasController.crearGrupo);

// Rutas para obtener las categorías
tablasRouter.get(
  "/obtenertarjetadecredito",
  tablasController.obtenerTarjetaDeCredito
);
tablasRouter.post(
  "/creartarjetadecredito",
  tablasController.crearTarjetaDeCredito
);

// Rutas para obtener las sucursales
tablasRouter.get("/obtenersucursales", tablasController.obtenerSucursales);
tablasRouter.post("/crearsucursales", tablasController.crearSucursales);

// Rutas para obtener los precios
tablasRouter.get("/obtenerprecios", tablasController.obtenerPrecios);
tablasRouter.post("/crearprecios", tablasController.crearPrecios);

// Rutas para obtener los artículos
tablasRouter.get("/obtenerarticulos", tablasController.obtenerArticulos);
tablasRouter.get(
  "/obtenerarticulos/:codigoBarra",
  tablasController.obtenerArticuloPorCodigoBarra
);
tablasRouter.post("/creararticulos", tablasController.crearArticulos);

// Rutas para los precios de los artículos
tablasRouter.get(
  "/obtenerarticulosprecios",
  tablasController.obtenerArticulosPrecios
);
tablasRouter.post(
  "/creararticulosprecios",
  tablasController.crearArticulosPrecios
);
tablasRouter.post(
  "/actualizarprecios",
  upload.single("file"),
  tablasController.actualizarPreciosDesdeExcel
);

// Rutas para obtener los clientes
tablasRouter.get(
  "/obtenerclientestabla",
  tablasController.obtenerClientesTabla
);
tablasRouter.post("/crearclientestabla", tablasController.crearClientesTabla);

// Rutas para obtener los clientes persona
tablasRouter.get(
  "/obtenerclientespersonatabla",
  tablasController.obtenerClientesPersonaTabla
);

tablasRouter.get(
  "/clientespersonatabla/:numero",
  tablasController.buscarClienteTablaPorNumero
);

tablasRouter.post(
  "/crearclientespersonatabla",
  tablasController.crearClientesPersonaTabla
);

// Rutas para obtener los empleados
tablasRouter.get("/obtenerempleados", tablasController.obtenerEmpleados);
tablasRouter.post("/crearempleados", tablasController.crearEmpleados);

// Rutas para obtener los planes de tarjeta
tablasRouter.get("/obtenerplantarjeta", tablasController.obtenerPlanTarjeta);
tablasRouter.post("/crearplantarjeta", tablasController.crearPlanTarjeta);

// Rutas para obtener los tipos de gasto
tablasRouter.get("/obtenertipogasto", tablasController.obtenerTipoGasto);
tablasRouter.post("/creartipogasto", tablasController.crearTipoGasto);

// Rutas para obtener los tipos de ingreso
tablasRouter.get("/obtenertipoingreso", tablasController.obtenerTipoIngreso);
tablasRouter.post("/creartipoingreso", tablasController.crearTipoIngreso);

tablasRouter.post(
  "/creararticulosporcentaje",
  tablasController.crearArticulosPorcentaje
);
tablasRouter.get(
  "/obtenerarticulosporcentaje",
  tablasController.obtenerArticulosPorcentaje
);
tablasRouter.delete(
  "/eliminararticulosporcentaje",
  tablasController.eliminarArticuloPorcentaje
);
tablasRouter.put(
  "/editararticulosporcentaje",
  tablasController.editarArticuloPorcentaje
);
tablasRouter.post(
  "/actualizararticulosporcentaje",
  upload.single("file"),
  tablasController.actualizarArticulosPorcentajeDesdeExcel
);
export default tablasRouter;
