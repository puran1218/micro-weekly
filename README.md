# home-plans

`home-plans` is a small static publishing workflow for shareable dinner and training templates.

The repository keeps two kinds of files:

- `source-html/` contains raw HTML fragments for the current templates and archived weekly snapshots.
- `source-assets/` contains source attachments such as training reference images.
- `static/plans/` contains the publishable pages that are ready to host on Micro.blog.

The generator script fixes standalone rendering problems in the raw fragments, wraps them with the shared site chrome, updates the `latest/` redirects, generates current template pages or archived weekly pages, and rebuilds the plans homepage.

## Repository Layout

```text
.
├── README.md
├── scripts/
│   └── import_plan_html.mjs
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
│       ├── current/
│       ├── index.html
│       ├── latest/
│       └── weeks/
└── tests/
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

## Test the Site

Run the checks with:

```bash
node tests/repo_layout.test.mjs
node tests/import_plan_html.test.mjs
node tests/verify_plans_site.mjs
```

These tests verify:

- the expected repository layout exists
- the import script can generate publishable pages from raw HTML fragments
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

## Current Status

The repository currently includes:

- current dinner template based on the Week 17 dinner pool
- current training template based on Week 22
- training reference guide attachment
- archived Week 14-22 plan pages
- a generator for future weekly imports
- a mobile-friendly homepage, current template pages, per-week archive pages, and latest compatibility links for public sharing
