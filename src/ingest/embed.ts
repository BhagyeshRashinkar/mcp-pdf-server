import "dotenv/config";
import { extractText } from "./extract.js";
import { chunkText } from "./chunk.js";
import { embed } from "../llm/provider.js";
import { qdrant, COLLECTION_NAME } from "../vector/qdrant.js";
import { v4 as uuid } from "uuid";

export async function ingestPDF(path: string) {
  const text = await extractText(path);
  const chunks = chunkText(text);
  console.log(`Total chunks to process: ${chunks.length}`);

  try {
    const collections = await qdrant.getCollections();
    if (!collections.collections.some((c) => c.name === COLLECTION_NAME)) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1024,
          distance: "Cosine",
        },
      });
    }
  } catch (error) {
    console.warn("Error fetching/creating collections:", error);
  }

  const BATCH_SIZE = Number.parseInt(process.env.EMBED_BATCH_SIZE || "5");
  const MAX_RETRIES = Number.parseInt(process.env.EMBED_MAX_RETRIES || "3");
  const COOLOFF_MS = Number.parseInt(process.env.EMBED_COOLOFF_MS || "500");

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    // Process batch sequentially or with smaller parallelism to avoid 429s
    const points: any[] = [];
    for (const chunk of batch) {
      let retryCount = 0;
      while (retryCount < MAX_RETRIES) {
        try {
          const embedding = await embed(chunk);
          points.push({
            id: uuid(),
            vector: embedding,
            payload: { text: chunk },
          });
          break; // Success, exit retry loop
        } catch (error: any) {
          if (error?.status === 429) {
            retryCount++;
            const waitTime = Math.pow(2, retryCount) * 1000;
            console.warn(
              `Rate limited. Retrying in ${waitTime / 1000}s... (Attempt ${retryCount}/${MAX_RETRIES})`,
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          } else {
            throw error; // Other error, let it fail
          }
        }
      }
    }

    // Single batch upsert
    await qdrant.upsert(COLLECTION_NAME, {
      points,
    });

    console.log(
      `Progress: ${Math.min(i + BATCH_SIZE, chunks.length)} / ${chunks.length} chunks indexed...`,
    );

    await new Promise((resolve) => setTimeout(resolve, COOLOFF_MS));
  }

  console.log("PDF indexed successfully.");
}
