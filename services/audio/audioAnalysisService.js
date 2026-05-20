import fetch from "node-fetch";
import { AudioSegmentAnalysis } from "../../models/audio/AudioSegmentAnalysis.js";

function shouldAnalyze(segment) {
  const text = String(segment.transcription_text || "").trim();

  if (!text || text.length < 10) {
    return false;
  }

  if (
    segment.has_question ||
    segment.has_recommendation ||
    segment.has_suggested_sale
  ) {
    return true;
  }

  return false;
}

function extractJsonFromResponse(content) {
  if (!content) return null;

  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_) {}

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch (_) {
    return null;
  }
}

async function callOpenAIForSegment(segment) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no configurada");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const prompt = `
Sos un auditor comercial de una cadena de carnicerías.

Analizá esta transcripción y devolvé SOLO JSON válido con esta estructura exacta:

{
  "hadRecommendation": boolean,
  "hadSuggestedSale": boolean,
  "missedOpportunity": boolean,
  "scoreAttention": number,
  "scoreSales": number,
  "summary": string,
  "improvementTip": string
}

Reglas:
- hadRecommendation: true si el vendedor recomendó un producto o alternativa concreta
- hadSuggestedSale: true si intentó ampliar la venta o agregar algo
- missedOpportunity: true si el cliente consultó algo y se perdió chance de recomendar o vender mejor
- scoreAttention: de 0 a 10
- scoreSales: de 0 a 10
- summary: breve y clara
- improvementTip: una mejora concreta

Datos:
Transcripción: """${segment.transcription_text || ""}"""

Flags locales:
- hasQuestion: ${!!segment.has_question}
- hasRecommendation: ${!!segment.has_recommendation}
- hasSuggestedSale: ${!!segment.has_suggested_sale}
- hasOffer: ${!!segment.has_offer}
`.trim();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Respondé únicamente JSON válido. No agregues texto fuera del JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error OpenAI: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const parsed = extractJsonFromResponse(content);

  if (!parsed) {
    throw new Error("No se pudo parsear JSON de OpenAI");
  }

  return parsed;
}

export async function analyzeSegmentIfNeeded(segment) {
  if (!shouldAnalyze(segment)) {
    segment.analysis_status = "skipped";
    await segment.save();
    return { analyzed: false, reason: "rules_skipped" };
  }

  const result = await callOpenAIForSegment(segment);

  const existingAnalysis = await AudioSegmentAnalysis.findOne({
    where: { audio_segment_id: segment.id },
  });

  if (existingAnalysis) {
    await existingAnalysis.update({
      had_recommendation: result.hadRecommendation ?? null,
      had_suggested_sale: result.hadSuggestedSale ?? null,
      missed_opportunity: result.missedOpportunity ?? null,
      score_attention: result.scoreAttention ?? null,
      score_sales: result.scoreSales ?? null,
      summary: result.summary || null,
      improvement_tip: result.improvementTip || null,
      raw_response_json: result,
    });
  } else {
    await AudioSegmentAnalysis.create({
      audio_segment_id: segment.id,
      had_recommendation: result.hadRecommendation ?? null,
      had_suggested_sale: result.hadSuggestedSale ?? null,
      missed_opportunity: result.missedOpportunity ?? null,
      score_attention: result.scoreAttention ?? null,
      score_sales: result.scoreSales ?? null,
      summary: result.summary || null,
      improvement_tip: result.improvementTip || null,
      raw_response_json: result,
    });
  }

  segment.analysis_status = "analyzed";
  await segment.save();

  return { analyzed: true, result };
}