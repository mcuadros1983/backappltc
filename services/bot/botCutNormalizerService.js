import OpenAI from "openai";
import { getBotSettings } from "./botConfigService.js";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("[BOT NORMALIZER] OPENAI_API_KEY no configurada");
    return null;
  }

  return new OpenAI({ apiKey });
}

function extractJson(text = "") {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export async function normalizeCutQueryWithOpenAI({
  userMessage,
  knownAliases = [],
  knownProducts = [],
}) {
  const client = getClient();

  if (!client) {
    return null;
  }

  const settings = await getBotSettings();

  const instructions = `
Sos un normalizador de nombres de cortes de carne para una carnicería argentina.

Tu tarea:
- Detectar si el cliente menciona un corte, alias o forma popular de pedirlo.
- Relacionarlo con los productos conocidos si hay coincidencia probable.
- NO inventar precios.
- NO inventar stock.
- NO responder al cliente.
- Devolver SOLO JSON válido.

Formato obligatorio:
{
  "producto_buscado": string | null,
  "alias_detectado": string | null,
  "uso_detectado": string | null,
  "confianza": number,
  "terminos_busqueda": string[]
}

Reglas:
- Si el cliente dice "lomo vetado", puede corresponder a "lomo sin hueso" si existe en productos o aliases.
- Si no estás seguro, confianza menor a 0.6.
- terminos_busqueda debe incluir el alias original, el nombre normalizado y palabras útiles.
`;

  const input = `
Mensaje cliente:
"${userMessage}"

Productos conocidos:
${JSON.stringify(knownProducts.slice(0, 200), null, 2)}

Aliases conocidos:
${JSON.stringify(knownAliases.slice(0, 300), null, 2)}
`;

  try {
    const response = await client.responses.create({
      model: settings.model_name || process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions,
      input,
    });

    const parsed = extractJson(response.output_text || "");

    if (!parsed) return null;

    return {
      producto_buscado: parsed.producto_buscado || null,
      alias_detectado: parsed.alias_detectado || null,
      uso_detectado: parsed.uso_detectado || null,
      confianza: Number(parsed.confianza || 0),
      terminos_busqueda: Array.isArray(parsed.terminos_busqueda)
        ? parsed.terminos_busqueda
        : [],
    };
  } catch (error) {
    console.error("[BOT NORMALIZER] Error:", error.message);
    return null;
  }
}

export default {
  normalizeCutQueryWithOpenAI,
};