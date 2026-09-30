import Empresa from "../../models/comun/empresa.js";
import ArcaConfiguracion from "../../models/arca/arcaConfiguracion.js";
import { sequelize } from "../../config/database.js";
import { ambienteValido, cargarCredenciales, entero, normalizarCuit, validarConfiguracion } from "./arcaConfig.js";
import { ArcaError } from "./arcaError.js";
import { ticketKey } from "./ticketCrypto.js";
import { createTicketStore } from "./ticketStore.js";
import { createWsaaService } from "./wsaaService.js";
import { createWslspService } from "./wslspService.js";

const wsaa = createWsaaService({ store: createTicketStore() });
const wslsp = createWslspService({ wsaa });

async function empresaExistente(id) {
  const empresa = await Empresa.findByPk(entero(id, "empresa_id"), { attributes: ["id", "descripcion", "cuit"] });
  if (!empresa) throw new ArcaError("EMPRESA_NO_ENCONTRADA", "La empresa no existe.", 404);
  return empresa;
}

async function contexto(id, environment) {
  const ambiente = ambienteValido(environment);
  const empresa = await empresaExistente(id);
  const config = await ArcaConfiguracion.findOne({ where: { empresa_id: empresa.id, ambiente } });
  if (!config || !config.activa) throw new ArcaError("ARCA_NO_CONFIGURADA", "ARCA no está configurada y activa para esta empresa y ambiente.", 409);
  return {
    empresa_id: empresa.id, ambiente, cuit: normalizarCuit(empresa.cuit), config,
    credentials: await cargarCredenciales(config.credenciales_ref),
  };
}

const arcaService = {
  async configuracion(id, environment) {
    const ambiente = ambienteValido(environment);
    const empresa = await empresaExistente(id);
    const config = await ArcaConfiguracion.findOne({ where: { empresa_id: empresa.id, ambiente } });
    return { empresa_id: empresa.id, ambiente, configuracion: config?.toJSON() ?? null };
  },
  async guardarConfiguracion(id, environment, body) {
    const ambiente = ambienteValido(environment);
    const empresa = await empresaExistente(id);
    const data = validarConfiguracion(body);
    if (data.activa) {
      normalizarCuit(empresa.cuit);
      await cargarCredenciales(data.credenciales_ref);
      ticketKey();
    }
    const config = await sequelize.transaction(async transaction => {
      const [record] = await ArcaConfiguracion.findOrCreate({
        where: { empresa_id: empresa.id, ambiente },
        defaults: data,
        transaction,
      });
      return record.update(data, { transaction });
    });
    return { empresa_id: empresa.id, ambiente, configuracion: config.toJSON() };
  },
  async autenticar(id, environment) {
    const ctx = await contexto(id, environment);
    const ticket = await wsaa.getTicket(ctx.ambiente, ctx.credentials);
    // Nunca exponer token, sign, certificado ni clave privada en la respuesta HTTP.
    return {
      empresa_id: ctx.empresa_id,
      ambiente: ctx.ambiente,
      servicio: "wslsp",
      autenticado: true,
      ticket_generado: ticket.generationTime,
      ticket_vencimiento: ticket.expirationTime,
      certificado_vencimiento: ctx.credentials.valido_hasta,
    };
  },
  async dummy(environment) {
    const ambiente = ambienteValido(environment);
    const data = await wslsp.dummy(ambiente);
    return { ambiente, disponible: [data.appserver, data.authserver, data.dbserver].every(value => value === "OK"), data };
  },
  async puntosVenta(id, environment) {
    return wslsp.puntosVenta(await contexto(id, environment));
  },
  async catalogo(id, environment, name) {
    return wslsp.catalogo(await contexto(id, environment), name);
  },
  async localidades(id, environment, provincia) {
    return wslsp.localidades(await contexto(id, environment), provincia);
  },
  async categoriasPorMotivo(id, environment, especie, motivo) {
    return wslsp.categoriasPorMotivo(await contexto(id, environment), especie, motivo);
  },
  async ultimoComprobante(id, environment, puntoVenta, tipoComprobante) {
    const ctx = await contexto(id, environment);
    return wslsp.ultimoComprobante(ctx, puntoVenta ?? ctx.config.punto_venta, tipoComprobante);
  },
};

export default arcaService;
