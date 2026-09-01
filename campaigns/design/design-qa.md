# Design QA

- Source visual truth: `/workspace/scratch/b0b2290cf7de/generated_images/exec-90580397-d46b-4bf2-963b-dd69eaad928b.png`
- Implementation: `http://terminal.local:4173/`
- Desktop viewport: 1363 × 936 CSS px
- Mobile viewport: 375 × 844 CSS px inside a 390 px responsive test frame
- Source pixels: 853 × 1825
- Implementation screenshots: browser-rendered desktop and mobile captures inspected during QA; no local screenshot path was available from the cloud browser
- State: Week 1, default page state

## Full-view comparison evidence

The implementation preserves the selected design's warm graph-paper background, narrow editorial typography, red race accent, vertical distance scale, eight-week route progression, oversized race title, prominent current-week block, ruled training schedule and compact roadmap. The concept label and the phrases “Kilometre Ledger”, “Training Notes” and “Markdown First” were intentionally removed at the user's request.

## Focused region comparison evidence

The top campaign area and current-week region were inspected at desktop and mobile widths. The mobile capture confirms that the headline, race facts, route progression, current-week heading, target and focus remain readable without horizontal overflow. The long-page sections were checked through DOM dimensions and content presence; no separate focused capture was needed because these sections reuse the same typography, line and grid tokens established above the fold.

## Required fidelity surfaces

- Fonts and typography: condensed system serif/sans pair preserves the source hierarchy and editorial character; mobile line wrapping remains intentional and readable.
- Spacing and layout rhythm: desktop retains the asymmetric course margin; mobile removes the side scale and uses a single readable column.
- Colors and tokens: warm paper, near-black ink, muted gray and restrained race red match the source direction.
- Image and asset fidelity: the selected design contains no raster imagery, logos or custom icons requiring recreation. Route and progress marks are semantic timeline/progress UI.
- Copy and content: real Tianjin training-plan content replaces mock placeholders. Disallowed design-concept copy is absent.

## Comparison history

- Initial desktop pass: no P0/P1/P2 issues. The title, progress route and current-week hierarchy matched the source direction.
- Initial mobile pass: no P0/P1/P2 issues. Width 375 px, scroll width 375 px; no horizontal overflow.

## Browser verification

- Page title and campaign content loaded successfully.
- Primary interactions: no interactive controls are present; page scrolling and responsive layout are the primary experience.
- Console: no page-owned errors or warnings. One unrelated browser-extension metadata error was observed.

## Findings

No actionable P0/P1/P2 differences remain.

## Follow-up polish

- P3: when integrated into Micro.blog, verify the hosted environment exposes comparable condensed serif/sans fonts or bundle the chosen webfont files.

final result: passed
