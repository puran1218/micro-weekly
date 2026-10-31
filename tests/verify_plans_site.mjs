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
  "campaigns/seoul-2027/index.html",
  "assets/lean-strength-seoul.svg",
  "library/breakfast/index.html",
  "library/dinner/index.html",
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
assert.match(indexHtml, /Life in Motion/i, "Home should use the unified playbook identity");
assert.match(indexHtml, /本周行动/, "Home should prioritize current-week actions");
assert.match(indexHtml, /W1 \/ 20/, "Home should reflect the active Seoul campaign week");
assert.match(indexHtml, /Mon 11\/2/, "Home should draw day-by-day entries from the active campaign");
assert.match(indexHtml, /href="\.\/library\/index\.html"/, "Home should link to the reference library");
assert.match(indexHtml, /href="\.\/journal\/index\.html"/, "Home should link to the journal");
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
assert.match(campaignIndex, /<p class="section-kicker">Completed<\/p>/i, "Campaign index should archive Tianjin under completed");
assert.match(campaignIndex, /class="row-note">[^<]*二次补录/, "Campaign index should show the quiet lottery note");
assert.match(campaignIndex, /href="\.\.\/index\.html"/i, "Campaign index should link back to /plans/");
assert.match(campaignIndex, /rel="icon"/i, "Campaign index should include favicon metadata");
assert.match(campaignIndex, /<meta name="viewport" content="width=device-width, initial-scale=1">/i, "Campaign index should include viewport metadata");

const campaignPage = readFileSync(resolve(root, "campaigns", "tj-2026", "index.html"), "utf8");
assert.match(campaignPage, /<title>Tianjin Marathon 2026<\/title>/, "tj-2026 page should carry its campaign title");
assert.match(campaignPage, /<h1>Tianjin Marathon 2026<\/h1>/, "tj-2026 page should show the race title");
assert.match(campaignPage, /Oct 25, 2026/, "tj-2026 page should show the race date");
assert.match(campaignPage, /42\.195 km/, "tj-2026 page should show the race distance");
assert.match(campaignPage, /<strong>Completed<\/strong>/, "Campaign page should show completed status");
assert.doesNotMatch(campaignPage, /id="countdown"/, "Completed campaign should not render a countdown anchor");
assert.match(campaignPage, /class="[^"]*campaign-current/, "tj-2026 page should wrap This Week in its semantic section");
assert.match(campaignPage, /class="[^"]*campaign-roadmap/, "tj-2026 page should wrap the roadmap in its semantic section");
assert.match(campaignPage, /class="[^"]*campaign-reviews/, "tj-2026 page should wrap reviews in their semantic section");
assert.match(campaignPage, /class="[^"]*campaign-reference/, "tj-2026 page should wrap the reference in its semantic section");
assert.match(campaignPage, /This Week <em>· Recovery<\/em>/, "Completed campaign should highlight the recovery section");
assert.match(campaignPage, /This Week <em>· Recovery<\/em>/, "Completed Tianjin campaign should show post-race recovery");
assert.match(campaignPage, /Week 7 · Oct 12 – Oct 18/, "Campaign should include W7 taper review");
assert.match(campaignPage, /Week 8 · Oct 19 – Oct 25/, "Campaign should include W8 race week review");
assert.match(campaignPage, /4:45:46/, "Campaign should show marathon workout time");
assert.match(campaignPage, /42\.60 km/, "Campaign should show watch-recorded marathon distance");
assert.match(campaignPage, /5:42\/km/, "Campaign should include closing 10km pace");
assert.match(campaignPage, /Oct 26 – Nov 1/, "Campaign should include post-race recovery schedule");
assert.match(campaignPage, /4\.40 km/, "W7 review should retain verified running mileage");
assert.match(campaignPage, /7h02/, "W7 review should include the weekly sleep summary");
assert.match(campaignPage, /40–60 g/, "Race-week plan should describe carbohydrate fueling");
assert.match(campaignPage, /<table>/i, "tj-2026 page should render markdown tables");
assert.match(campaignPage, /class="done"><span>W8<\/span>/, "All training weeks should be marked done");
assert.match(campaignPage, /class="race active"><span>Race<\/span>/, "Race milestone should be highlighted");
assert.match(campaignPage, /Weekly Reviews/, "tj-2026 page should include weekly reviews");
assert.match(campaignPage, /8-Week Roadmap/, "tj-2026 page should include the roadmap");
assert.match(campaignPage, /Pain Signal/, "tj-2026 page should include the training reference");
assert.match(campaignPage, /href="\.\.\/index\.html"/, "tj-2026 page should link back to /plans/campaigns/");
assert.match(campaignPage, /href="\.\.\/\.\.\/index\.html"/, "tj-2026 page should link back to /plans/");
assert.match(campaignPage, /rel="icon"/, "tj-2026 page should include favicon metadata");
assert.match(campaignPage, /<p class="campaign-note">[^<]*二次补录[^<]*<\/p>/, "tj-2026 page should carry the quiet lottery note");
assert.match(campaignPage, /<meta name="viewport" content="width=device-width, initial-scale=1">/, "tj-2026 page should include viewport metadata");

const seoulPage = readFileSync(resolve(root, "campaigns", "seoul-2027", "index.html"), "utf8");
assert.match(campaignIndex, /Seoul Marathon 2027/i, "Campaign index should list active Seoul campaign");
assert.match(campaignIndex, /href="\.\/seoul-2027\/"/, "Campaign index should link to Seoul");
assert.match(campaignIndex, /<p class="section-kicker">Active<\/p>/, "Seoul should be in the active group");
assert.match(seoulPage, /Seoul Marathon 2027/, "Seoul campaign page should show title");
assert.match(seoulPage, /Mar 21, 2027/, "Seoul campaign should show race date");
assert.match(seoulPage, /Week 1 of 20/, "Seoul campaign should have 20-week progress");
assert.match(seoulPage, /20-Week Roadmap/, "Seoul campaign should show roadmap");
assert.match(seoulPage, /Strength A/, "Seoul campaign should include strength routines");
assert.match(seoulPage, /Korean/, "Seoul campaign should include Korean learning");
assert.match(seoulPage, /春节/, "Seoul campaign should include Spring Festival flexibility");
assert.match(seoulPage, /Weekly Reviews/, "Seoul campaign should include weekly review section");
assert.match(seoulPage, /class="is-active"/, "Seoul roadmap should mark active W1");
assert.match(seoulPage, /id="countdown"/, "Active Seoul campaign should show countdown");
assert.match(seoulPage, /href="\.\.\/\.\.\/assets\/life\.css"/, "Seoul campaign should resolve its shared CSS within /plans/");
assert.match(seoulPage, /href="\.\.\/\.\.\/assets\/puran_blog_avator\.jpg"/, "Seoul campaign should resolve its favicon within /plans/");
assert.match(campaignIndex, /href="\.\.\/assets\/life\.css"/, "Campaign index should resolve shared CSS within /plans/");
assert.match(seoulPage, /lean-strength-seoul\.svg/, "Seoul campaign should link to a visual strength guide");
assert.match(seoulPage, /one-exercise-per-muscle-group-guide\.png/, "Seoul campaign should reuse the existing training illustration");
assert.match(seoulPage, /Sejong Korean Introduction/, "Seoul campaign should name the introduction course");
assert.match(seoulPage, /King Sejong Institute Korean 1/, "Seoul campaign should name the follow-up beginner course");
assert.match(seoulPage, /https:\/\/www\.iksi\.or\.kr\//, "Seoul campaign should link to the official Korean learning platform");
const libraryHtml = readFileSync(resolve(root, "library", "index.html"), "utf8");
const journalHtml = readFileSync(resolve(root, "journal", "index.html"), "utf8");
const themeCss = readFileSync(resolve(root, "assets", "life.css"), "utf8");
assert.match(libraryHtml, /Online King Sejong Institute/, "Library should link to the chosen Korean course");
assert.match(libraryHtml, /lean-strength-seoul\.svg/, "Library should link to strength reference");
assert.match(journalHtml, /Tianjin Marathon 2026/, "Journal should preserve completed campaigns");
assert.match(journalHtml, /Week 14/, "Journal should preserve old weekly pages");
assert.match(currentTraining, /历史固定训练参考/, "Current training must be marked as historical reference");
assert.match(campaignPage, /life-campaign-jumps/, "Campaign detail should expose section jump links");
assert.match(themeCss, /life-day-list/, "Shared style should include responsive week cards");
const breakfastPage = readFileSync(resolve(root, "library", "breakfast", "index.html"), "utf8");
const dinnerReference = readFileSync(resolve(root, "library", "dinner", "index.html"), "utf8");
const dinnerPicker = readFileSync(resolve(root, "current", "dinner.html"), "utf8");
assert.match(breakfastPage, /七日早餐参考/, "Breakfast guide should include a seven-day rotation");
assert.match(breakfastPage, /玉米/, "Breakfast should retain familiar staples");
assert.match(dinnerReference, /五种晚餐搭配参考/, "Dinner guide should add the five complete pairings");
assert.match(dinnerReference, /28道/, "Dinner guide should link back to the original picker");
assert.match(libraryHtml, /\.\/breakfast\/index\.html/, "Library should link to breakfast");
assert.match(libraryHtml, /\.\/dinner\/index\.html/, "Library should link to dinner guide");
assert.match(dinnerPicker, /library\/dinner\/index\.html/, "Original dinner tool should link to supplementary guidance");
assert.match(dinnerPicker, /btn-pick/, "Original dinner picker remains interactive");
assert.doesNotMatch(breakfastPage + dinnerReference, /13\.01|47\.5|OGTT|BMI/, "Published food guides should exclude private clinical details");
console.log("Plans site structure looks good.");
