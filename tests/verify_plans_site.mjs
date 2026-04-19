import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(process.cwd(), "static", "plans");

const requiredFiles = [
  "index.html",
  "assets/puran_blog_avator.jpg",
  "weeks/week14/index.html",
  "weeks/week14/dinner.html",
  "weeks/week14/training.html",
  "weeks/week15/index.html",
  "weeks/week15/dinner.html",
  "weeks/week15/training.html",
  "weeks/week16/index.html",
  "weeks/week16/dinner.html",
  "weeks/week16/training.html",
  "weeks/week17/index.html",
  "weeks/week17/dinner.html",
  "weeks/week17/training.html",
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
assert.match(indexHtml, /Week 17/i, "Plans index should link to Week 17");
assert.match(indexHtml, /weeks\/week17\/index\.html/i, "Plans index should expose week landing pages");
assert.match(indexHtml, /latest\/dinner\.html/i, "Plans index should expose the latest dinner link");
assert.match(indexHtml, /latest\/training\.html/i, "Plans index should expose the latest training link");
assert.match(indexHtml, /rel="icon"/i, "Plans index should include favicon metadata");

const dinnerLatest = readFileSync(resolve(root, "latest", "dinner.html"), "utf8");
assert.match(dinnerLatest, /week17\/dinner\.html/i, "Latest dinner page should redirect or link to Week 17 dinner");
assert.match(dinnerLatest, /rel="icon"/i, "Latest dinner page should include favicon metadata");

const trainingLatest = readFileSync(resolve(root, "latest", "training.html"), "utf8");
assert.match(trainingLatest, /week17\/training\.html/i, "Latest training page should redirect or link to Week 17 training");
assert.match(trainingLatest, /rel="icon"/i, "Latest training page should include favicon metadata");

const week17Index = readFileSync(resolve(root, "weeks", "week17", "index.html"), "utf8");
assert.match(week17Index, /Week 17/i, "Week 17 landing page should include the week title");
assert.match(week17Index, /href="\.\/dinner\.html"/i, "Week 17 landing page should link to dinner detail");
assert.match(week17Index, /href="\.\/training\.html"/i, "Week 17 landing page should link to training detail");

console.log("Plans site structure looks good.");
