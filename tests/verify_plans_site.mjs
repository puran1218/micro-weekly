import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(process.cwd(), "static", "plans");

const requiredFiles = [
  "index.html",
  "weeks/week14/dinner.html",
  "weeks/week14/training.html",
  "weeks/week15/dinner.html",
  "weeks/week15/training.html",
  "weeks/week16/dinner.html",
  "weeks/week16/training.html",
  "latest/dinner.html",
  "latest/training.html",
];

for (const file of requiredFiles) {
  const fullPath = resolve(root, file);
  assert.ok(existsSync(fullPath), `Expected file to exist: ${fullPath}`);
}

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
assert.match(indexHtml, /Week 14/i, "Plans index should link to Week 14");
assert.match(indexHtml, /Week 15/i, "Plans index should link to Week 15");
assert.match(indexHtml, /Week 16/i, "Plans index should link to Week 16");
assert.match(indexHtml, /latest\/dinner\.html/i, "Plans index should expose the latest dinner link");
assert.match(indexHtml, /latest\/training\.html/i, "Plans index should expose the latest training link");

const dinnerLatest = readFileSync(resolve(root, "latest", "dinner.html"), "utf8");
assert.match(dinnerLatest, /week16\/dinner\.html/i, "Latest dinner page should redirect or link to Week 16 dinner");

const trainingLatest = readFileSync(resolve(root, "latest", "training.html"), "utf8");
assert.match(trainingLatest, /week16\/training\.html/i, "Latest training page should redirect or link to Week 16 training");

console.log("Plans site structure looks good.");
