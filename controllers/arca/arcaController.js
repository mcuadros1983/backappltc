import arcaService from "../../services/arca/arcaService.js";
import { ArcaError } from "../../services/arca/arcaError.js";

export function createArcaController(service = arcaService) {
  function handle(action) {
    return async (req, res) => {
      res.set("Cache-Control", "no-store");
      try {
        return res.json({ ok: true, ...await action(req) });
      } catch (error) {
        if (error instanceof ArcaError) {
          return res.status(error.status).json({ ok: false, error: error.message, codigo: error.code, detalles: error.details });
        }
        // Los errores de Sequelize o del proveedor pueden incluir parámetros sensibles.
        return res.status(500).json({ ok: false, error: "No se pudo completar la operación ARCA.", codigo: "ARCA_INTERNO" });
      }
    };
  }
  const environment = req => req.params.ambiente ?? req.query.ambiente ?? "homologacion";
  const empresa = req => req.params.empresa_id;
  return {
    configuracion: handle(req => service.configuracion(empresa(req), environment(req))),
    guardarConfiguracion: handle(req => service.guardarConfiguracion(empresa(req), environment(req), req.body)),
    autenticar: handle(req => service.autenticar(empresa(req), environment(req))),
    dummy: handle(req => service.dummy(environment(req))),
    puntosVenta: handle(async req => ({ data: await service.puntosVenta(empresa(req), environment(req)) })),
    catalogo: handle(async req => ({ data: await service.catalogo(empresa(req), environment(req), req.params.catalogo) })),
    localidades: handle(async req => ({ data: await service.localidades(empresa(req), environment(req), req.query.provincia) })),
    categoriasPorMotivo: handle(async req => ({ data: await service.categoriasPorMotivo(empresa(req), environment(req), req.query.especie, req.query.motivo) })),
    ultimoComprobante: handle(async req => ({ data: await service.ultimoComprobante(empresa(req), environment(req), req.query.punto_venta, req.query.tipo_comprobante) })),
  };
}
