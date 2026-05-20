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

function safeMoney(value) {
  if (value === null || typeof value === "undefined" || Number.isNaN(Number(value))) return null;
  return Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export async function buildAdviceWithOpenAI({
  userMessage,
  candidates = [],
  pricing = [],
  intent = null,
  conversationContext = {},
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
      precio_normal_texto: safeMoney(price?.precio_normal),
      precio_final_texto: safeMoney(price?.precio_final),
      tiene_promocion: price?.tiene_promocion ?? false,
      promocion: price?.promocion || null,
    };
  });

  const instructions = `
Sos el asistente comercial de WhatsApp de La Tradición Carnicerías, en Catamarca, Argentina.
Respondé como un buen vendedor de mostrador: claro, cálido, práctico y breve.

Reglas obligatorias:
- No inventes precios, productos, stock, horarios ni promociones.
- Si hay precio_final, podés mencionarlo como precio de referencia.
- Si tiene_promocion=true, resaltá que tiene promo.
- Si el cliente pide stock exacto o reserva, sugerí derivación a una sucursal.
- Si no hay datos suficientes, pedí una aclaración simple.
- No uses respuestas largas. Máximo 5 líneas.
- Usá español argentino y tono comercial, no robótico.
- No tomes pedidos, reservas ni encargos.
- No pidas cantidades, kilos, fecha ni horario de retiro.
- No digas "te lo preparamos", "te lo armo", "te lo dejo listo" ni frases similares.
- Si el cliente pide datos de sucursales, zona, barrio, teléfono, dirección, ubicación u horario, no inventes preguntas de calle, altura o referencia.
- No preguntes "a qué altura", "qué cruce", "barrio" ni "punto de referencia".
- Si no tenés el dato exacto, indicá que el bot puede mostrar la lista de sucursales disponibles.
- Las sucursales deben resolverse con la lógica interna del sistema, no con OpenAI.
- Después de asesorar, solo ofrecé pasar teléfono, dirección o ubicación de una sucursal.
- Cerrá con una pregunta simple como: "¿Querés que te pase los datos de alguna sucursal?"
`;

const historyText = (conversationContext.history || [])
  .map((h) => `${h.role}: ${h.text}`)
  .join("\n");

const input = `
Historial reciente:
${historyText}

Intención detectada: ${intent || "sin_clasificar"}

Productos disponibles:
${JSON.stringify(candidateData, null, 2)}

Mensaje actual del cliente:
"${userMessage}"
`;

  try {
const response = await client.responses.create({
  model: settings.model_name || process.env.OPENAI_MODEL || "gpt-4.1-mini",
  instructions,
  input,
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
