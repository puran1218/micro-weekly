# micro-weekly

`micro-weekly` is a small static publishing workflow for shareable weekly dinner and training plans.

The repository keeps two kinds of files:

- `source-html/` contains the raw HTML fragments you create or export each week.
- `static/plans/` contains the publishable pages that are ready to host on Micro.blog.

The generator script fixes the standalone rendering problems in the raw fragments, wraps them with the lighter site chrome, updates the `latest/` redirects, and rebuilds the plans homepage.

## Repository Layout

```text
.
├── README.md
├── scripts/
│   └── import_plan_html.mjs
├── source-html/
│   ├── week14_dinner_plan.html
│   └── week14_training_plan.html
├── static/
│   └── plans/
│       ├── index.html
│       ├── latest/
│       └── weeks/
└── tests/
    ├── import_plan_html.test.mjs
    ├── repo_layout.test.mjs
    └── verify_plans_site.mjs
```

## How It Works

Each weekly source file should follow this naming pattern:

- `week15_dinner_plan.html`
- `week15_training_plan.html`

When you import one of these source files, the script will:

1. Detect the week number and plan type from the filename.
2. Add CSS fallbacks so borders and text colors still render correctly as standalone HTML.
3. Turn every dish name and training move into a search link.
4. Generate a polished publishable page under `static/plans/weeks/weekXX/`.
5. Update `static/plans/latest/` to point at the newest imported week.
6. Rebuild `static/plans/index.html` with the latest-first homepage and archive list.

The search platform is controlled globally in `scripts/import_plan_html.mjs`. It defaults to YouTube, and can be switched later to another provider such as Bilibili without changing each item by hand.

## Import a New Week

Put the new raw HTML file in `source-html/`, then run:

```bash
node scripts/import_plan_html.mjs source-html/week15_dinner_plan.html
node scripts/import_plan_html.mjs source-html/week15_training_plan.html
```

After that, the generated pages will appear here:

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
- the generated site still has the expected homepage, week pages, and `latest/` entry points

## Publishing to Micro.blog

This repo is structured so `static/plans/` can be published as static content through a Micro.blog plug-in or another static hosting workflow.

The main entry points are:

- `static/plans/index.html`
- `static/plans/latest/dinner.html`
- `static/plans/latest/training.html`

## Current Status

The repository currently includes:

- Week 14 dinner plan
- Week 14 training plan
- a generator for future weekly imports
- a mobile-friendly homepage and latest links for public sharing
