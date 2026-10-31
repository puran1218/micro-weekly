# Life in Motion · Personal Life Playbook

## Product promise

A personal space for four connected questions:

- **This Week:** What will I actually do during the next seven days?
- **Goals:** What longer journey does it serve?
- **Library:** Which routines, exercises, and courses do I want at hand?
- **Journal:** What actually happened, and how did it change the next week?

The site is **not** a gamified habit tracker, a nutrition app, or a second fitness-data repository.

## Single source of truth

A campaign under `campaigns/*.md` owns its active week. The new homepage reads `status: active`, `current_week`, the `This Week` Markdown table, and review metadata. It does not synthesize workout distances or assume missing training was completed. If multiple campaigns are active, the homepage shows their goal cards and one current focus; multi-campaign schedule merging remains future work.

Historic `source-html/current_training_template.html` remains a reference; the new current week is never authored twice. The dinner tool stays in `current/dinner.html`.

## Four surfaces

| Surface | Primary content | Source |
| --- | --- | --- |
| Home / This Week | Current seven-day schedule and current focus | Active campaign |
| Goals | Active/upcoming and completed campaigns | Campaign Markdown |
| Library | Strength, foot-ankle reference, Sejong Korean, dinner tool | Curated static links |
| Journal | Completed campaigns and historical Week 14–22 | Campaign metadata + archived week pages |

Old URLs and `latest/` compatibility aliases remain available, but are no longer main calls to action.

## Weekly review loop

1. Follow the active campaign weekly plan; logging actual activity can occur in Apple Health and a brief diary.
2. At the end of the week, append a `### WN · Dates` block to `Weekly Reviews`, divided conceptually into **Plan**, **Actual**, **Learn**, **Adapt**.
3. Distinguish planned distance from recorded Workout totals; never treat an unrecorded strength session as proof of noncompletion.
4. Move the now-finished week's detailed plan to the campaign roadmap archive.
5. Update `current_week` and `This Week`. Rebuild with `npm run build:campaigns` or `npm run build:site`.
6. Keep prior weeks immutable as historical decisions; if fixing an error, clearly distinguish correction from original record.

The homepage only surfaces existing review metadata. No client-side persistence, authentication, or backend database is required.

## Design system & migration

- Shared paper/sage editorial design in `site/life.css`; responsive day cards for current use, stronger typography for long-form campaigns.
- Build the homepage, library and journal via `scripts/build_life_site.mjs`.
- Both existing generators invoke the new builder, so updating either a routine or campaign updates top-level navigation.
- The builder augments legacy pages with site navigation and explanatory banners without deleting historical records.
- Generated files under `static/plans/` remain published artifacts and should be committed alongside source edits.
- Website pages are read-only; making notes or weekly edits still happens in Markdown in GitHub.

## Verification

Run `npm run build:site && npm test`, then inspect desktop and mobile widths (especially 360–390px). Check navigation, active weekly table, the long 20-week roadmap overflow, dinner picker controls, asset links, archived URLs and repeated-build idempotency.

## Not in this iteration

No rewriting the historic Tianjin review content; no new database or dynamic form persistence; no promise of automatic Health synchronization from a public static page; no data model for non-race campaigns until there is an actual second use case.
