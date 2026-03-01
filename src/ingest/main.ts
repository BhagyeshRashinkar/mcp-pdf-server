import "dotenv/config";
import { ingestPDF } from "./embed.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfsDir = path.join(__dirname, "../../pdfs");

// Find all PDF files in the pdfs/ directory
const pdfFiles = fs
  .readdirSync(pdfsDir)
  .filter((file) => file.toLowerCase().endsWith(".pdf"));

if (pdfFiles.length === 0) {
  console.error("No PDF files found in the pdfs/ directory.");
  console.error("Place your PDF documents in the pdfs/ folder and try again.");
  process.exit(1);
}

console.log(`Found ${pdfFiles.length} PDF(s) to ingest.\n`);

for (const file of pdfFiles) {
  const pdfPath = path.join(pdfsDir, file);
  console.log(`Starting ingestion of ${file}...`);
  try {
    await ingestPDF(pdfPath);
    console.log(`✅ ${file} ingested successfully.\n`);
  } catch (error) {
    console.error(`❌ Failed to ingest ${file}:`, error);
    process.exit(1);
  }
}

console.log(`\nAll ${pdfFiles.length} PDF(s) ingested successfully.`);
