import { QdrantClient } from "@qdrant/js-client-rest";
import "dotenv/config";

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  checkCompatibility: false,
});

export const COLLECTION_NAME = process.env.COLLECTION_NAME || "documents";
