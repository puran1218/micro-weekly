# Weekly Plans Compatibility Design

Date: 2026-04-19

## Goal

Evolve the plans site from a flat "week -> dinner/training pages" model into a more durable weekly entry model without breaking historical links.

This design must support:

- Existing history for weeks 14-16
- New week-level landing pages at `weeks/weekXX/index.html`
- Two dinner content modes:
  - classic weekly dinner plan
  - long-lived `dish_pool_surprise_me` dinner page
- Shared site chrome and favicon across all generated pages
- Future weeks where only training is updated while dinner continues to point to a reusable pool page

## Non-Goals

- Rewriting the raw source HTML format
- Turning the project into a full CMS
- Migrating existing public URLs away from `dinner.html`, `training.html`, or `latest/*.html`

## Proposed Structure

### Site Information Architecture

Keep the current public URLs, but add a new weekly entry layer:

- `static/plans/index.html`
  - top-level plans homepage
- `static/plans/latest/dinner.html`
  - latest dinner redirect, preserved
- `static/plans/latest/training.html`
  - latest training redirect, preserved
- `static/plans/weeks/weekXX/index.html`
  - new weekly landing page
- `static/plans/weeks/weekXX/dinner.html`
  - weekly dinner page or generated dinner pool page
- `static/plans/weeks/weekXX/training.html`
  - weekly training page

History remains valid because previously published detail URLs are not removed or renamed.

### Homepage Behavior

The plans homepage continues to list weeks in reverse chronological order, but each week row links primarily to the new weekly landing page.

It may still expose direct `Dinner` and `Training` quick actions for convenience, but the canonical week-level navigation becomes `weekXX/index.html`.

### Weekly Landing Page Behavior

Each week gets a compact landing page with:

- week title
- short summary/status copy
- one `Training` card
- one `Dinner` card

The dinner card can point to:

- that week's generated dinner page, or
- a reusable dinner pool page if the raw dinner source is a long-lived pool variant

This allows future weeks to update only training while keeping dinner stable.

## Dinner Modes

### Mode A: Classic Weekly Dinner Plan

If the dinner source matches the older card/table-like markup, keep the current transformation behavior:

- inject standalone CSS fallbacks
- wrap with site shell
- add searchable links to dish names when selectors match the classic structure

### Mode B: `dish_pool_surprise_me`

If the dinner source uses the newer pool-based structure:

- keep the raw interaction model intact
- do not inject per-dish search links into the content
- preserve the shared site shell and page styling
- keep the existing in-page script behavior unless explicitly disabled by source markup

Detection should be markup-based rather than week-based so the generator remains future-proof.

Recommended detection rule:

- treat content as pool mode when root markup contains stable pool-specific markers such as `.pool-wrap`, `#surprise-area`, or `btn-pick`

## Visual System

### Shared Chrome

All generated pages should share:

- consistent hero/header shell
- same spacing and glass-card style already established
- same typography and mobile-first layout

### Favicon

The avatar image `puran_blog_avator.jpg` should be copied into the publishable tree, for example:

- `static/plans/assets/puran_blog_avator.jpg`

All generated pages should emit favicon tags that reference the asset with relative paths appropriate to each output location.

This avoids depending on Micro.blog theme inheritance or on files outside the published plugin payload.

## Generation Changes

### Generator Responsibilities

The import script should continue to be the single source of generated output and should now additionally:

- write or refresh `weeks/weekXX/index.html`
- rebuild the global homepage to link to weekly landing pages
- include shared favicon metadata in homepage, weekly landing pages, detail pages, and latest redirects
- branch dinner rendering behavior based on detected dinner mode

### Week Record Model

The week record built from `static/plans/weeks/weekXX/` should expand to include:

- `hasDinner`
- `hasTraining`
- `hasWeekIndex`
- optional dinner mode metadata when inferable

The generator does not need a separate database; filesystem-derived state is sufficient.

## Link Compatibility

Compatibility rules:

- Preserve existing `dinner.html` and `training.html` URLs
- Preserve `latest/dinner.html` and `latest/training.html`
- Add `weeks/weekXX/index.html` without replacing old pages
- Avoid introducing redirects from old detail URLs to the new weekly landing page

This keeps old bookmarks, Micro.blog pages, and previously shared links working.

## Error Handling

The generator should fail fast when:

- the input filename does not match the expected `weekNN_kind_plan.html` pattern
- the source file does not exist
- a requested search provider is unknown

The generator should be tolerant when:

- a week has only training or only dinner
- dinner source does not match classic searchable selectors
- favicon asset copy target already exists

Pool-mode dinner should not fail merely because classic selectors are absent.

## Testing Strategy

Update tests to cover:

- homepage includes week landing page links
- each imported week gets `weeks/weekXX/index.html`
- latest redirects continue to point to detail pages
- classic dinner pages still receive searchable links
- pool-mode dinner pages do not require searchable links to pass
- favicon tags appear on homepage and generated detail/week pages
- historical week detail paths remain present

At least one fixture should verify the new pool dinner mode using week17.

## Recommended Rollout

1. Add favicon asset handling
2. Add weekly landing page generation
3. Update homepage generation to surface weekly landing pages
4. Add pool-mode dinner detection and non-invasive rendering behavior
5. Import week17 and verify history still works

## Risks and Mitigations

### Risk: brittle source detection

Mitigation:

- use a small set of explicit pool markers
- keep detection logic isolated in one function

### Risk: broken relative asset paths

Mitigation:

- centralize relative favicon path generation by page depth
- verify generated HTML in tests

### Risk: old tests overfit the flat structure

Mitigation:

- update tests to assert compatibility, not exact old layout assumptions

## Open Decision Resolved

The chosen compatibility path is:

- add new weekly landing pages for weeks 14-17 and future weeks
- keep old detail links intact
- treat dinner as either weekly or reusable pool content depending on detected markup
