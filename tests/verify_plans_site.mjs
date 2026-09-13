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
  "campaigns/index.html",
  "campaigns/tj-2026/index.html",
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
assert.match(indexHtml, /Training Campaigns/i, "Plans index should keep a generic Training Campaigns entry");
assert.match(indexHtml, /href="\.\/campaigns\/index\.html"/i, "Plans index should link to the campaign index");
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

const campaignIndex = readFileSync(resolve(root, "campaigns", "index.html"), "utf8");
assert.match(campaignIndex, /<title>Training Campaigns<\/title>/i, "Campaign index should be the campaigns landing page");
assert.match(campaignIndex, /Tianjin Marathon 2026/i, "Campaign index should list the Tianjin campaign");
assert.match(campaignIndex, /href="\.\/tj-2026\/"/i, "Campaign index should link to the tj-2026 campaign page");
assert.match(campaignIndex, /Oct 25, 2026/i, "Campaign index should show the race date");
assert.match(campaignIndex, /42\.195 km/i, "Campaign index should show the race distance");
assert.match(campaignIndex, /Week \d+ of \d+/i, "Campaign index should show current progress");
assert.match(campaignIndex, /class="row-note">[^<]*中签/, "Campaign index should show the quiet lottery note");
assert.match(campaignIndex, /href="\.\.\/index\.html"/i, "Campaign index should link back to /plans/");
assert.match(campaignIndex, /rel="icon"/i, "Campaign index should include favicon metadata");
assert.match(campaignIndex, /<meta name="viewport" content="width=device-width, initial-scale=1">/i, "Campaign index should include viewport metadata");

const campaignPage = readFileSync(resolve(root, "campaigns", "tj-2026", "index.html"), "utf8");
assert.match(campaignPage, /<title>Tianjin Marathon 2026<\/title>/, "tj-2026 page should carry its campaign title");
assert.match(campaignPage, /<h1>Tianjin Marathon 2026<\/h1>/, "tj-2026 page should show the race title");
assert.match(campaignPage, /Oct 25, 2026/, "tj-2026 page should show the race date");
assert.match(campaignPage, /42\.195 km/, "tj-2026 page should show the race distance");
assert.match(campaignPage, /data-race-date="2026-10-25"/, "tj-2026 page should render a live countdown anchor");
assert.match(campaignPage, /class="[^"]*campaign-current/, "tj-2026 page should wrap This Week in its semantic section");
assert.match(campaignPage, /class="[^"]*campaign-roadmap/, "tj-2026 page should wrap the roadmap in its semantic section");
assert.match(campaignPage, /class="[^"]*campaign-reviews/, "tj-2026 page should wrap reviews in their semantic section");
assert.match(campaignPage, /class="[^"]*campaign-reference/, "tj-2026 page should wrap the reference in its semantic section");
assert.match(campaignPage, /This Week <em>· W\d+<\/em>/, "tj-2026 page should highlight the current week marker");
assert.match(campaignPage, /<table>/i, "tj-2026 page should render markdown tables");
assert.match(campaignPage, /class="active"><span>W\d+<\/span>/, "tj-2026 page should mark the current week on the W1-W8-Race progress route");
assert.match(campaignPage, /Weekly Reviews/, "tj-2026 page should include weekly reviews");
assert.match(campaignPage, /8-Week Roadmap/, "tj-2026 page should include the roadmap");
assert.match(campaignPage, /Pain Signal/, "tj-2026 page should include the training reference");
assert.match(campaignPage, /href="\.\.\/index\.html"/, "tj-2026 page should link back to /plans/campaigns/");
assert.match(campaignPage, /href="\.\.\/\.\.\/index\.html"/, "tj-2026 page should link back to /plans/");
assert.match(campaignPage, /rel="icon"/, "tj-2026 page should include favicon metadata");
assert.match(campaignPage, /<p class="campaign-note">[^<]*中签[^<]*<\/p>/, "tj-2026 page should carry the quiet lottery note");
assert.match(campaignPage, /<meta name="viewport" content="width=device-width, initial-scale=1">/, "tj-2026 page should include viewport metadata");

console.log("Plans site structure looks good.");
