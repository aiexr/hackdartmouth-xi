#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !line.trim().startsWith("#")) {
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const apiKey = process.env.OPENAI_API_KEY;
const baseUrl = process.env.API_BASE_URL || process.env.OPENAI_BASE_URL || "https://chat.dartmouth.edu/v1";

if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

const res = await fetch(`${baseUrl}/models`, {
  headers: { Authorization: `Bearer ${apiKey}` },
});

const text = await res.text();
if (!res.ok) throw new Error(`Request failed: ${res.status} ${text.slice(0, 120)}`);

let json;
try { json = JSON.parse(text); } catch { throw new Error(`Expected JSON from ${baseUrl}/models`) }
const models = (json.data || [])
  .map((m) => m.id)
  .filter(Boolean)
  .sort();

console.log("\nAvailable Models:");
console.log("-".repeat(50));
for (const id of models) console.log(`  - ${id}`);
console.log(`\nTotal: ${models.length} models`);
console.log(`Current: ${process.env.OPENAI_MODEL || "not set"}`);
console.log("-".repeat(50));
