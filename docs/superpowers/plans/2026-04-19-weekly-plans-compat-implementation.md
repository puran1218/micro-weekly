# Weekly Plans Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add week landing pages, support pool-style dinner pages, preserve historical detail links, and include a shared favicon asset across the generated plans site.

**Architecture:** Extend the existing single generator script so it remains the source of truth for all published HTML under `static/plans/`. Detect dinner mode from source markup, generate a new `weeks/weekXX/index.html` entry page for every imported week, and rebuild homepage/latest pages with shared favicon metadata while leaving existing detail URLs intact.

**Tech Stack:** Node.js, static HTML generation, filesystem-based discovery, Node test scripts

---

### Task 1: Lock in compatibility requirements with tests

**Files:**
- Modify: `tests/import_plan_html.test.mjs`
- Modify: `tests/verify_plans_site.mjs`
- Modify: `tests/repo_layout.test.mjs`

- [ ] **Step 1: Write failing tests for new outputs**

Add assertions for:

- `static/plans/weeks/week17/index.html`
- week archive links pointing to `./weeks/week17/index.html`
- favicon tags in homepage and generated pages
- pool-style dinner page preserving its own interaction shell
- historical detail pages still existing for old weeks

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests/import_plan_html.test.mjs && node tests/verify_plans_site.mjs && node tests/repo_layout.test.mjs`

Expected: FAIL because weekly landing pages, favicon output, and week17 handling do not exist yet.

- [ ] **Step 3: Keep test expectations focused on behavior**

Assert semantic markers such as:

- `Week 17`
- `href="./weeks/week17/index.html"`
- `rel="icon"`
- `surprise-area`

Avoid snapshot-style exact HTML matching.

- [ ] **Step 4: Re-run individual failing tests as needed during implementation**

Run:

- `node tests/import_plan_html.test.mjs`
- `node tests/verify_plans_site.mjs`
- `node tests/repo_layout.test.mjs`

- [ ] **Step 5: Commit after green**

```bash
git add tests/import_plan_html.test.mjs tests/verify_plans_site.mjs tests/repo_layout.test.mjs
git commit -m "test: cover weekly landing pages and favicon output"
```

### Task 2: Extend generator for favicon and dinner mode detection

**Files:**
- Modify: `scripts/import_plan_html.mjs`

- [ ] **Step 1: Add a failing test-driven target in mind**

Implement support for:

- shared favicon tag generation
- copying `puran_blog_avator.jpg` into `static/plans/assets/`
- dinner mode detection for pool markup

- [ ] **Step 2: Write minimal generator helpers**

Add focused helpers in `scripts/import_plan_html.mjs` such as:

- `detectDinnerMode(fragment)`
- `ensureSiteAssets(siteRoot)`
- `buildFaviconMarkup(relativePath)`
- `getRelativeAssetPath(fromDepth, targetPath)`

- [ ] **Step 3: Preserve classic search-link behavior only where appropriate**

Apply searchable-link wrapping only for:

- classic dinner markup with `.dish-name`
- training markup with `.move`

Do not force this behavior onto pool-mode dinner content.

- [ ] **Step 4: Keep pool dinner markup non-invasive**

For pool dinner pages:

- keep the original script block
- keep button behavior
- keep existing IDs/classes
- only wrap with site chrome and shared metadata

- [ ] **Step 5: Commit after green**

```bash
git add scripts/import_plan_html.mjs
git commit -m "feat: support pool dinner pages and favicon assets"
```

### Task 3: Generate weekly landing pages and refresh homepage behavior

**Files:**
- Modify: `scripts/import_plan_html.mjs`

- [ ] **Step 1: Add weekly landing page generation**

Generate `static/plans/weeks/weekXX/index.html` with:

- week title
- dinner card
- training card
- links to `dinner.html` and `training.html`

- [ ] **Step 2: Update homepage generation**

Rebuild homepage so each week row now links primarily to:

- `./weeks/weekXX/index.html`

while still offering direct dinner/training buttons when available.

- [ ] **Step 3: Preserve latest redirects**

Keep:

- `static/plans/latest/dinner.html`
- `static/plans/latest/training.html`

pointing to detail pages rather than weekly landing pages.

- [ ] **Step 4: Re-run test suite**

Run: `node tests/import_plan_html.test.mjs && node tests/verify_plans_site.mjs && node tests/repo_layout.test.mjs`

Expected: PASS

- [ ] **Step 5: Commit after green**

```bash
git add scripts/import_plan_html.mjs static/plans
git commit -m "feat: add weekly landing pages"
```

### Task 4: Import week17 and verify published output

**Files:**
- Add: `source-html/week17_dinner_plan.html`
- Add: `source-html/week17_training_plan.html`
- Generate: `static/plans/weeks/week17/index.html`
- Generate: `static/plans/weeks/week17/dinner.html`
- Generate: `static/plans/weeks/week17/training.html`
- Modify: `static/plans/index.html`
- Modify: `static/plans/latest/dinner.html`
- Modify: `static/plans/latest/training.html`

- [ ] **Step 1: Run generator for week17 dinner**

Run: `node scripts/import_plan_html.mjs source-html/week17_dinner_plan.html`

- [ ] **Step 2: Run generator for week17 training**

Run: `node scripts/import_plan_html.mjs source-html/week17_training_plan.html`

- [ ] **Step 3: Verify generated output**

Check:

- `static/plans/weeks/week17/index.html`
- `static/plans/weeks/week17/dinner.html`
- `static/plans/weeks/week17/training.html`
- `static/plans/assets/puran_blog_avator.jpg`

- [ ] **Step 4: Run full verification**

Run: `node tests/import_plan_html.test.mjs && node tests/verify_plans_site.mjs && node tests/repo_layout.test.mjs`

Expected: PASS

- [ ] **Step 5: Commit after green**

```bash
git add source-html/week17_dinner_plan.html source-html/week17_training_plan.html static/plans
git commit -m "feat: publish week 17 plans"
```

### Task 5: Final repo validation and push-ready cleanup

**Files:**
- Modify: `README.md` if behavior docs need updating

- [ ] **Step 1: Update README only if needed**

Document:

- weekly landing pages
- favicon asset behavior
- dinner pool compatibility

- [ ] **Step 2: Run final verification**

Run: `node tests/import_plan_html.test.mjs && node tests/verify_plans_site.mjs && node tests/repo_layout.test.mjs`

Expected: PASS with no failures.

- [ ] **Step 3: Review git diff**

Run:

- `git status --short`
- `git diff --stat`

- [ ] **Step 4: Create final integration commit**

```bash
git add README.md scripts/import_plan_html.mjs tests source-html static/plans
git commit -m "feat: add weekly landing pages and dinner pool support"
```

- [ ] **Step 5: Push**

```bash
git push origin main
```
