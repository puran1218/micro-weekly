import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

const requiredPaths = [
  "README.md",
  ".gitignore",
  "scripts/import_plan_html.mjs",
  "tests/import_plan_html.test.mjs",
  "tests/verify_plans_site.mjs",
  "source-assets/one-exercise-per-muscle-group-guide.png",
  "source-html/current_dinner_template.html",
  "source-html/current_training_template.html",
  "source-html/week14_dinner_plan.html",
  "source-html/week14_training_plan.html",
  "source-html/week15_dinner_plan.html",
  "source-html/week15_training_plan.html",
  "source-html/week16_dinner_plan.html",
  "source-html/week16_training_plan.html",
  "source-html/week17_dinner_plan.html",
  "source-html/week17_training_plan.html",
  "source-html/week22_training_plan.html",
  "puran_blog_avator.jpg",
  "static/plans/index.html",
  "static/plans/current/dinner.html",
  "static/plans/current/training.html",
  "static/plans/current/training-reference.html",
];

for (const path of requiredPaths) {
  assert.ok(existsSync(resolve(root, path)), `Expected repo path to exist: ${path}`);
}

console.log("Repo layout looks good.");
