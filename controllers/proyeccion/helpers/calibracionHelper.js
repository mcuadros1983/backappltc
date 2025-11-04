import { Op } from "sequelize";
import VentaTotal from "../../models/VentaTotal.js";
import { obtenerVentasFiltradasLikeController } from "./helpers/ventasRealHelper.js";
// ↑ explicación abajo

// Cantidad de días históricos que usamos para calibrar
const DIAS_CALIBRACION = 14;

/**
 * Devuelve un factor numérico para escalar la predicción base del modelo
 * a la realidad reciente de esa sucursal.
 *
 * Ej:
 *   promedioReal = 7.7M
 *   promedioModelo = 2.8M
 *   => factor ≈ 2.75
 *
 * Si por algún motivo no se puede calcular, devolvemos 1.
 */
async function calcularFactorCalibracionSucursal({
  sucursalId,
  pedirProyeccionBaseAlMicroservicio,
}) {
  try {
    // 1) Definimos el rango de calibración: últimos DIAS_CALIBRACION días hábiles con venta real.
    //    Vamos a tomar "hoy - n días" a "ayer".
    const hoy = new Date();
    const desdeDate = new Date(hoy);
    desdeDate.setDate(desdeDate.getDate() - DIAS_CALIBRACION - 1); // un poco más por si hubo días sin venta
    const hastaDate = new Date(hoy);
    hastaDate.setDate(hastaDate.getDate() - 1); // hasta ayer

    const fechaDesde = desdeDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const fechaHasta = hastaDate.toISOString().slice(0, 10);

    // 2) Traemos ventas reales diarias para esa sucursal en ese rango,
    //    aplicando la misma lógica que usás para obtener ventas netas:
    //
    //    - agrupar por fecha,sucursal
    //    - restar artículos que no querés contar
    //    - sumar montos
    //
    //    Ya tenés esa lógica en obtenerVentasFiltradas del controller de ventas.
    //    Yo asumo que armamos un helper obtenerVentasFiltradasLikeController(req)
    //    que devuelve un array [{ fecha, sucursal_id, monto }, ...]
    //
    const ventasHistoricasArray = await obtenerVentasFiltradasLikeController({
      fechaDesde,
      fechaHasta,
      sucursalId,
    });

    // Nos quedamos sólo con esa sucursal y sólo días con monto > 0
    const ventasUtiles = ventasHistoricasArray
      .filter((v) => Number(v.sucursal_id) === Number(sucursalId))
      .filter((v) => Number(v.monto) > 0);

    if (ventasUtiles.length === 0) {
      console.log(
        `[CALIBRACION] Sucursal ${sucursalId}: no hay ventas reales recientes, factor=1`
      );
      return 1;
    }

    // 3) De esos mismos días armamos un CSV futuro "falso"
    //    (mismo formato que le mandamos a /proyectar/ normalmente),
    //    para preguntarle al microservicio:
    //    "qué hubieras predicho para estos días?"
    //
    //    OJO: el microservicio espera columnas como: fecha, sucursal_id, ...
    //    usamos las mismas fechas exactas.
    const filasParaProyectar = ventasUtiles.map((row) => ({
      fecha: row.fecha, // YYYY-MM-DD
      sucursal_id: row.sucursal_id,
    }));

    // 4) Le pedimos la proyección base al microservicio para ESOS días
    //    Esta función la tenés ya en tu controller para el rango futuro,
    //    acá la reutilizamos.
    const proyeccionesPasadas = await pedirProyeccionBaseAlMicroservicio(
      filasParaProyectar
    );
    // esto nos devuelve algo tipo:
    // [{ fecha: "2024-10-01", sucursal_id: 23, proyeccion: 2825011 }, ...]

    // 5) Ahora alineamos por fecha y calculamos promedios:
    //    promedio venta real vs promedio modelo
    let sumaReal = 0;
    let sumaModelo = 0;
    let conteo = 0;

    for (const ventaDia of ventasUtiles) {
      const match = proyeccionesPasadas.find(
        (p) =>
          String(p.fecha) === String(ventaDia.fecha) &&
          Number(p.sucursal_id) === Number(ventaDia.sucursal_id)
      );

      if (match && Number(match.proyeccion) > 0) {
        sumaReal += Number(ventaDia.monto);
        sumaModelo += Number(match.proyeccion);
        conteo += 1;
      }
    }

    if (conteo === 0) {
      console.log(
        `[CALIBRACION] Sucursal ${sucursalId}: no hubo cruces válidos, factor=1`
      );
      return 1;
    }

    const promedioReal = sumaReal / conteo;
    const promedioModelo = sumaModelo / conteo;

    if (promedioModelo <= 0) {
      console.log(
        `[CALIBRACION] Sucursal ${sucursalId}: promedioModelo <=0, factor=1`
      );
      return 1;
    }

    const factor = promedioReal / promedioModelo;

    console.log(
      `[CALIBRACION] Sucursal ${sucursalId}: promedioReal=${promedioReal.toFixed(
        2
      )} promedioModelo=${promedioModelo.toFixed(
        2
      )} => factor=${factor.toFixed(3)}`
    );

    return factor;
  } catch (err) {
    console.error(
      `[CALIBRACION] Error calculando factor sucursal ${sucursalId}:`,
      err
    );
    return 1;
  }
}
