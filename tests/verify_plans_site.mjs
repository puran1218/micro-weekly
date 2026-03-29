import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(process.cwd(), "static", "plans");

const requiredFiles = [
  "index.html",
  "weeks/week14/dinner.html",
  "weeks/week14/training.html",
  "latest/dinner.html",
  "latest/training.html",
];

for (const file of requiredFiles) {
  const fullPath = resolve(root, file);
  assert.ok(existsSync(fullPath), `Expected file to exist: ${fullPath}`);
}

const indexHtml = readFileSync(resolve(root, "index.html"), "utf8");
assert.match(indexHtml, /Week 14/i, "Plans index should link to Week 14");
assert.match(indexHtml, /latest\/dinner\.html/i, "Plans index should expose the latest dinner link");
assert.match(indexHtml, /latest\/training\.html/i, "Plans index should expose the latest training link");

const dinnerLatest = readFileSync(resolve(root, "latest", "dinner.html"), "utf8");
assert.match(dinnerLatest, /week14\/dinner\.html/i, "Latest dinner page should redirect or link to Week 14 dinner");

const trainingLatest = readFileSync(resolve(root, "latest", "training.html"), "utf8");
assert.match(trainingLatest, /week14\/training\.html/i, "Latest training page should redirect or link to Week 14 training");

console.log("Plans site structure looks good.");
