import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { embed, generate } from "./llm/provider.js";
import { qdrant, COLLECTION_NAME } from "./vector/qdrant.js";

const server = new McpServer(
  { name: "mcp-pdf-server", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.registerTool(
  "ask_documents",
  {
    description:
      "Ask a question and get an answer grounded in the ingested PDF documents",
    inputSchema: {
      question: z
        .string()
        .describe("The question to ask about the ingested documents"),
    },
  },
  async ({ question }) => {
    const queryEmbedding = await embed(question, "query");

    const results = await qdrant.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: 5,
    });

    const context = results.map((r) => r.payload?.text).join("\n\n");

    const prompt = `
Context:
${context}

Question:
${question}
`;

    const answer = await generate(prompt);

    return {
      content: [{ type: "text", text: answer }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
