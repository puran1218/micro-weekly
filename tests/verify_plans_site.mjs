import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(process.cwd(), "static", "plans");

const requiredFiles = [
  "index.html",
  "assets/puran_blog_avator.jpg",
  "assets/one-exercise-per-muscle-group-guide.png",
  "current/dinner.html",
  "current/training.html",
  "current/training-reference.html",
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
  "weeks/week22/index.html",
  "weeks/week22/training.html",
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
assert.match(indexHtml, /Week 22/i, "Plans index should keep Week 22 in the archive");
assert.match(indexHtml, /Current Dinner/i, "Plans index should expose the fixed dinner template");
assert.match(indexHtml, /Current Training/i, "Plans index should expose the fixed training template");
assert.match(indexHtml, /Reference Guide/i, "Plans index should expose the training reference");
assert.match(indexHtml, /weeks\/week17\/index\.html/i, "Plans index should expose week landing pages");
assert.match(indexHtml, /latest\/dinner\.html/i, "Plans index should expose the latest dinner link");
assert.match(indexHtml, /latest\/training\.html/i, "Plans index should expose the latest training link");
assert.match(indexHtml, /rel="icon"/i, "Plans index should include favicon metadata");

const dinnerLatest = readFileSync(resolve(root, "latest", "dinner.html"), "utf8");
assert.match(dinnerLatest, /current\/dinner\.html/i, "Latest dinner page should redirect or link to the current dinner template");
assert.match(dinnerLatest, /rel="icon"/i, "Latest dinner page should include favicon metadata");

const trainingLatest = readFileSync(resolve(root, "latest", "training.html"), "utf8");
assert.match(trainingLatest, /current\/training\.html/i, "Latest training page should redirect or link to the current training template");
assert.match(trainingLatest, /rel="icon"/i, "Latest training page should include favicon metadata");

const currentTraining = readFileSync(resolve(root, "current", "training.html"), "utf8");
assert.match(currentTraining, /Current Training Template/i, "Current training should use fixed-template page title");
assert.match(currentTraining, /training-reference\.html/i, "Current training should link to its reference guide");

const referenceGuide = readFileSync(resolve(root, "current", "training-reference.html"), "utf8");
assert.match(referenceGuide, /One Exercise Per Muscle Group Guide/i, "Reference page should have a descriptive title");
assert.match(referenceGuide, /one-exercise-per-muscle-group-guide\.png/i, "Reference page should display the copied guide image");

const week17Index = readFileSync(resolve(root, "weeks", "week17", "index.html"), "utf8");
assert.match(week17Index, /Week 17/i, "Week 17 landing page should include the week title");
assert.match(week17Index, /href="\.\/dinner\.html"/i, "Week 17 landing page should link to dinner detail");
assert.match(week17Index, /href="\.\/training\.html"/i, "Week 17 landing page should link to training detail");

console.log("Plans site structure looks good.");
