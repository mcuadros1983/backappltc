import OpenAI from "openai";
import { getBotSettings } from "./botConfigService.js";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("[BOT OPENAI] OPENAI_API_KEY no configurada");
    return null;
  }

  return new OpenAI({ apiKey });
}

export async function buildAdviceWithOpenAI({
  userMessage,
  candidates = [],
  pricing = [],
}) {
  const client = getClient();
  if (!client) return null;

  const settings = await getBotSettings();

  const pricingMap = new Map(pricing.map((p) => [Number(p.articulo_id), p]));

  const candidateData = candidates.map((item) => {
    const articuloId = Number(item.articulo_id);
    const price = pricingMap.get(articuloId);

    return {
      articulo_id: articuloId,
      nombre: item.nombre_visible,
      descripcion: item.descripcion_corta,
      articulo_descripcion: item.articulo?.descripcion || null,
      articulo_descripcion_reducida: item.articulo?.descripcionreducida || null,
      platos_recomendados: item.platos_recomendados || [],
      metodos_coccion: item.metodos_coccion || [],
      terneza: item.terneza,
      rendimiento: item.rendimiento,
      precio_nivel: item.precio_nivel,
      recomendacion_comercial: item.recomendacion_comercial,
      alternativas: item.alternativas || [],
      precio_normal: price?.precio_normal ?? null,
      precio_final: price?.precio_final ?? null,
      tiene_promocion: price?.tiene_promocion ?? false,
    };
  });

  const prompt = `
Sos un asesor comercial de carnicería de La Tradición.
Respondé en español argentino, tono cercano, claro y comercial.
No inventes productos ni precios.
Solo usá esta información:
${JSON.stringify(candidateData, null, 2)}

Consulta del cliente:
"${userMessage}"

Indicaciones:
- recomendá máximo 3 opciones
- explicá diferencias de forma simple
- si hay precios, mencionarlos brevemente
- si hay promo, decilo
- cerrá con una pregunta útil
- no uses formato excesivo ni listas muy largas
`;

  try {
    const response = await client.responses.create({
      model: settings.model_name || "gpt-5",
      instructions,
      input: prompt,
      temperature: Number(settings.temperature || 0.2),
    });

    return response.output_text?.trim() || null;
  } catch (error) {
    console.error("[BOT OPENAI] Error al generar respuesta:", error.message);
    return null;
  }
}

export default {
  buildAdviceWithOpenAI,
};