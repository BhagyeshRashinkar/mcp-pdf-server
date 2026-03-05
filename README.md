# 📚 MCP PDF Server

An **MCP (Model Context Protocol)** server that lets AI assistants **query your PDF documents**. Drop your PDFs, ingest them into a vector database, and ask questions — answers are grounded in your actual documents.

---

## ✨ Features

- **🔌 MCP-Compatible** — Works with any MCP client (GitHub Copilot, Antigravity, etc.)
- **📄 Auto PDF Discovery** — Automatically finds, extracts, chunks, and embeds all PDFs in your folder
- **🔍 Vector Search** — Retrieves the most relevant passages before generating answers
- **🐳 Docker-Ready** — Runs as a containerized server with one command
- **🗄️ Qdrant** — Fast, open-source vector database for similarity search

---

## 🏗️ How It Works

```
┌─────────────┐     MCP (stdio)     ┌───────────────────┐     HTTP      ┌──────────┐
│ AI Assistant │◄───────────────────►│  MCP PDF Server   │◄────────────►│  Qdrant  │
│              │                     │                   │              │ Vector DB│
└─────────────┘                     │  1. Embed question │              └──────────┘
                                    │  2. Search vectors │
                                    │  3. Generate answer│   LLM API
                                    │                    │◄────────────►
                                    └───────────────────┘   (Embeddings
                                                            + Generation)
```

1. You ask a question via your AI assistant.
2. The server **embeds** the question using your choice of embedding model.
3. It **searches** Qdrant for the top 5 most relevant text chunks from your PDFs.
4. It **generates** an answer using an LLM, grounded in the retrieved context.

---

## 🚀 Quick Start

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Node.js 20+](https://nodejs.org/) (for ingestion only)
- [LLM API Key]

### 1. Clone & Configure

```bash
git clone https://github.com/your-username/mcp-pdf-server.git
cd mcp-pdf-server

cp .env.example .env
```

Edit `.env` and set your API key:

```env
API_KEY=nvapi-your_key_here
```

### 2. Start Qdrant

```bash
docker-compose up -d
```

### 3. Add Your PDFs & Ingest

Place your PDF documents in the `pdfs/` folder, then:

```bash
npm install        # first time only
npm run ingest
```

All PDFs in the folder are automatically discovered and ingested.

### 4. Build the Server Image

```bash
docker build -t mcp-pdf-server .
```

### 5. Connect to Your AI Assistant

Add to your AI assistant's MCP config (e.g., `mcp_config.json`):

```json
{
  "mcpServers": {
    "pdf-docs": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--network",
        "mcp-network",
        "-e",
        "API_KEY",
        "-e",
        "QDRANT_URL=http://mcp-qdrant:6333",
        "-e",
        "COLLECTION_NAME=documents",
        "-e",
        "EMBED_MODEL=nvidia/nv-embedqa-e5-v5",
        "-e",
        "GEN_MODEL=qwen/qwen2.5-coder-32b-instruct",
        "mcp-pdf-server"
      ],
      "env": {
        "API_KEY": "your_nvapi_key_here"
      }
    }
  }
}
```

**Done!** Ask your AI assistant any question about your documents.

---

## 🔧 Available Tools

| Tool            | Description                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `ask_documents` | Ask any question. The server retrieves relevant context from your ingested PDFs and generates an answer. |

---

## ⚙️ Environment Variables

| Variable            | Description                   | Default                           |
| ------------------- | ----------------------------- | --------------------------------- |
| `API_KEY`           | LLM API key                   | _(required)_                      |
| `EMBED_MODEL`       | Embedding model               | `nvidia/nv-embedqa-e5-v5`         |
| `GEN_MODEL`         | Generation model              | `qwen/qwen2.5-coder-32b-instruct` |
| `COLLECTION_NAME`   | Qdrant collection name        | `documents`                       |
| `QDRANT_URL`        | Qdrant connection URL         | `http://localhost:6333`           |
| `EMBED_BATCH_SIZE`  | Chunks per embedding batch    | `15`                              |
| `EMBED_MAX_RETRIES` | Max retries on API failure    | `3`                               |
| `EMBED_COOLOFF_MS`  | Cooldown between batches (ms) | `500`                             |

> **Note:** The `.env` file is used for local ingestion. The `mcp_config.json` passes env vars via Docker `-e` flags for the server.

---

## 📁 Project Structure

```
mcp-pdf-server/
├── pdfs/                     # Place your PDF documents here
├── src/
│   ├── server.ts             # MCP server entry point
│   ├── llm/
│   │   └── provider.ts       # LLM API client (embed + generate)
│   ├── vector/
│   │   └── qdrant.ts         # Qdrant client config
│   └── ingest/
│       ├── main.ts           # Ingestion orchestrator (auto-discovers PDFs)
│       ├── extract.ts        # PDF text extraction
│       ├── chunk.ts          # Text chunking
│       └── embed.ts          # Batch embedding & Qdrant insertion
├── docker-compose.yml        # Qdrant service
├── Dockerfile                # Server image
├── .env.example              # Env var template (safe to commit)
├── .gitignore                # Keeps secrets & binaries out of git
└── package.json
```

---

## 🛠️ Development

For local development with hot-reloading:

```bash
npm install
docker-compose up -d    # Start Qdrant
npm run dev             # Server with hot-reload
```

To use the local dev server with your AI assistant, change `mcp_config.json` to:

```json
{
  "mcpServers": {
    "pdf-docs": {
      "command": "npx",
      "args": ["tsx", "src/server.ts"],
      "cwd": "/path/to/mcp-pdf-server",
      "env": {
        "API_KEY": "your_nvapi_key_here",
        "QDRANT_URL": "http://localhost:6333",
        "COLLECTION_NAME": "documents",
        "EMBED_MODEL": "nvidia/nv-embedqa-e5-v5",
        "GEN_MODEL": "qwen/qwen2.5-coder-32b-instruct"
      }
    }
  }
}
```

---

## 📝 Use Cases

This server works with **any** PDF knowledge base:

- 📖 Technical books — Architecture, algorithms, system design
- 📋 Company docs — Wikis, runbooks, policies
- 📄 Research papers — Academic papers, whitepapers
- 📑 Legal documents — Contracts, compliance
- 🎓 Course material — Textbooks, lecture notes

---

## 🐛 Troubleshooting

| Problem                   | Solution                                                             |
| ------------------------- | -------------------------------------------------------------------- |
| Server can't reach Qdrant | `docker ps` — Ensure `mcp-qdrant` is running on `mcp-network`        |
| Embeddings mismatch       | Changed `EMBED_MODEL`? Delete `qdrant_storage/` and re-ingest        |
| Rebuild server image      | `docker build -t mcp-pdf-server .` after code changes                |
| Reset all data            | Delete `./qdrant_storage/` and re-run `npm run ingest`               |
| Rate limiting             | Increase `EMBED_COOLOFF_MS` or decrease `EMBED_BATCH_SIZE` in `.env` |
| No PDFs found             | Ensure `.pdf` files are placed in the `pdfs/` directory              |

---

## 📄 License

ISC
