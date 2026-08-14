import {
    sincronizarHistoricoClima,
} from "../../inteligencia/inteligenciaClimaService.js";


/*
|--------------------------------------------------------------------------
| INTELIGENCIA COMERCIAL - CLIMA DIARIO
|--------------------------------------------------------------------------
*/

const inteligenciaClimaDiarioJob = {

    /*
    |--------------------------------------------------------------------------
    | EXECUTE
    |--------------------------------------------------------------------------
    |
    | schedulerExecutor espera que cada job registrado
    | implemente el método execute().
    |
    |--------------------------------------------------------------------------
    */

    execute: async (
        contexto = {}
    ) => {

        console.log(
            "[Inteligencia Comercial] Sincronizando histórico climático..."
        );


        const resultado =
            await sincronizarHistoricoClima();


        console.log(
            "[Inteligencia Comercial] Sincronización climática finalizada:",
            resultado
        );


        return resultado;

    },

};


export default inteligenciaClimaDiarioJob;


