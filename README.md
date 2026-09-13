# home-plans

`home-plans` is a small static publishing workflow for shareable dinner and training templates.

The repository keeps these kinds of files:

- `source-html/` contains raw HTML fragments for the current templates and archived weekly snapshots.
- `campaigns/` contains Markdown sources for long-term race training campaigns.
- `source-assets/` contains source attachments such as training reference images.
- `static/plans/` contains the publishable pages that are ready to host on Micro.blog.

The weekly generator fixes standalone rendering problems in the raw fragments, wraps them with the shared site chrome, updates the `latest/` redirects, generates current template pages or archived weekly pages, and rebuilds the plans homepage.

Training campaigns are a separate, parallel publishing chain: `campaigns/*.md` is the canonical source and `scripts/import_campaign_md.mjs` generates the campaign pages. Generated files under `static/plans/` are always outputs — never edit them by hand.

## Repository Layout

```text
.
├── README.md
├── package.json
├── scripts/
│   ├── import_campaign_md.mjs
│   └── import_plan_html.mjs
├── campaigns/
│   └── tj-2026.md
├── source-html/
│   ├── current_dinner_template.html
│   ├── current_training_template.html
│   ├── week14_dinner_plan.html
│   └── week14_training_plan.html
├── source-assets/
│   └── one-exercise-per-muscle-group-guide.png
├── static/
│   └── plans/
│       ├── assets/
│       ├── campaigns/
│       │   ├── index.html
│       │   └── tj-2026/
│       │       └── index.html
│       ├── current/
│       ├── index.html
│       ├── latest/
│       └── weeks/
└── tests/
    ├── import_campaign_md.test.mjs
    ├── import_plan_html.test.mjs
    ├── repo_layout.test.mjs
    └── verify_plans_site.mjs
```

## How It Works

Current template source files should follow this naming pattern:

- `current_dinner_template.html`
- `current_training_template.html`

Archived weekly source files should follow this naming pattern:

- `week15_dinner_plan.html`
- `week15_training_plan.html`

When you import one of these source files, the script will:

1. Detect whether the source is a current template or archived weekly page.
2. Add CSS fallbacks so borders and text colors still render correctly as standalone HTML.
3. Detect whether dinner content is a classic weekly plan or a `dish_pool_surprise_me` style dinner pool.
4. Turn classic dinner dish names and training moves into search links.
5. Generate current template pages under `static/plans/current/` or archived detail pages under `static/plans/weeks/weekXX/`.
6. Generate a weekly landing page at `static/plans/weeks/weekXX/index.html` for archived weeks.
7. Copy the shared blog avatar and training guide into `static/plans/assets/`.
8. Update `static/plans/latest/` to point at the current templates.
9. Rebuild `static/plans/index.html` with current template cards and the archive list.

The search platform is controlled globally in `scripts/import_plan_html.mjs`. It defaults to YouTube, and can be switched later to another provider such as Bilibili without changing each item by hand.

Pool-style dinner pages are treated differently on purpose:

- their interactive markup and scripts are preserved
- forced per-dish search links are not injected
- the old "video tutorial" button is stripped from the published output

## Maintain Current Templates

From Week 22 onward, this project no longer creates new week folders by default. Update the current template sources, then run:

```bash
node scripts/import_plan_html.mjs source-html/current_dinner_template.html
node scripts/import_plan_html.mjs source-html/current_training_template.html
```

After that, the generated pages will appear here:

- `static/plans/current/dinner.html`
- `static/plans/current/training.html`
- `static/plans/current/training-reference.html`
- `static/plans/latest/dinner.html`
- `static/plans/latest/training.html`

## Import an Archived Week

Put the new raw HTML file in `source-html/`, then run:

```bash
node scripts/import_plan_html.mjs source-html/week15_dinner_plan.html
node scripts/import_plan_html.mjs source-html/week15_training_plan.html
```

After that, the generated pages will appear here:

- `static/plans/weeks/week15/index.html`
- `static/plans/weeks/week15/dinner.html`
- `static/plans/weeks/week15/training.html`
- `static/plans/latest/dinner.html`
- `static/plans/latest/training.html`

## Training Campaigns

A training campaign is the canonical record for one race: the current week, the complete roadmap, appended weekly reviews, and a reusable training reference. It is a parallel content type — the weekly/current templates above stay the general weekly exercise plan.

The publishing flow:

```text
campaigns/tj-2026.md
    → scripts/import_campaign_md.mjs
    → static/plans/campaigns/tj-2026/index.html
    → static/plans/campaigns/index.html
```

Public URL: `/plans/campaigns/tj-2026/`. Campaign slugs such as `seoul-2027` or `bj-half-2027` will work the same way.

### Author a Campaign

Create `campaigns/<slug>.md` with strict scalar front matter:

```md
---
title: Tianjin Marathon 2026
slug: tj-2026
race_date: 2026-10-25
distance: 42.195 km
status: active
current_week: 1
weeks: 8
summary: Healthy start → stable finish → structurally stable after 30 km.
---
```

Rules enforced by the generator:

- `slug` must be lowercase kebab-case; the output path can never escape `static/plans/campaigns/`.
- `race_date` must be a real calendar date in `YYYY-MM-DD` format.
- `status` is one of `upcoming`, `active`, `completed`.
- `current_week` must be a positive integer between `1` and `weeks`.

One optional field: `note:` renders as a quiet italic line under the race facts on the campaign page and on the campaign index row — use it for small personal context such as a lottery result.

Below the front matter, use these H2 section headings (rendered Markdown only — no HTML or CSS in the source):

- `This Week` — the current week plan; the most prominent section on the page.
- `N-Week Roadmap` (for example `8-Week Roadmap`, `6-Week Roadmap`, `10-Week Roadmap`) — the phase-by-phase plan table; keep the number in sync with the `weeks` front-matter field.
- `Weekly Reviews` — append one H3 block per finished week.
- `Reference` — effort levels, strength routines, checklists, pain rules.

Campaigns of any length work the same way: `weeks: 6` in the front matter makes the progress route run W1…W6…Race, and a `6-Week Roadmap` heading is recognized exactly like an 8-week one. Content before the first recognized H2 (the H1 and tagline) is only for readers of the Markdown file — the page header is generated from the front matter, so that text does not appear on the page. Write plain Markdown; no HTML or CSS in the source.

Content before the first recognized H2 (for example the H1 title and a tagline) is for readers of the Markdown file; the page header is generated from the front matter. The race title, date, distance, countdown, current-week marker, and the W1…WN…Race progress route are all generated automatically. The countdown is computed at build time and kept fresh with a small progressive-enhancement script in the browser.

### Build Campaigns

```bash
node scripts/import_campaign_md.mjs campaigns/tj-2026.md
node scripts/import_campaign_md.mjs --all
```

A single-file build rebuilds that page plus the campaign index. `--all` rebuilds every campaign page plus the index. The campaign index groups campaigns as active first, then upcoming by race date ascending, then completed by race date descending. The plans homepage links to `./campaigns/index.html` through a stable generic entry in the weekly generator, so weekly rebuilds never remove it.

### Run the Weekly Review Loop

At the end of each training week:

1. Fill in the finished week under `Weekly Reviews` in `campaigns/tj-2026.md`.
2. Backfill the finished week as a `### WN · Phase` detail block under the roadmap, so its full plan stays on the page after `This Week` moves on.
3. Adjust the next week's plan inside `This Week`.
4. Bump `current_week:` in the front matter and update the `This Week · W#` heading.
5. Rebuild and commit the source and the generated output together:

```bash
node scripts/import_campaign_md.mjs campaigns/tj-2026.md
git add campaigns/tj-2026.md static/plans/campaigns
git commit -m "docs(training): review week 1 and plan week 2"
```

### Start a New Campaign

Copy `campaigns/tj-2026.md` to `campaigns/<new-slug>.md`, rewrite the front matter and sections for the new race, then run a single-file build. No other configuration is needed.

## Test the Site

Run the checks with:

```bash
node tests/repo_layout.test.mjs
node tests/import_plan_html.test.mjs
node tests/import_campaign_md.test.mjs
node tests/verify_plans_site.mjs
```

Or all of them at once:

```bash
npm test
```

These tests verify:

- the expected repository layout exists
- the import script can generate publishable pages from raw HTML fragments
- the campaign generator can build campaign pages and the campaign index from `campaigns/*.md`
- the generated site still has the expected homepage, week landing pages, detail pages, favicon assets, and `latest/` entry points

## Publishing to Micro.blog

This repo is structured so `static/plans/` can be published as static content through a Micro.blog plug-in or another static hosting workflow.

The main entry points are:

- `static/plans/index.html`
- `static/plans/current/dinner.html`
- `static/plans/current/training.html`
- `static/plans/current/training-reference.html`
- `static/plans/latest/dinner.html`
- `static/plans/latest/training.html`
- `static/plans/weeks/weekXX/index.html`
- `static/plans/campaigns/index.html`
- `static/plans/campaigns/<slug>/index.html`

## Current Status

The repository currently includes:

- current dinner template based on the Week 17 dinner pool
- current training template based on Week 22
- training reference guide attachment
- archived Week 14-22 plan pages
- a generator for future weekly imports
- the Tianjin Marathon 2026 training campaign (`tj-2026`) with a Markdown-first generator (很遗憾没有中签，仍照着计划训练)
- a mobile-friendly homepage, current template pages, per-week archive pages, campaign pages, and latest compatibility links for public sharing
