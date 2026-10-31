export const documento = value => String(value ?? '').replace(/\D/g, '');
export const numero = value => /^\d+$/.test(String(value ?? '').trim()) ? BigInt(String(value).trim()).toString() : null;
export function decimal(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) throw new Error('Importe inválido en respuesta ARCA');
  return text;
}
export function centavos(value) {
  const text = decimal(value);
  if (text === null) return null;
  const negative = text.startsWith('-');
  const [integer, fraction = ''] = text.replace(/^-/, '').split('.');
  const result = BigInt(integer) * 100n + BigInt((fraction + '00').slice(0, 2));
  return negative ? -result : result;
}
export function normalizarFila(
  fila,
  cuit,
  desde,
  hasta,
  { cuitConsultaVerificado = null } = {}
) {


  if (!Array.isArray(fila) || fila.length !== 52) {
    const error = new Error(
      "La estructura de los comprobantes devueltos por ARCA cambió. " +
      "Contactá al programador para actualizar la integración."
    );

    error.code = "ARCA_ESTRUCTURA_CAMBIADA";

    throw error;
  }

  const [d, m, y] = String(fila[0]).split("/");
  const fecha = `${y}-${m}-${d}`;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error(
      `Formato de fecha ARCA inesperado: ${String(fila[0])}`
    );
  }

  if (fecha < desde || fecha > hasta) {
    throw new Error(
      `Fecha fuera del período: ${fecha}. ` +
      `Período solicitado: ${desde} a ${hasta}`
    );
  }
  const receptor = documento(fila[15]);
  const cuitEsperado = documento(cuit);
  const tipoDocumentoReceptor = numero(fila[14]);

  const documentosPersonales = {
    "20246050822": "24605082",
  };

  const coincideCUIT =
    receptor === cuitEsperado;

  const coincideDocumentoPersonal =
    tipoDocumentoReceptor === "96" &&
    documentosPersonales[cuitEsperado] !== undefined &&
    numero(receptor) === numero(documentosPersonales[cuitEsperado]);

  // Admitir ausencia de ambos campos únicamente cuando
  // el servidor verificó el CUIT de la consulta devuelta por ARCA.
  const receptorNoInformado =
    receptor === "" &&
    String(fila[14] ?? "").trim() === "";

  const perteneceAConsultaVerificada =
    cuitEsperado.length === 11 &&
    documento(cuitConsultaVerificado) === cuitEsperado;

  const admitirSinReceptor =
    receptorNoInformado &&
    perteneceAConsultaVerificada;

  if (
    !coincideCUIT &&
    !coincideDocumentoPersonal &&
    !admitirSinReceptor
  ) {
    throw new Error(
      `Documento receptor diferente o sin verificar. ` +
      `Tipo documento ARCA: ${tipoDocumentoReceptor}. ` +
      `Número receptor ARCA: ${receptor || "vacío"}. ` +
      `CUIT solicitado: ${cuitEsperado}`
    );
  }

  const result = {
    fecha,
    tipo: numero(fila[1]),
    punto_venta: numero(fila[3]),
    numero_desde: numero(fila[4]),
    numero_hasta: numero(fila[5]),
    autorizacion: String(fila[8] ?? ""),
    emisor_tipo: numero(fila[10]),
    emisor_documento: documento(fila[11]),
    emisor_nombre: String(fila[12] ?? ""),

    // Conservar el documento original informado por ARCA.
    receptor_documento: receptor,

    moneda: String(fila[17] ?? ""),
    tipo_cambio: decimal(fila[16]),
  };

  result.receptor_validacion = admitirSinReceptor
    ? "CUIT confirmado por los filtros de la consulta; receptor no informado"
    : "Documento receptor verificado";

  const columnasImportes = {
    neto0: 18,
    iva25: 20,
    neto25: 22,
    iva5: 24,
    neto5: 26,
    iva105: 28,
    neto105: 30,
    iva21: 32,
    neto21: 34,
    iva27: 36,
    neto27: 38,
    neto: 40,
    no_gravado: 42,
    exento: 44,
    otros_tributos: 46,
    iva_total: 48,
    total: 50,
  };

  for (const [nombre, indice] of Object.entries(columnasImportes)) {
    result[nombre] = decimal(fila[indice]);
  }

  if (
    !result.tipo ||
    !result.punto_venta ||
    !result.numero_desde ||
    !result.numero_hasta ||
    !result.emisor_documento ||
    result.total === null
  ) {
    throw new Error("Comprobante ARCA incompleto");
  }

  return result;
}
export function identidad(r) { return [r.emisor_tipo, r.emisor_documento, r.tipo, r.punto_venta, r.numero_desde, r.numero_hasta].join('|'); }
