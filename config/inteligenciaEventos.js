export const INTELIGENCIA_EVENTOS = {

  CALENDARIO: {

    FERIADO: {
      nombre: "Feriado",
      permite_sucursales: true,
      permite_articulos: false,

      campos: [
        {
          nombre: "ambito",
          tipo: "texto",
          requerido: false,
        },
        {
          nombre: "empresa_trabaja",
          tipo: "booleano",
          requerido: false,
        },
        // {
        //   nombre: "automatico",
        //   tipo: "booleano",
        //   requerido: false,
        // },
        // {
        //   nombre: "fuente",
        //   tipo: "texto",
        //   requerido: false,
        // },
        {
          nombre: "tipo_feriado",
          tipo: "texto",
          requerido: false,
        },
        {
          nombre: "fecha_descanso_efectivo",
          tipo: "fecha",
          requerido: false,
        },
      ],
    },

    CELEBRACION: {
      nombre: "Celebración",
      permite_sucursales: true,
      permite_articulos: false,
      campos: [],
    },

    VACACIONES_INVIERNO: {
      nombre: "Vacaciones de invierno",
      permite_sucursales: false,
      permite_articulos: false,
      campos: [
        {
          nombre: "ambito",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    VACACIONES_VERANO: {
      nombre: "Vacaciones de verano",
      permite_sucursales: false,
      permite_articulos: false,
      campos: [
        {
          nombre: "ambito",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    PAGO_ADMIN_PUBLICA: {
      nombre: "Pago Administración Pública",
      permite_sucursales: false,
      permite_articulos: false,
      campos: [
        {
          nombre: "organismo",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    EVENTO_ESPECIAL: {
      nombre: "Evento especial",
      permite_sucursales: true,
      permite_articulos: true,
      campos: [],
    },

  },


  MARKETING: {

    REDES_SOCIALES: {
      nombre: "Redes sociales",
      permite_sucursales: true,
      permite_articulos: true,
      campos: [
        {
          nombre: "plataforma",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    RADIO: {
      nombre: "Publicidad en radio",
      permite_sucursales: true,
      permite_articulos: true,
      campos: [
        {
          nombre: "medio",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    FOLLETOS: {
      nombre: "Entrega de folletos",
      permite_sucursales: true,
      permite_articulos: true,
      campos: [
        {
          nombre: "zona",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    PUBLICIDAD_CALLEJERA: {
      nombre: "Publicidad callejera",
      permite_sucursales: true,
      permite_articulos: true,
      campos: [
        {
          nombre: "zona",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    OTRA_PUBLICIDAD: {
      nombre: "Otra publicidad",
      permite_sucursales: true,
      permite_articulos: true,
      campos: [],
    },

  },


  ACCION_COMERCIAL: {

    DEGUSTACION: {
      nombre: "Degustación",
      permite_sucursales: true,
      requiere_sucursal: true,
      permite_articulos: true,
      campos: [],
    },

    LOCRO: {
      nombre: "Locro / acción gastronómica",
      permite_sucursales: true,
      requiere_sucursal: true,
      permite_articulos: true,
      campos: [],
    },

    EVENTO_SUCURSAL: {
      nombre: "Evento en sucursal",
      permite_sucursales: true,
      requiere_sucursal: true,
      permite_articulos: true,
      campos: [],
    },

    EVENTO_GASTRONOMICO: {
      nombre: "Participación en evento gastronómico",
      permite_sucursales: true,
      permite_articulos: true,
      campos: [
        {
          nombre: "evento",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    OTRA_ACCION: {
      nombre: "Otra acción comercial",
      permite_sucursales: true,
      permite_articulos: true,
      campos: [],
    },

  },


  BENEFICIO: {

    TARJETA: {
      nombre: "Beneficio con tarjeta",
      permite_sucursales: false,
      permite_articulos: true,

      campos: [
        {
          nombre: "tarjeta_id",
          tipo: "tarjeta",
          requerido: true,
        },
        {
          nombre: "plan_id",
          tipo: "plan_tarjeta",
          requerido: false,
        },
        {
          nombre: "porcentaje",
          tipo: "numero",
          requerido: false,
        },
      ],
    },

    JUBILADOS: {
      nombre: "Beneficio jubilados",
      permite_sucursales: false,
      permite_articulos: true,

      campos: [
        {
          nombre: "porcentaje",
          tipo: "numero",
          requerido: false,
        },
      ],
    },

    CUMPLEANOS: {
      nombre: "Beneficio cumpleaños",
      permite_sucursales: false,
      permite_articulos: true,

      campos: [
        {
          nombre: "porcentaje",
          tipo: "numero",
          requerido: false,
        },
      ],
    },

    CONVENIO: {
      nombre: "Convenio",
      permite_sucursales: false,
      permite_articulos: true,

      campos: [
        {
          nombre: "convenio",
          tipo: "texto",
          requerido: true,
        },
        {
          nombre: "porcentaje",
          tipo: "numero",
          requerido: false,
        },
      ],
    },

    OTRO_BENEFICIO: {
      nombre: "Otro beneficio",
      permite_sucursales: false,
      permite_articulos: true,
      campos: [],
    },

  },


  OPERATIVO: {

    APERTURA_SUCURSAL: {
      nombre: "Apertura de sucursal",
      permite_sucursales: true,
      requiere_sucursal: true,
      permite_articulos: false,
      campos: [],
    },

    CIERRE_TEMPORAL: {
      nombre: "Cierre temporal",
      permite_sucursales: true,
      requiere_sucursal: true,
      permite_articulos: false,

      campos: [
        {
          nombre: "motivo",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    CIERRE_DEFINITIVO: {
      nombre: "Cierre definitivo",
      permite_sucursales: true,
      requiere_sucursal: true,
      permite_articulos: false,

      campos: [
        {
          nombre: "motivo",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    REAPERTURA: {
      nombre: "Reapertura",
      permite_sucursales: true,
      requiere_sucursal: true,
      permite_articulos: false,
      campos: [],
    },

    HORARIO_ESPECIAL: {
      nombre: "Horario especial",
      permite_sucursales: true,
      requiere_sucursal: true,
      permite_articulos: false,

      campos: [
        {
          nombre: "hora_desde",
          tipo: "hora",
          requerido: false,
        },
        {
          nombre: "hora_hasta",
          tipo: "hora",
          requerido: false,
        },
        {
          nombre: "motivo",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    INCIDENCIA_OPERATIVA: {
      nombre: "Incidencia operativa",
      permite_sucursales: true,
      requiere_sucursal: true,
      permite_articulos: false,

      campos: [
        {
          nombre: "motivo",
          tipo: "texto",
          requerido: false,
        },
      ],
    },

    CIERRE_FERIADO_COMPENSATORIO: {
      nombre:
        "Cierre por feriado compensatorio",

      permite_sucursales: true,

      /*
      | Si no seleccionamos sucursales,
      | entendemos que afecta a toda la empresa.
      |
      | Por eso NO ponemos:
      |
      | requiere_sucursal: true
      */

      permite_articulos: false,

      campos: [
        {
          nombre:
            "fecha_feriado_original",

          tipo:
            "fecha",

          requerido:
            true,
        },

        {
          nombre:
            "motivo",

          tipo:
            "texto",

          requerido:
            false,
        },
      ],
    },

  },

};

export const obtenerConfiguracionEvento = (
  categoria,
  tipo
) => {

  const categoriaConfig =
    INTELIGENCIA_EVENTOS[categoria];


  if (!categoriaConfig) {
    throw new Error(
      `Categoría de evento inválida: ${categoria}`
    );
  }


  const tipoConfig =
    categoriaConfig[tipo];


  if (!tipoConfig) {
    throw new Error(
      `Tipo de evento inválido para ${categoria}: ${tipo}`
    );
  }


  return tipoConfig;
};


export const validarDatosEvento = ({
  categoria,
  tipo,
  datos = {},
  sucursales_ids = [],
  articulos_ids = [],
}) => {

  const config =
    obtenerConfiguracionEvento(
      categoria,
      tipo
    );

  /*
|--------------------------------------------------------------------------
| REGLAS ESPECÍFICAS - FERIADO
|--------------------------------------------------------------------------
*/

  if (
    categoria === "CALENDARIO" &&
    tipo === "FERIADO"
  ) {

    const empresaTrabaja =
      datos?.empresa_trabaja === true;

    const fechaDescanso =
      datos?.fecha_descanso_efectivo;


    if (
      fechaDescanso &&
      !empresaTrabaja
    ) {

      throw new Error(
        "Solo puede indicarse una fecha de descanso efectivo cuando la empresa trabaja el feriado original"
      );

    }

  }


  /*
  |--------------------------------------------------------------------------
  | SUCURSALES
  |--------------------------------------------------------------------------
  */

  if (
    config.requiere_sucursal &&
    (!Array.isArray(sucursales_ids) ||
      sucursales_ids.length === 0)
  ) {
    throw new Error(
      `El evento ${tipo} requiere al menos una sucursal`
    );
  }


  if (
    config.permite_sucursales === false &&
    Array.isArray(sucursales_ids) &&
    sucursales_ids.length > 0
  ) {
    throw new Error(
      `El evento ${tipo} no permite seleccionar sucursales`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | ARTÍCULOS
  |--------------------------------------------------------------------------
  */

  if (
    config.permite_articulos === false &&
    Array.isArray(articulos_ids) &&
    articulos_ids.length > 0
  ) {
    throw new Error(
      `El evento ${tipo} no permite seleccionar artículos`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | CAMPOS ESPECÍFICOS
  |--------------------------------------------------------------------------
  */

  for (const campo of config.campos || []) {

    if (
      campo.requerido &&
      (
        datos?.[campo.nombre] === undefined ||
        datos?.[campo.nombre] === null ||
        datos?.[campo.nombre] === ""
      )
    ) {
      throw new Error(
        `El campo ${campo.nombre} es obligatorio para ${tipo}`
      );
    }

  }


  /*
  |--------------------------------------------------------------------------
  | EVITAR JSON ARBITRARIO
  |--------------------------------------------------------------------------
  */

  const camposPermitidos =
    new Set(
      (config.campos || []).map(
        (campo) => campo.nombre
      )
    );


  for (const campo of Object.keys(datos || {})) {

    if (!camposPermitidos.has(campo)) {

      throw new Error(
        `El campo ${campo} no está permitido para el evento ${tipo}`
      );

    }

  }


  return config;
};