import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const workspace = process.cwd();
const generatorPath = resolve(workspace, "scripts", "import_campaign_md.mjs");
const tempRoot = mkdtempSync(resolve(tmpdir(), "campaign-import-"));

function campaignMarkdown(overrides = {}) {
  const meta = {
    title: "Test City Marathon 2026",
    slug: "test-2026",
    race_date: "2026-10-25",
    distance: "42.195 km",
    status: "active",
    current_week: 1,
    weeks: 8,
    summary: "Healthy start → stable finish → structurally stable after 30 km.",
    ...overrides,
  };

  const front = Object.entries(meta)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const body = `
## This Week · W1

Aug 31 – Sep 6, 2026

Target: 30–35 km
Focus: Run easy.

| Day | Training |
| --- | --- |
| Mon | Rest |
| Sun | 14–16 km LDR Easy |

## 8-Week Roadmap

| Week | Dates | Phase | Target |
| --- | --- | --- | --- |
| W1 | Aug 31 – Sep 6 | Foundation | 30–35 km |
| W2 | Sep 7 – Sep 13 | Build | 35–40 km |

### W2 · Build

- Tempo: 3 × 8 min

## Weekly Reviews

### Week 1 · Aug 31 – Sep 6

- Actual distance:
- Review:

## Reference

### Effort

- Easy / LDR: RPE 3–4

### Pain Signal

- Green · 0–2/10: continue
- Red · 5+/10: stop
`;

  return `---
${front}
---
${body}`;
}

function makeFixtureWorkspace(name, files) {
  const fixtureRoot = resolve(tempRoot, name);
  const campaignsDir = resolve(fixtureRoot, "campaigns");
  const siteRoot = resolve(fixtureRoot, "static", "plans");
  mkdirSync(campaignsDir, { recursive: true });

  for (const [filename, content] of Object.entries(files)) {
    writeFileSync(resolve(campaignsDir, filename), content);
  }

  return { fixtureRoot, campaignsDir, siteRoot };
}

function runGenerator(args, cwd) {
  return spawnSync("node", [generatorPath, ...args], { cwd, encoding: "utf8" });
}

function assertSuccess(result, label) {
  assert.strictEqual(
    result.status,
    0,
    `${label} should succeed. stderr: ${result.stderr}`,
  );
}

function assertFailure(result, label, expectedPattern) {
  assert.notStrictEqual(result.status, 0, `${label} should fail`);
  if (expectedPattern) {
    assert.match(result.stderr, expectedPattern, `${label} should explain the failure`);
  }
}

// ---------------------------------------------------------------------------
// Single-file generation
// ---------------------------------------------------------------------------
{
  const { fixtureRoot, siteRoot } = makeFixtureWorkspace("single", {
    "tj-2026.md": campaignMarkdown({ slug: "tj-2026", title: "Tianjin Marathon 2026" }),
  });

  const result = runGenerator(["campaigns/tj-2026.md", "--site-root", siteRoot], fixtureRoot);
  assertSuccess(result, "single-file generation");

  const campaignPage = resolve(siteRoot, "campaigns", "tj-2026", "index.html");
  const campaignIndex = resolve(siteRoot, "campaigns", "index.html");
  assert.ok(existsSync(campaignPage), "single-file build should write the campaign page");
  assert.ok(existsSync(campaignIndex), "single-file build should rebuild the campaign index");

  // Adding a second campaign and building only it must still refresh the index with both.
  writeFileSync(
    resolve(fixtureRoot, "campaigns", "seoul-2027.md"),
    campaignMarkdown({ slug: "seoul-2027", title: "Seoul Marathon 2027", status: "upcoming", race_date: "2027-03-21" }),
  );
  const secondResult = runGenerator(["campaigns/seoul-2027.md", "--site-root", siteRoot], fixtureRoot);
  assertSuccess(secondResult, "second single-file generation");

  const indexHtml = readFileSync(campaignIndex, "utf8");
  assert.match(indexHtml, /href="\.\/tj-2026\/"/, "index rebuilt by a single-file build should keep earlier campaigns");
  assert.match(indexHtml, /href="\.\/seoul-2027\/"/, "index rebuilt by a single-file build should include the new campaign");
}

// ---------------------------------------------------------------------------
// --all generation
// ---------------------------------------------------------------------------
{
  const { fixtureRoot, siteRoot } = makeFixtureWorkspace("all", {
    "tj-2026.md": campaignMarkdown({ slug: "tj-2026", title: "Tianjin Marathon 2026" }),
    "bj-half-2027.md": campaignMarkdown({ slug: "bj-half-2027", title: "Beijing Half Marathon 2027", status: "upcoming", race_date: "2027-04-11" }),
  });

  const result = runGenerator(["--all", "--site-root", siteRoot], fixtureRoot);
  assertSuccess(result, "--all generation");

  assert.ok(existsSync(resolve(siteRoot, "campaigns", "tj-2026", "index.html")), "--all should build tj-2026");
  assert.ok(existsSync(resolve(siteRoot, "campaigns", "bj-half-2027", "index.html")), "--all should build bj-half-2027");
  assert.ok(existsSync(resolve(siteRoot, "campaigns", "index.html")), "--all should build the campaign index");
}

// ---------------------------------------------------------------------------
// Metadata rendering
// ---------------------------------------------------------------------------
{
  const { fixtureRoot, siteRoot } = makeFixtureWorkspace("meta", {
    "tj-2026.md": campaignMarkdown({ slug: "tj-2026", title: "Tianjin Marathon 2026" }),
  });
  assertSuccess(runGenerator(["--all", "--site-root", siteRoot], fixtureRoot), "meta fixture build");

  const pageHtml = readFileSync(resolve(siteRoot, "campaigns", "tj-2026", "index.html"), "utf8");
  assert.match(pageHtml, /<title>Tianjin Marathon 2026<\/title>/, "page title metadata should come from front matter");
  assert.match(pageHtml, /<h1>Tianjin Marathon 2026<\/h1>/, "race title should render as the editorial h1");
  assert.match(pageHtml, /Oct 25, 2026/, "race date should render");
  assert.match(pageHtml, /42\.195 km/, "distance should render");
  assert.match(pageHtml, /Week 1 of 8/, "current week over total weeks should render");
  assert.match(pageHtml, /data-race-date="2026-10-25"/, "countdown should carry the race date for progressive enhancement");
  assert.match(pageHtml, /Healthy start → stable finish → structurally stable after 30 km\./, "summary should render as the page description");
}

// ---------------------------------------------------------------------------
// Markdown table rendering
// ---------------------------------------------------------------------------
{
  const { fixtureRoot, siteRoot } = makeFixtureWorkspace("tables", {
    "tj-2026.md": campaignMarkdown({ slug: "tj-2026" }),
  });
  assertSuccess(runGenerator(["--all", "--site-root", siteRoot], fixtureRoot), "tables fixture build");

  const pageHtml = readFileSync(resolve(siteRoot, "campaigns", "tj-2026", "index.html"), "utf8");
  assert.match(pageHtml, /<table>/i, "markdown tables should render as HTML tables");
  assert.match(pageHtml, /14–16 km LDR Easy/, "this-week schedule rows should survive rendering");
  assert.match(pageHtml, /Foundation/, "roadmap table content should survive rendering");
}

// ---------------------------------------------------------------------------
// Semantic section wrappers
// ---------------------------------------------------------------------------
{
  const { fixtureRoot, siteRoot } = makeFixtureWorkspace("sections", {
    "tj-2026.md": campaignMarkdown({ slug: "tj-2026" }),
  });
  assertSuccess(runGenerator(["--all", "--site-root", siteRoot], fixtureRoot), "sections fixture build");

  const pageHtml = readFileSync(resolve(siteRoot, "campaigns", "tj-2026", "index.html"), "utf8");
  for (const sectionClass of ["campaign-current", "campaign-roadmap", "campaign-reviews", "campaign-reference"]) {
    assert.match(pageHtml, new RegExp(`class="[^"]*\\b${sectionClass}\\b[^"]*"`), `section wrapper .${sectionClass} should exist`);
  }
  assert.match(pageHtml, /This Week <em>· W1<\/em>/, "this-week heading should keep the accent week marker");
}

// ---------------------------------------------------------------------------
// Campaign index generation, status grouping, and date ordering
// ---------------------------------------------------------------------------
{
  const { fixtureRoot, siteRoot } = makeFixtureWorkspace("index", {
    "c-active.md": campaignMarkdown({ slug: "c-active", title: "Active Race 2026", status: "active", race_date: "2026-10-25" }),
    "c-upcoming-early.md": campaignMarkdown({ slug: "c-upcoming-early", title: "Early Upcoming Race 2027", status: "upcoming", race_date: "2027-01-17" }),
    "c-upcoming-late.md": campaignMarkdown({ slug: "c-upcoming-late", title: "Late Upcoming Race 2027", status: "upcoming", race_date: "2027-04-11" }),
    "c-done-new.md": campaignMarkdown({ slug: "c-done-new", title: "Newer Completed Race", status: "completed", race_date: "2025-10-26" }),
    "c-done-old.md": campaignMarkdown({ slug: "c-done-old", title: "Older Completed Race", status: "completed", race_date: "2024-10-27" }),
  });
  assertSuccess(runGenerator(["--all", "--site-root", siteRoot], fixtureRoot), "index fixture build");

  const indexHtml = readFileSync(resolve(siteRoot, "campaigns", "index.html"), "utf8");
  const positions = [
    ["Active Race 2026", indexHtml.indexOf("Active Race 2026")],
    ["Early Upcoming Race 2027", indexHtml.indexOf("Early Upcoming Race 2027")],
    ["Late Upcoming Race 2027", indexHtml.indexOf("Late Upcoming Race 2027")],
    ["Newer Completed Race", indexHtml.indexOf("Newer Completed Race")],
    ["Older Completed Race", indexHtml.indexOf("Older Completed Race")],
  ];

  for (const [label, position] of positions) {
    assert.ok(position >= 0, `campaign index should list ${label}`);
  }

  for (let i = 0; i < positions.length - 1; i += 1) {
    assert.ok(
      positions[i][1] < positions[i + 1][1],
      `${positions[i][0]} should be listed before ${positions[i + 1][0]} (active first, upcoming by date asc, completed by date desc)`,
    );
  }

  assert.match(indexHtml, /Week 1 of 8/, "campaign index should show progress for active and upcoming campaigns");
  assert.match(indexHtml, /href="\.\/c-active\/"/, "campaign index should link to each campaign page");
  assert.match(indexHtml, /href="\.\.\/index\.html"/, "campaign index should link back to /plans/");
  assert.match(indexHtml, /rel="icon"/, "campaign index should include favicon metadata");
  assert.match(indexHtml, /<meta name="viewport" content="width=device-width, initial-scale=1">/, "campaign index should include viewport metadata");
}

// ---------------------------------------------------------------------------
// Validation failures
// ---------------------------------------------------------------------------
{
  const invalidCases = [
    {
      name: "invalid slug",
      overrides: { slug: "TJ 2026!" },
      pattern: /slug/i,
    },
    {
      name: "path-escaping slug",
      overrides: { slug: "../escape" },
      pattern: /slug/i,
    },
    {
      name: "missing title",
      overrides: { title: undefined },
      pattern: /title/i,
    },
    {
      name: "missing summary",
      overrides: { summary: undefined },
      pattern: /summary/i,
    },
    {
      name: "invalid race date",
      overrides: { race_date: "2026-13-40" },
      pattern: /race_date/i,
    },
    {
      name: "non-ISO race date",
      overrides: { race_date: "October 25" },
      pattern: /race_date/i,
    },
    {
      name: "invalid status",
      overrides: { status: "paused" },
      pattern: /status/i,
    },
    {
      name: "non-numeric current week",
      overrides: { current_week: "one" },
      pattern: /current_week/i,
    },
    {
      name: "current week beyond plan length",
      overrides: { current_week: 9 },
      pattern: /current_week/i,
    },
    {
      name: "zero weeks",
      overrides: { weeks: 0 },
      pattern: /weeks/i,
    },
  ];

  invalidCases.forEach((testCase, index) => {
    const meta = { ...testCase.overrides };
    const { fixtureRoot, siteRoot } = makeFixtureWorkspace(`invalid-${index}`, {
      "broken.md": campaignMarkdown(meta),
    });

    const result = runGenerator(["--all", "--site-root", siteRoot], fixtureRoot);
    assertFailure(result, `campaign with ${testCase.name}`, testCase.pattern);
    assert.ok(
      !existsSync(resolve(siteRoot, "campaigns", "escape", "index.html")),
      "an unsafe slug must never create an output directory",
    );
  });
}

// ---------------------------------------------------------------------------
// Required navigation and favicon metadata on the campaign page
// ---------------------------------------------------------------------------
{
  const { fixtureRoot, siteRoot } = makeFixtureWorkspace("nav", {
    "tj-2026.md": campaignMarkdown({ slug: "tj-2026", title: "Tianjin Marathon 2026" }),
  });
  assertSuccess(runGenerator(["--all", "--site-root", siteRoot], fixtureRoot), "nav fixture build");

  const pageHtml = readFileSync(resolve(siteRoot, "campaigns", "tj-2026", "index.html"), "utf8");
  assert.match(pageHtml, /<meta name="viewport" content="width=device-width, initial-scale=1">/, "campaign page should include viewport metadata");
  assert.match(pageHtml, /<link rel="icon"[^>]*href="\.\.\/\.\.\/\.\.\/assets\/puran_blog_avator\.jpg"/, "campaign page should point at the project favicon");
  assert.match(pageHtml, /href="\.\.\/index\.html"/, "campaign page should link back to /plans/campaigns/");
  assert.match(pageHtml, /href="\.\.\/\.\.\/index\.html"/, "campaign page should link back to /plans/");
}

rmSync(tempRoot, { recursive: true, force: true });
console.log("Campaign markdown generator contract looks good.");
