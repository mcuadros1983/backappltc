import { documento, numero, centavos, identidad } from './normalizar.js';
// No inferir códigos fiscales a partir de IDs o descripciones internas.
export function normalizarERP(c, proveedores, tipos, puntos, mapas) {
  const proveedor = proveedores.find(p => p.id === c.proveedor_id);
  const letra = String(c.letra ?? '').trim().toUpperCase();
  const map = mapas.find(m => m.tipo_id != null && m.tipo_id === c.tipocomprobante_id && m.letra === letra);
  const pto = mapas.find(m => m.punto_id != null && m.punto_id === c.ptoventa_id);
  const raw = String(c.nrocomprobante ?? '').trim();
  const compuesto = raw.match(/^(\d{1,5})\s*[-/]\s*(\d{1,20})$/);
  const solo = numero(raw);
  const punto = compuesto ? numero(compuesto[1]) : pto ? numero(pto.codigo) : null;
  const nro = compuesto ? numero(compuesto[2]) : solo;
  const motivos = [];
  const cuit = documento(proveedor?.cuit);
  if (cuit.length !== 11) motivos.push('Proveedor sin CUIT válido');
  if (!map) motivos.push('Tipo y letra sin correspondencia ARCA');
  if (!punto || !nro) motivos.push('Numeración o punto de venta sin identificar');
  if (compuesto && pto && numero(pto.codigo) !== punto) motivos.push('Punto de venta inconsistente con el número');
  return { id:c.id, fecha:c.fechacomprobante, emisor_tipo:'80',emisor_documento:cuit,emisor_nombre:proveedor?.nombre ?? '',tipo:map ? numero(map.codigo) : null,punto_venta:punto,numero_desde:nro,numero_hasta:nro,total:String(c.total),neto:c.neto,iva105:c.iva105,iva21:c.iva21,iva_especial:c.iva_especial,iva_especial_porcentaje:c.iva_especial_porcentaje,exento_no_gravado:c.exento_no_gravado,percepcion_iva:c.percepcion_iva,percepcion_ganancias:c.percepcion_ganancias,percepcion_iibb:c.percepcion_iibb,impuestos_internos:c.impuestos_internos,conFactura:c.conFactura,motivos,fuente:c };
}
const abs = n => n < 0n ? -n : n;
export function cotejar(arca, erp, tolerancia = 1n) {
  const groups = new Map();
  for (const row of erp.filter(r => !r.motivos.length)) {
    const key = identidad(row); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row);
  }
  const usados = new Set(); const salida = [];
  for (const a of arca) {
    const exactos = groups.get(identidad(a)) ?? [];
    if (exactos.length > 1) {
      exactos.forEach(e=>usados.add(e.id));
      salida.push({estado:'duplicado_erp',arca:a,erp:exactos,diferencias:['Varias cargas con la misma identificación']});continue;
    }
    if (exactos.length === 1) {
      const e = exactos[0]; usados.add(e.id); const diferencias=[]; const noComparados=[];
      const x=centavos(a.total), y=centavos(e.total);
      const credit=['3','8','13','53','203','208','213'].includes(a.tipo);
      if(x===null||y===null) noComparados.push('total');
      else if(abs((credit?abs(x):x)-(credit?abs(y):y))>tolerancia) diferencias.push(`Total: ARCA ${a.total} / ERP ${e.total}`);
      const observaciones=a.fecha!==e.fecha?[`Fecha distinta: ARCA ${a.fecha} / ERP ${e.fecha}`]:[];
      salida.push({estado:diferencias.length?'diferencia':'coincide',arca:a,erp:[e],diferencias,noComparados,observaciones});continue;
    }
    // Sugerencias no consumen candidatos: nunca resolver una ambigüedad por importe.
    const candidatos = erp.filter(e => e.emisor_documento === a.emisor_documento && (e.tipo == null || e.tipo === a.tipo) && (e.numero_desde === a.numero_desde || centavos(e.total) === centavos(a.total)));
    salida.push({estado:candidatos.length?'posible_coincidencia':'solo_arca',arca:a,erp:candidatos,diferencias:candidatos.length?['Revisar identidad; no se vinculó automáticamente']:[]});
  }
  for(const e of erp) if(!usados.has(e.id)) {
    const repetidos=e.motivos.length?[]:(groups.get(identidad(e))??[]);
    if(repetidos.length>1){repetidos.forEach(x=>usados.add(x.id));salida.push({estado:'duplicado_erp',arca:null,erp:repetidos,diferencias:['Identificación repetida en ERP, sin coincidencia en ARCA']});}
    else salida.push({estado:e.motivos.length?'datos_incompletos':'solo_erp',arca:null,erp:[e],diferencias:e.motivos});
  }
  return salida.map(r=>({...r,erp:r.erp.map(({fuente,...e})=>e)}));
}
