import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export async function extractText(path: string): Promise<string> {
  const buffer = fs.readFileSync(path);
  const data = await pdf(buffer);
  return data.text;
}
