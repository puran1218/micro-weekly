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
const week15DinnerSource = resolve(workspace, "source-html", "week15_dinner_plan.html");
const week15TrainingSource = resolve(workspace, "source-html", "week15_training_plan.html");

execFileSync("node", [scriptPath, dinnerSource, "--site-root", siteRoot], {
  cwd: workspace,
  stdio: "pipe",
});

execFileSync("node", [scriptPath, trainingSource, "--site-root", siteRoot], {
  cwd: workspace,
  stdio: "pipe",
});

execFileSync("node", [scriptPath, week15DinnerSource, "--site-root", siteRoot], {
  cwd: workspace,
  stdio: "pipe",
});

execFileSync("node", [scriptPath, week15TrainingSource, "--site-root", siteRoot], {
  cwd: workspace,
  stdio: "pipe",
});

const dinnerPage = resolve(siteRoot, "weeks", "week14", "dinner.html");
const trainingPage = resolve(siteRoot, "weeks", "week14", "training.html");
const week15DinnerPage = resolve(siteRoot, "weeks", "week15", "dinner.html");
const week15TrainingPage = resolve(siteRoot, "weeks", "week15", "training.html");
const latestDinner = resolve(siteRoot, "latest", "dinner.html");
const latestTraining = resolve(siteRoot, "latest", "training.html");
const indexPage = resolve(siteRoot, "index.html");

for (const path of [dinnerPage, trainingPage, week15DinnerPage, week15TrainingPage, latestDinner, latestTraining, indexPage]) {
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
assert.match(
  dinnerHtml,
  /<a class="search-link"[^>]*href="https:\/\/www\.youtube\.com\/results\?search_query=%E6%B8%85%E8%92%B8%E9%B2%88%E9%B1%BC"/i,
  "Generated dinner page should turn dish names into YouTube search links",
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
assert.match(trainingHtml, /周一 · 3月30日/i, "Training page should show Monday as March 30");
assert.match(trainingHtml, /周二 · 3月31日/i, "Training page should show Tuesday as March 31");
assert.match(trainingHtml, /周五 · 4月3日/i, "Training page should show Friday as April 3");
assert.match(
  trainingHtml,
  /var\(--color-border-tertiary,\s*#d8dde6\)/i,
  "Generated training page should add a border fallback for standalone rendering",
);
assert.match(
  trainingHtml,
  /<a class="search-link"[^>]*href="https:\/\/www\.youtube\.com\/results\?search_query=%E5%9D%90%E5%A7%BF%E8%85%BF%E5%B1%88%E4%BC%B8"/i,
  "Generated training page should turn move names into YouTube search links",
);
assert.doesNotMatch(
  trainingHtml,
  /search_query=.*%E8%B6%B3%E8%B8%9D/i,
  "Generated training move links should ignore helper tag text like 足踝 in the search query",
);

const latestDinnerHtml = readFileSync(latestDinner, "utf8");
assert.match(latestDinnerHtml, /week15\/dinner\.html/i, "Latest dinner redirect should point to the newest imported week");

const latestTrainingHtml = readFileSync(latestTraining, "utf8");
assert.match(latestTrainingHtml, /week15\/training\.html/i, "Latest training redirect should point to the newest imported week");

const indexHtml = readFileSync(indexPage, "utf8");
assert.match(indexHtml, /Dinner \+ Training/i, "Index should have the new editorial homepage title");
assert.match(indexHtml, /Latest Dinner/i, "Index should keep the latest dinner feature card");
assert.match(indexHtml, /Latest Training/i, "Index should keep the latest training feature card");
assert.match(indexHtml, /Weeks Archive/i, "Index should include the archive section");
assert.match(indexHtml, /Week 14/i, "Index should include the imported week");
assert.match(indexHtml, /Week 15/i, "Index should include the newest imported week");

const week15DinnerHtml = readFileSync(week15DinnerPage, "utf8");
assert.match(week15DinnerHtml, /Week 15 Dinner Plan/i, "Week 15 dinner page should include the correct heading");
assert.match(
  week15DinnerHtml,
  /<a class="search-link"[^>]*href="https:\/\/www\.youtube\.com\/results\?search_query=%E8%82%89%E6%9C%AB%E8%B1%86%E8%85%90"/i,
  "Week 15 dinner page should add search links for dishes",
);
assert.doesNotMatch(
  week15DinnerHtml,
  /<main class="panel">\s*<style>/i,
  "Week 15 dinner page should not inject a stray style block into the page body",
);

console.log("Import plan HTML generator works.");
