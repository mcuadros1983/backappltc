import {
  sincronizarSnapshotDiario,
} from "../../inteligencia/inteligenciaSnapshotService.js";


/*
|--------------------------------------------------------------------------
| INTELIGENCIA COMERCIAL - SNAPSHOT DIARIO
|--------------------------------------------------------------------------
*/

const inteligenciaSnapshotDiarioJob =
  async () => {

    console.log(
      "[Inteligencia Comercial] Iniciando snapshot comercial automático..."
    );


    const resultado =
      await sincronizarSnapshotDiario();


    if (resultado.omitido) {

      console.log(
        `[Inteligencia Comercial] Snapshot ${resultado.fecha} ya existente.`
      );

      return resultado;

    }


    console.log(
      `[Inteligencia Comercial] Snapshot ${resultado.fecha} creado correctamente.`
    );


    console.log(
      `[Inteligencia Comercial] Precios: ${resultado.precios_guardados} - Promociones: ${resultado.promociones_guardadas}`
    );


    return resultado;

  };


export default inteligenciaSnapshotDiarioJob;