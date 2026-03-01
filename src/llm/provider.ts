import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function embed(
  text: string,
  type: "query" | "passage" = "passage",
): Promise<number[]> {
  const response = await client.embeddings.create({
    model: process.env.EMBED_MODEL || "nvidia/nv-embedqa-e5-v5",
    input: text,
    //@ts-ignore - NVIDIA specific parameter
    input_type: type,
    truncate: "NONE",
  });

  return response.data[0]?.embedding ?? [];
}

export async function generate(prompt: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: process.env.GEN_MODEL || "qwen/qwen2.5-coder-32b-instruct",
    messages: [
      {
        role: "system",
        content:
          "Answer only using the provided context from the ingested documents. Structure your answers clearly with headings and bullet points where appropriate.",
      },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}
