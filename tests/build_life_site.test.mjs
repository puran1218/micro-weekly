import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { buildLifeSite } from "../scripts/build_life_site.mjs";

const root = mkdtempSync(resolve(tmpdir(), "life-playbook-"));
const site = resolve(root, "static", "plans");
const campaigns = resolve(root, "campaigns");
const target = resolve(site, "campaigns", "seoul-2027");
const current = resolve(site, "current");
const archive = resolve(site, "weeks", "week14");
mkdirSync(campaigns, { recursive: true });
mkdirSync(target, { recursive: true });
mkdirSync(current, { recursive: true });
mkdirSync(archive, { recursive: true });

function markdown(week, day) {
  return `---
title: Seoul Marathon 2027
slug: seoul-2027
race_date: 2027-03-21
distance: 42.195 km
status: active
current_week: ${week}
weeks: 20
summary: Running, strength and Korean.
---
## This Week · W${week}

| Day | Morning | Lunch | Korean |
| --- | --- | --- | --- |
| ${day} | Easy Run | Strength A | Hangul |

## 20-Week Roadmap

## Weekly Reviews

## Reference
`;
}

try {
  writeFileSync(resolve(campaigns, "seoul-2027.md"), markdown(1, "Mon"));
  writeFileSync(resolve(target, "index.html"),
    '<!doctype html><html><head></head><body><section class="campaign-current" id="this-week"></section><section id="roadmap"></section><section id="reviews"></section><section id="reference"></section></body></html>');
  writeFileSync(resolve(current, "training.html"),
    '<html><head></head><body><div class="page"><main class="panel">Historical training</main></div></body></html>');
  writeFileSync(resolve(archive, "index.html"),
    '<html><head></head><body><div class="page">Week 14</div></body></html>');

  const first = buildLifeSite(site, root);
  assert.equal(first.active, "seoul-2027");
  assert.equal(first.archivedWeeks, 1);
  assert.ok(existsSync(resolve(site, "assets", "life.css")));
  const breakfast = readFileSync(resolve(site, "library", "breakfast", "index.html"), "utf8");
  const dinnerGuide = readFileSync(resolve(site, "library", "dinner", "index.html"), "utf8");
  const library = readFileSync(resolve(site, "library", "index.html"), "utf8");
  assert.match(breakfast, /七日早餐参考/);
  assert.match(breakfast, /玉米/);
  assert.match(breakfast, /原味燕麦/);
  assert.match(breakfast, /按食材自由搭配/);
  assert.match(dinnerGuide, /五种晚餐搭配参考/);
  assert.match(dinnerGuide, /清蒸鱼/);
  assert.match(dinnerGuide, /current\/dinner\.html/);
  assert.match(library, /\.\/breakfast\/index\.html/);
  assert.match(library, /\.\/dinner\/index\.html/);
  assert.doesNotMatch(breakfast, /13\.01|47\.5|BMI|OGTT/);
  const homeOne = readFileSync(resolve(site, "index.html"), "utf8");
  assert.match(homeOne, /W1 \/ 20/);
  assert.match(homeOne, /Easy Run/);
  assert.match(homeOne, /Strength A/);
  assert.match(homeOne, /Hangul/);
  assert.match(homeOne, /Week 14/);
  assert.doesNotMatch(homeOne, /Historical training/);

  const campaignOnce = readFileSync(resolve(target, "index.html"), "utf8");
  assert.match(campaignOnce, /life-campaign-jumps/);
  assert.match(campaignOnce, /href="\.\.\/\.\.\/assets\/life\.css"/, "Campaign detail theme should use the correct relative path");
  const trainingOnce = readFileSync(resolve(current, "training.html"), "utf8");
  assert.match(trainingOnce, /历史固定训练参考/);
  assert.match(trainingOnce, /life-navigation/);

  buildLifeSite(site, root);
  assert.equal(readFileSync(resolve(target, "index.html"), "utf8"), campaignOnce);
  assert.equal(readFileSync(resolve(current, "training.html"), "utf8"), trainingOnce);

  writeFileSync(resolve(campaigns, "seoul-2027.md"), markdown(2, "Tue"));
  buildLifeSite(site, root);
  const homeTwo = readFileSync(resolve(site, "index.html"), "utf8");
  assert.match(homeTwo, /W2 \/ 20/);
  assert.match(homeTwo, /Tue/);
  assert.doesNotMatch(homeTwo, /W1 \/ 20/);
  console.log("Life in Motion builder works.");
} finally {
  rmSync(root, { recursive: true, force: true });
}
