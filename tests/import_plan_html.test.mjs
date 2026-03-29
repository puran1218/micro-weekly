import assert from "node:assert/strict";
import { existsSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const workspace = process.cwd();
const tempRoot = mkdtempSync(resolve(tmpdir(), "plans-import-"));
const siteRoot = resolve(tempRoot, "static", "plans");
const scriptPath = resolve(workspace, "scripts", "import_plan_html.mjs");
const dinnerSource = resolve(workspace, "source-html", "week14_dinner_plan.html");
const trainingSource = resolve(workspace, "source-html", "week14_training_plan.html");

execFileSync("node", [scriptPath, dinnerSource, "--site-root", siteRoot], {
  cwd: workspace,
  stdio: "pipe",
});

execFileSync("node", [scriptPath, trainingSource, "--site-root", siteRoot], {
  cwd: workspace,
  stdio: "pipe",
});

const dinnerPage = resolve(siteRoot, "weeks", "week14", "dinner.html");
const trainingPage = resolve(siteRoot, "weeks", "week14", "training.html");
const latestDinner = resolve(siteRoot, "latest", "dinner.html");
const latestTraining = resolve(siteRoot, "latest", "training.html");
const indexPage = resolve(siteRoot, "index.html");

for (const path of [dinnerPage, trainingPage, latestDinner, latestTraining, indexPage]) {
  assert.ok(existsSync(path), `Expected generated file to exist: ${path}`);
}

const dinnerHtml = readFileSync(dinnerPage, "utf8");
assert.match(dinnerHtml, /Plans Home/i, "Generated dinner page should include the plans home navigation");
assert.match(dinnerHtml, /Week 14 Dinner Plan/i, "Generated dinner page should include a descriptive hero heading");
assert.match(dinnerHtml, />Dinner</i, "Generated dinner page should include the dinner tab");
assert.match(dinnerHtml, />Training</i, "Generated dinner page should include the training tab");
assert.doesNotMatch(
  dinnerHtml,
  /适合手机快速查看的一周晚餐安排/i,
  "Generated dinner page should keep the header minimal without the old explanatory paragraph",
);
assert.match(
  dinnerHtml,
  /var\(--color-border-tertiary,\s*#d8dde6\)/i,
  "Generated dinner page should add a border fallback for standalone rendering",
);

const trainingHtml = readFileSync(trainingPage, "utf8");
assert.match(trainingHtml, /Week 14 Training Plan/i, "Generated training page should include a descriptive hero heading");
assert.match(trainingHtml, /Plans Home/i, "Generated training page should include the plans home navigation");
assert.match(trainingHtml, />Dinner</i, "Generated training page should include the dinner tab");
assert.match(trainingHtml, />Training</i, "Generated training page should include the training tab");
assert.doesNotMatch(
  trainingHtml,
  /面向手机查看的一周训练安排/i,
  "Generated training page should keep the header minimal without the old explanatory paragraph",
);
assert.match(
  trainingHtml,
  /var\(--color-border-tertiary,\s*#d8dde6\)/i,
  "Generated training page should add a border fallback for standalone rendering",
);

const latestDinnerHtml = readFileSync(latestDinner, "utf8");
assert.match(latestDinnerHtml, /week14\/dinner\.html/i, "Latest dinner redirect should point to the imported week");

const latestTrainingHtml = readFileSync(latestTraining, "utf8");
assert.match(latestTrainingHtml, /week14\/training\.html/i, "Latest training redirect should point to the imported week");

const indexHtml = readFileSync(indexPage, "utf8");
assert.match(indexHtml, /Dinner \+ Training/i, "Index should have the new editorial homepage title");
assert.match(indexHtml, /Latest Dinner/i, "Index should keep the latest dinner feature card");
assert.match(indexHtml, /Latest Training/i, "Index should keep the latest training feature card");
assert.match(indexHtml, /Weeks Archive/i, "Index should include the archive section");
assert.match(indexHtml, /Week 14/i, "Index should include the imported week");

console.log("Import plan HTML generator works.");
