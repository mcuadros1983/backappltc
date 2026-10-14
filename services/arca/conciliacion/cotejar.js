import {
  documento,
  numero,
  centavos,
  identidad,
} from "./normalizar.js";

export function normalizarERP(
  c,
  proveedores,
  tipos,
  puntos,
  mapas
) {
  const proveedor = proveedores.find(
    (p) => p.id === c.proveedor_id
  );

  const letra = String(c.letra ?? "")
    .trim()
    .toUpperCase();

  const map = mapas.find(
    (m) =>
      m.tipo_id != null &&
      m.tipo_id === c.tipocomprobante_id &&
      m.letra === letra
  );

  const pto = mapas.find(
    (m) =>
      m.punto_id != null &&
      m.punto_id === c.ptoventa_id
  );

  const raw = String(c.nrocomprobante ?? "").trim();

  // Admite tanto "11478" como "00008-00011478".
  const compuesto = raw.match(
    /^(\d{1,5})\s*[-/]\s*(\d{1,20})$/
  );

  const punto = compuesto
    ? numero(compuesto[1])
    : pto
      ? numero(pto.codigo)
      : null;

  const nro = compuesto
    ? numero(compuesto[2])
    : numero(raw);

  const motivos = [];
  const cuit = documento(proveedor?.cuit);

  if (cuit.length !== 11) {
    motivos.push("Proveedor sin CUIT válido");
  }

  if (!nro) {
    motivos.push("Número de comprobante sin identificar");
  }

  if (centavos(c.total) === null) {
    motivos.push("Total sin informar");
  }

  // Tipo y punto de venta son opcionales para este cotejo.
  return {
    id: c.id,
    fecha: c.fechacomprobante,
    emisor_tipo: "80",
    emisor_documento: cuit,
    emisor_nombre: proveedor?.nombre ?? "",
    tipo: map ? numero(map.codigo) : null,
    punto_venta: punto,
    numero_desde: nro,
    numero_hasta: nro,
    total: String(c.total),

    neto: c.neto,
    iva105: c.iva105,
    iva21: c.iva21,
    iva_especial: c.iva_especial,
    iva_especial_porcentaje: c.iva_especial_porcentaje,
    exento_no_gravado: c.exento_no_gravado,
    percepcion_iva: c.percepcion_iva,
    percepcion_ganancias: c.percepcion_ganancias,
    percepcion_iibb: c.percepcion_iibb,
    impuestos_internos: c.impuestos_internos,

    conFactura: c.conFactura,
    motivos,
    fuente: c,
  };
}

const abs = (n) => (n < 0n ? -n : n);

export function cotejar(arca, erp, tolerancia = 1n) {
  const groups = new Map();

  for (const row of erp.filter((r) => !r.motivos.length)) {
    const key = identidad(row);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(row);
  }

  const usados = new Set();
  const salida = [];

  // Vincula por CUIT y número, sin exigir punto de venta.
  // Si hay un tipo fiscal configurado, debe ser compatible.
  const compatible = (a, e) =>
    a.emisor_documento === e.emisor_documento &&
    a.numero_desde === e.numero_desde &&
    (e.tipo == null || a.tipo === e.tipo);

  for (const a of arca) {
    const candidatosNumero = erp.filter(
      (e) =>
        !e.motivos.length &&
        compatible(a, e)
    );

    // No vincular automáticamente cuando el mismo registro ERP
    // puede corresponder a varios comprobantes de ARCA.
    const exactos = candidatosNumero.filter(
      (e) =>
        arca.filter((x) => compatible(x, e)).length === 1 &&
        !usados.has(e.id)
    );

    if (exactos.length > 1) {
      exactos.forEach((e) => usados.add(e.id));

      salida.push({
        estado: "duplicado_erp",
        arca: a,
        erp: exactos,
        diferencias: [
          "Varias cargas con la misma identificación",
        ],
      });

      continue;
    }

    if (exactos.length === 1) {
      const e = exactos[0];
      usados.add(e.id);

      const diferencias = [];
      const noComparados = [];

      const totalArca = centavos(a.total);
      const totalERP = centavos(e.total);

      const esNotaCredito = [
        "3",
        "8",
        "13",
        "53",
        "203",
        "208",
        "213",
      ].includes(a.tipo);

      if (totalArca === null || totalERP === null) {
        noComparados.push("total");
      } else {
        // Las notas de crédito pueden estar guardadas
        // con signo negativo en el ERP.
        const importeArca = esNotaCredito
          ? abs(totalArca)
          : totalArca;

        const importeERP = esNotaCredito
          ? abs(totalERP)
          : totalERP;

        if (abs(importeArca - importeERP) > tolerancia) {
          diferencias.push(
            `Total: ARCA ${a.total} / ERP ${e.total}`
          );
        }
      }

      const observaciones = [];

      if (a.fecha !== e.fecha) {
        observaciones.push(
          `Fecha distinta: ARCA ${a.fecha} / ERP ${e.fecha}`
        );
      }

      if (e.tipo == null) {
        observaciones.push(
          "Tipo ARCA sin correspondencia; cotejo por CUIT y número"
        );
      }

      if (e.punto_venta !== a.punto_venta) {
        observaciones.push(
          "Punto de venta no utilizado en este cotejo"
        );
      }

      salida.push({
        estado: diferencias.length ? "diferencia" : "coincide",
        arca: a,
        erp: [e],
        diferencias,
        noComparados,
        observaciones,
      });

      continue;
    }

    // Las sugerencias requieren revisión y no consumen registros.
    const candidatos = erp.filter(
      (e) =>
        !usados.has(e.id) &&
        e.emisor_documento === a.emisor_documento &&
        (e.tipo == null || e.tipo === a.tipo) &&
        (
          e.numero_desde === a.numero_desde ||
          centavos(e.total) === centavos(a.total)
        )
    );

    salida.push({
      estado: candidatos.length
        ? "posible_coincidencia"
        : "solo_arca",
      arca: a,
      erp: candidatos,
      diferencias: candidatos.length
        ? ["Revisar identidad; no se vinculó automáticamente"]
        : [],
    });
  }

  for (const e of erp) {
    if (usados.has(e.id)) {
      continue;
    }

    const repetidos = e.motivos.length
      ? []
      : groups.get(identidad(e)) ?? [];

    if (repetidos.length > 1) {
      repetidos.forEach((x) => usados.add(x.id));

      salida.push({
        estado: "duplicado_erp",
        arca: null,
        erp: repetidos,
        diferencias: [
          "Identificación repetida en ERP, sin coincidencia en ARCA",
        ],
      });
    } else {
      salida.push({
        estado: e.motivos.length
          ? "datos_incompletos"
          : "solo_erp",
        arca: null,
        erp: [e],
        diferencias: e.motivos,
      });
    }
  }

  return salida.map((r) => ({
    ...r,
    erp: r.erp.map(({ fuente, ...e }) => e),
  }));
}