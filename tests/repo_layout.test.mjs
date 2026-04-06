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
  "source-html/week14_dinner_plan.html",
  "source-html/week14_training_plan.html",
  "source-html/week15_dinner_plan.html",
  "source-html/week15_training_plan.html",
  "static/plans/index.html",
];

for (const path of requiredPaths) {
  assert.ok(existsSync(resolve(root, path)), `Expected repo path to exist: ${path}`);
}

console.log("Repo layout looks good.");
