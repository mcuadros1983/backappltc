import { Router } from 'express';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import Empresa from '../../models/comun/empresa.js';
import Proveedor from '../../models/comun/proveedor.js';
import TipoComprobante from '../../models/comun/tipocomprobante.js';
import PtoVenta from '../../models/comun/ptoventa.js';
import ComprobanteEgreso from '../../models/iva/comprobanteegreso.js';
import { ArcaConsultaRecibidos as Consulta, ArcaMapaConciliacion as Mapa } from '../../models/arca/arcaConsultaRecibidos.js';
import { authorize } from '../../middleware/authorize.js';
import { crearPortalCliente, PortalError } from '../../services/arca/conciliacion/portalCliente.js';
import { documento } from '../../services/arca/conciliacion/normalizar.js';
import { cotejar, normalizarERP } from '../../services/arca/conciliacion/cotejar.js';
const permitidas = new Set(['30708490004', '20246050822', '30707719547']);
class InputError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
function fechas(desde, hasta) { for (const d of [desde, hasta]) { if (!/^\d{4}-\d{2}-\d{2}$/.test(d ?? '') || !Number.isFinite(Date.parse(d)) || new Date(d).toISOString().slice(0, 10) !== d) throw new InputError('Fechas inválidas'); } const dias = (Date.parse(hasta) - Date.parse(desde)) / 86400000; if (dias < 0 || dias > 364) throw new InputError('Elegí un rango de hasta 365 días'); const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const val = t => hoy.find(p => p.type === t).value; const local = `${val('year')}-${val('month')}-${val('day')}`; if (hasta >= local) throw new InputError('ARCA informa hasta ayer: seleccioná una fecha anterior a hoy'); }
async function empresa(id) { if (!/^\d+$/.test(String(id))) throw new InputError('Empresa inválida'); const e = await Empresa.findByPk(id); if (!e || !permitidas.has(documento(e.cuit))) throw new InputError('Empresa no habilitada para esta conciliación'); return e; }
function resumen(q) { const { comprobantes, ...s } = q.toJSON(); return s; }
const handle = fn => async (req, res) => { try { await fn(req, res); } catch (e) { res.status(e instanceof InputError ? e.status : 500).json({ error: e instanceof InputError ? e.message : 'No se pudo completar la conciliación. Revisá la configuración y la base de datos.' }); } };

async function ejecutar(q) {
    let etapa = "Acceder a ARCA y recuperar comprobantes";

    try {
        const rows = await crearPortalCliente().recibidos(
            q.cuit,
            q.desde,
            q.hasta,
            async (id) => {
                etapa = "Guardar identificador de consulta ARCA";

                await q.update({
                    consulta_arca: id,
                });

                etapa = "Recuperar e interpretar resultados ARCA";
            }
        );

        etapa = "Guardar comprobantes en PostgreSQL";

        await q.update({
            estado: "completa",
            comprobantes: rows,
            cantidad: rows.length,
            completada_at: new Date(),
        });
    } catch (e) {
        // Registrar únicamente información del error.
        // No imprimir solicitudes, cookies ni credenciales.
        console.error("[ARCA CONCILIACION]", {
            consulta: q.id,
            empresa: q.empresa_id,
            etapa,
            nombre: e.name,
            mensaje: e.message,
            codigoDB: e.original?.code,
        });

        const mensaje =
            e instanceof PortalError ||
                e.code === "ARCA_ESTRUCTURA_CAMBIADA"
                ? e.message
                : `Error en la etapa: ${etapa}. Revisar consola del backend.`;

        await q.update({
            estado: "error",
            error: mensaje,
        }).catch((errorGuardado) => {
            console.error("[ARCA GUARDAR ERROR]", {
                nombre: errorGuardado.name,
                mensaje: errorGuardado.message,
                codigoDB: errorGuardado.original?.code,
            });
        });
    }
}
const r = Router(); r.use((req, res, next) => { res.set('Cache-Control', 'no-store'); if (!req.user?.id) return res.status(401).json({ error: 'Usuario no autorizado' }); next(); });
r.get('/configuracion', authorize('arca.conciliacion.consultar'), handle(async (req, res) => {
    const empresas = (await Empresa.findAll({ raw: true })).filter(e => permitidas.has(documento(e.cuit)));
    const [tipos, puntos, mapas] = await Promise.all([TipoComprobante.findAll({ raw: true }), PtoVenta.findAll({ raw: true }), Mapa.findAll({ raw: true })]); res.json({ empresas, tipos, puntos, mapas });
}));
r.put('/mapas', authorize('arca.conciliacion.configurar'), handle(async (req, res) => {
    const { tipo_id, punto_id } = req.body; const codigo = Number(req.body.codigo); if (!Number.isInteger(codigo) || codigo < 1 || codigo > 99999 || Boolean(tipo_id) === Boolean(punto_id)) throw new InputError('Indicá tipo o punto y un código válido');
    const letra = String(req.body.letra ?? '').trim().toUpperCase(); if (!/^[A-Z]{0,10}$/.test(letra)) throw new InputError('Letra inválida'); if (tipo_id && !await TipoComprobante.findByPk(tipo_id) || punto_id && !await PtoVenta.findByPk(punto_id)) throw new InputError('Registro interno inexistente');
    if (tipo_id && codigo > 999) throw new InputError('Código de tipo inválido');
    const clave = tipo_id ? `tipo:${tipo_id}:${letra}` : `punto:${punto_id}`;
    await Mapa.upsert({ clave, tipo_id: tipo_id ? Number(tipo_id) : null, punto_id: punto_id ? Number(punto_id) : null, letra: tipo_id ? letra : null, codigo }); res.json({ ok: true });
}));
r.post('/empresas/:empresa_id/consultas', authorize('arca.conciliacion.actualizar'), handle(async (req, res) => {
    const e = await empresa(req.params.empresa_id); const { desde, hasta } = req.body; fechas(desde, hasta);
    let nueva; await sequelize.transaction(async transaction => {
        await sequelize.query('SELECT pg_advisory_xact_lock(731944, 1)', { transaction });
        const activa = await Consulta.findOne({ where: { estado: 'en_proceso' }, transaction }); if (activa) throw new InputError(`Hay una descarga en curso (consulta ${activa.id}). No se creó otra.`, 409);
        nueva = await Consulta.create({ empresa_id: e.id, cuit: documento(e.cuit), desde, hasta, estado: 'en_proceso', usuario_id: req.user.id }, { transaction });
    }); res.status(202).json(resumen(nueva)); void ejecutar(nueva);
}));
r.get('/empresas/:empresa_id/consultas', authorize('arca.conciliacion.consultar'), handle(async (req, res) => {
    const e = await empresa(req.params.empresa_id); res.json(await Consulta.findAll({ where: { empresa_id: e.id }, attributes: { exclude: ['comprobantes'] }, order: [['id', 'DESC']], limit: 30 }));
}));
r.get('/empresas/:empresa_id/consultas/:id', authorize('arca.conciliacion.consultar'), handle(async (req, res) => {
    const e = await empresa(req.params.empresa_id), q = await Consulta.findOne({ where: { id: req.params.id, empresa_id: e.id } }); if (!q) throw new InputError('Consulta inexistente', 404); res.json(resumen(q));
}));
r.post('/empresas/:empresa_id/consultas/:id/interrumpir', authorize('arca.conciliacion.configurar'), handle(async (req, res) => {
    const e = await empresa(req.params.empresa_id), q = await Consulta.findOne({ where: { id: req.params.id, empresa_id: e.id } }); if (!q) throw new InputError('Consulta inexistente', 404);
    if (q.estado !== 'en_proceso' || Date.now() - new Date(q.createdAt).getTime() < 15 * 60000) throw new InputError('Sólo se pueden liberar consultas interrumpidas hace más de 15 minutos');
    await q.update({ estado: 'error', error: 'Liberada manualmente después de una interrupción. Revisar ID en historial ARCA antes de repetir.' }); res.json(resumen(q));
}));
r.get('/empresas/:empresa_id/conciliar', authorize('arca.conciliacion.consultar'), handle(async (req, res) => {
    const e = await empresa(req.params.empresa_id); const { desde, hasta } = req.query; fechas(desde, hasta);
    const q = await Consulta.findOne({ where: { empresa_id: e.id, cuit: documento(e.cuit), estado: 'completa', desde: { [Op.lte]: desde }, hasta: { [Op.gte]: hasta } }, order: [['id', 'DESC']] }); if (!q) throw new InputError('No hay una descarga completa que cubra ese período. Actualizá desde ARCA.', 409);
    const [comp, prov, tipos, puntos, mapas] = await Promise.all([ComprobanteEgreso.findAll({ where: { empresa_id: e.id, fechacomprobante: { [Op.between]: [desde, hasta] } }, raw: true }), Proveedor.findAll({ raw: true }), TipoComprobante.findAll({ raw: true }), PtoVenta.findAll({ raw: true }), Mapa.findAll({ raw: true })]);
    const arca = q.comprobantes.filter(a => a.fecha >= desde && a.fecha <= hasta); const erp = comp.filter(c => c.conFactura !== false).map(c => normalizarERP(c, prov, tipos, puntos, mapas));
    const filas = cotejar(arca, erp); const conteos = {}; filas.forEach(f => conteos[f.estado] = (conteos[f.estado] ?? 0) + 1);
    const search = String(req.query.buscar ?? '').toLowerCase(); const filtered = filas.filter(f => (!req.query.estado || f.estado === req.query.estado) && (!search || JSON.stringify([f.arca, f.erp]).toLowerCase().includes(search)));
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1), limite = 50; res.json({ consulta: resumen(q), conteos, excluidos_sin_factura: comp.filter(c => c.conFactura === false).length, total: filtered.length, pagina, limite, filas: filtered.slice((pagina - 1) * limite, pagina * limite) });
}));
export default r;
