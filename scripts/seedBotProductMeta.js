import { sequelize } from "../config/database.js";
import "../models/index.js";
import { Op } from "sequelize";
import ArticuloTabla from "../models/tablas/articuloModel.js";
import BotProductMeta from "../models/bot/botProductMetaModel.js";

const METAS = [
  {
    match: ["bola", "nalga", "cuadrada", "peceto"],
    nombre_visible: "Cortes para milanesas",
    descripcion_corta: "Opciones prácticas para milanesas tiernas y rendidoras.",
    platos_recomendados: ["milanesas", "bifes", "napolitanas"],
    metodos_coccion: ["frito", "horno", "plancha"],
    terneza: "alta",
    rendimiento: "alto",
    precio_nivel: "medio",
    recomendacion_comercial: "Ideales para resolver comidas familiares y rendir bien por kilo.",
    alternativas: ["nalga", "bola de lomo", "cuadrada", "peceto"],
    tags_busqueda: ["milanesa", "tierno", "familia", "rendidor"],
    prioridad: 90,
  },
  {
    match: ["costilla", "tira", "vacio", "matambre", "entraña", "asado"],
    nombre_visible: "Cortes para parrilla",
    descripcion_corta: "Cortes recomendados para asado y reuniones.",
    platos_recomendados: ["asado", "parrilla"],
    metodos_coccion: ["parrilla", "horno"],
    terneza: "media-alta",
    rendimiento: "medio",
    precio_nivel: "medio",
    recomendacion_comercial: "Muy buena opción para compartir y quedar bien en la parrilla.",
    alternativas: ["costilla", "vacío", "matambre", "entraña"],
    tags_busqueda: ["parrilla", "asado", "domingo", "reunion"],
    prioridad: 85,
  },
  {
    match: ["paleta", "roast", "aguja", "carnaza", "falda", "osobuco"],
    nombre_visible: "Cortes económicos y rendidores",
    descripcion_corta: "Opciones para guisos, estofados y comidas de olla.",
    platos_recomendados: ["guiso", "estofado", "salsa", "puchero"],
    metodos_coccion: ["coccion lenta", "olla", "horno"],
    terneza: "media",
    rendimiento: "alto",
    precio_nivel: "economico",
    recomendacion_comercial: "Convienen cuando buscás sabor, rendimiento y buen precio.",
    alternativas: ["paleta", "roast beef", "aguja", "falda", "osobuco"],
    tags_busqueda: ["economico", "barato", "rendidor", "guiso", "olla"],
    prioridad: 80,
  },
  {
    match: ["picada", "molida"],
    nombre_visible: "Carne picada",
    descripcion_corta: "Para empanadas, hamburguesas, salsa y rellenos.",
    platos_recomendados: ["empanadas", "hamburguesas", "salsa", "pastel de papa"],
    metodos_coccion: ["sarten", "horno", "olla"],
    terneza: "media",
    rendimiento: "alto",
    precio_nivel: "economico",
    recomendacion_comercial: "Muy versátil para comidas rápidas y rendidoras.",
    alternativas: ["picada especial", "picada comun"],
    tags_busqueda: ["picada", "molida", "empanada", "hamburguesa", "salsa"],
    prioridad: 75,
  },
  {
    match: ["bondiola", "pechito", "cerdo", "costeleta", "matambrito"],
    nombre_visible: "Cortes de cerdo",
    descripcion_corta: "Opciones sabrosas para horno, parrilla y plancha.",
    platos_recomendados: ["parrilla", "horno", "plancha"],
    metodos_coccion: ["parrilla", "horno", "plancha"],
    terneza: "alta",
    rendimiento: "medio",
    precio_nivel: "medio",
    recomendacion_comercial: "Alternativa muy sabrosa y rendidora frente a la carne vacuna.",
    alternativas: ["bondiola", "pechito", "costeleta", "matambrito"],
    tags_busqueda: ["cerdo", "parrilla", "horno", "sabroso"],
    prioridad: 70,
  },
];

async function findArticuloByWords(words) {
  return ArticuloTabla.findOne({
    where: {
      [Op.or]: words.flatMap((word) => [
        { descripcion: { [Op.iLike]: `%${word}%` } },
        { descripcionreducida: { [Op.iLike]: `%${word}%` } },
      ]),
    },
    order: [["descripcion", "ASC"]],
  });
}

async function main() {
  await sequelize.authenticate();

  let created = 0;
  let skipped = 0;

  for (const meta of METAS) {
    const articulo = await findArticuloByWords(meta.match);

    if (!articulo) {
      console.log(`[BOT SEED] No encontré artículo para: ${meta.nombre_visible}`);
      skipped += 1;
      continue;
    }

    const [row, wasCreated] = await BotProductMeta.findOrCreate({
      where: { articulo_id: articulo.id },
      defaults: {
        articulo_id: articulo.id,
        nombre_visible: meta.nombre_visible,
        descripcion_corta: meta.descripcion_corta,
        platos_recomendados: meta.platos_recomendados,
        metodos_coccion: meta.metodos_coccion,
        terneza: meta.terneza,
        rendimiento: meta.rendimiento,
        precio_nivel: meta.precio_nivel,
        recomendacion_comercial: meta.recomendacion_comercial,
        alternativas: meta.alternativas,
        tags_busqueda: meta.tags_busqueda,
        prioridad: meta.prioridad,
        activo_bot: true,
      },
    });

    if (!wasCreated) {
      await row.update({
        nombre_visible: meta.nombre_visible,
        descripcion_corta: meta.descripcion_corta,
        platos_recomendados: meta.platos_recomendados,
        metodos_coccion: meta.metodos_coccion,
        terneza: meta.terneza,
        rendimiento: meta.rendimiento,
        precio_nivel: meta.precio_nivel,
        recomendacion_comercial: meta.recomendacion_comercial,
        alternativas: meta.alternativas,
        tags_busqueda: meta.tags_busqueda,
        prioridad: meta.prioridad,
        activo_bot: true,
      });
    }

    console.log(`[BOT SEED] ${wasCreated ? "Creado" : "Actualizado"}: ${meta.nombre_visible} -> articulo_id=${articulo.id} (${articulo.descripcion})`);
    created += wasCreated ? 1 : 0;
  }

  console.log(`[BOT SEED] Finalizado. Creados=${created}, omitidos=${skipped}`);
  await sequelize.close();
}

main().catch(async (error) => {
  console.error("[BOT SEED] Error:", error);
  await sequelize.close();
  process.exit(1);
});
