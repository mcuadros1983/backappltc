import OpenAI from "openai";
import "dotenv/config";

async function main() {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: "gpt-5.2",
    instructions: "Respondé en español y de forma breve.",
    input: "Decime una sola frase de prueba para confirmar que el SDK funciona.",
  });

  console.log(response.output_text);
}

main().catch(console.error);