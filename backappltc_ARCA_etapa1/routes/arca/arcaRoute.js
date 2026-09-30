import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import { createArcaController } from "../../controllers/arca/arcaController.js";

export function createArcaRouter(service) {
  const router = Router();
  const controller = createArcaController(service);
  // Defensa adicional: estas rutas también se montan después de JWTAuth.
  router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!req.user?.id) return res.status(401).json({ message: "Usuario no autorizado" });
    next();
  });
  router.get("/estado", authorize("arca.consultar"), controller.dummy);
  router.get("/empresas/:empresa_id/configuracion/:ambiente", authorize("arca.configurar"), controller.configuracion);
  router.put("/empresas/:empresa_id/configuracion/:ambiente", authorize("arca.configurar"), controller.guardarConfiguracion);
  router.post("/empresas/:empresa_id/autenticacion", authorize("arca.consultar"), controller.autenticar);
  router.get("/empresas/:empresa_id/puntos-venta", authorize("arca.consultar"), controller.puntosVenta);
  router.get("/empresas/:empresa_id/localidades", authorize("arca.consultar"), controller.localidades);
  router.get("/empresas/:empresa_id/categorias-por-motivo", authorize("arca.consultar"), controller.categoriasPorMotivo);
  router.get("/empresas/:empresa_id/catalogos/:catalogo", authorize("arca.consultar"), controller.catalogo);
  router.get("/empresas/:empresa_id/ultimo-comprobante", authorize("arca.consultar"), controller.ultimoComprobante);
  return router;
}

export default createArcaRouter();
