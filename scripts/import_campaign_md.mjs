import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { marked } from "marked";

const CAMPAIGN_SECTIONS = [
  { prefix: "this week", key: "current", display: "This Week" },
  { prefix: "8-week roadmap", key: "roadmap", display: "8-Week Roadmap" },
  { prefix: "weekly reviews", key: "reviews", display: "Weekly Reviews" },
  { prefix: "reference", key: "reference", display: "Reference" },
];

const SECTION_KICKERS = {
  current: "Current plan",
  roadmap: "The road ahead",
  reviews: "Review & adapt",
  reference: "Keep close",
};

const SECTION_IDS = {
  current: "this-week",
  roadmap: "roadmap",
  reviews: "reviews",
  reference: "reference",
};

const SECTION_CLASSES = {
  current: "campaign-current",
  roadmap: "campaign-roadmap",
  reviews: "campaign-reviews",
  reference: "campaign-reference",
};

const STATUS_ORDER = { active: 0, upcoming: 1, completed: 2 };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FAVICON_FILENAME = "puran_blog_avator.jpg";

function main(args) {
  const options = parseArgs(args);

  if (!options.all && !options.file) {
    throw new Error("Usage: node scripts/import_campaign_md.mjs <campaigns/<slug>.md | --all> [--site-root <path>]");
  }

  const siteRoot = options.siteRoot
    ? resolve(process.cwd(), options.siteRoot)
    : resolve(process.cwd(), "static", "plans");
  const campaignsDir = resolve(process.cwd(), "campaigns");
  const campaignsOutputRoot = resolve(siteRoot, "campaigns");

  if (!existsSync(campaignsDir)) {
    throw new Error(`Campaigns directory not found: ${campaignsDir}`);
  }

  const mdFiles = readdirSync(campaignsDir).filter((name) => name.endsWith(".md")).sort();

  if (mdFiles.length === 0) {
    throw new Error(`No campaign markdown files found in ${campaignsDir}`);
  }

  const records = mdFiles.map((name) => buildCampaignRecord(resolve(campaignsDir, name)));

  if (options.all) {
    for (const record of records) {
      writeCampaignPage(record, campaignsOutputRoot);
    }
  } else {
    const sourcePath = resolve(process.cwd(), options.file);

    if (!sourcePath.endsWith(".md")) {
      throw new Error(`Campaign source must be a Markdown file: ${options.file}`);
    }

    if (!existsSync(sourcePath)) {
      throw new Error(`Campaign source not found: ${options.file}`);
    }

    const record = records.find((entry) => entry.sourcePath === sourcePath) ?? buildCampaignRecord(sourcePath);
    writeCampaignPage(record, campaignsOutputRoot);
  }

  writeCampaignIndex(records, campaignsOutputRoot);
  ensureFaviconAsset(siteRoot);
}

function parseArgs(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--all") {
      options.all = true;
    } else if (arg === "--site-root") {
      options.siteRoot = args[index + 1];
      index += 1;
    } else if (options.file) {
      throw new Error(`Unexpected argument: ${arg}`);
    } else {
      options.file = arg;
    }
  }

  return options;
}

function buildCampaignRecord(sourcePath) {
  const raw = readFileSync(sourcePath, "utf8");
  const { meta, body } = parseFrontMatter(raw);
  const campaign = validateCampaign(meta);
  const sections = extractSections(body, campaign);

  return { sourcePath, campaign, sections };
}

function parseFrontMatter(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  if (lines[0]?.trim() !== "---") {
    throw new Error("Campaign file must start with a --- front-matter block");
  }

  let closeIndex = -1;

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === "---") {
      closeIndex = index;
      break;
    }
  }

  if (closeIndex === -1) {
    throw new Error("Campaign front-matter block is never closed (expected a second --- line)");
  }

  const meta = {};

  for (const line of lines.slice(1, closeIndex)) {
    if (line.trim() === "") {
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (!match) {
      throw new Error(`Front matter only supports simple "key: value" lines. Received: ${line.trim()}`);
    }

    if (match[1] in meta) {
      throw new Error(`Duplicate front-matter field: ${match[1]}`);
    }

    meta[match[1]] = stripQuotes(match[2].trim());
  }

  return { meta, body: lines.slice(closeIndex + 1).join("\n") };
}

function stripQuotes(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function validateCampaign(meta) {
  const required = ["title", "slug", "race_date", "distance", "status", "current_week", "weeks", "summary"];

  for (const field of required) {
    if (!(field in meta) || String(meta[field]).trim() === "") {
      throw new Error(`Missing required front-matter field: ${field}`);
    }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) {
    throw new Error(
      `Invalid slug "${meta.slug}". Slugs must be lowercase kebab-case (letters, digits, hyphens only) so the output path stays inside static/plans/campaigns.`,
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.race_date) || !isCalendarDate(meta.race_date)) {
    throw new Error(`Invalid race_date "${meta.race_date}". Use a real calendar date in YYYY-MM-DD format.`);
  }

  if (!["upcoming", "active", "completed"].includes(meta.status)) {
    throw new Error(`Invalid status "${meta.status}". Supported values: upcoming, active, completed.`);
  }

  const weeks = Number(meta.weeks);

  if (!Number.isInteger(weeks) || weeks <= 0) {
    throw new Error(`weeks must be a positive integer. Received: ${meta.weeks}`);
  }

  const currentWeek = Number(meta.current_week);

  if (!Number.isInteger(currentWeek) || currentWeek <= 0) {
    throw new Error(`current_week must be a positive integer. Received: ${meta.current_week}`);
  }

  if (currentWeek > weeks) {
    throw new Error(`current_week (${currentWeek}) must be between 1 and weeks (${weeks}).`);
  }

  return {
    title: meta.title,
    slug: meta.slug,
    raceDate: meta.race_date,
    distance: meta.distance,
    status: meta.status,
    currentWeek,
    weeks,
    summary: meta.summary,
  };
}

function isCalendarDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function extractSections(body, campaign) {
  const sections = { current: null, roadmap: null, reviews: null, reference: null };
  let openSection = null;
  const ignored = [];

  for (const line of body.replace(/\r\n/g, "\n").split("\n")) {
    const heading = line.match(/^##\s+(.+?)\s*$/);

    if (heading) {
      const recognized = CAMPAIGN_SECTIONS.find((entry) => heading[1].toLowerCase().startsWith(entry.prefix));

      if (!recognized) {
        ignored.push(heading[1]);
        openSection = null;
        continue;
      }

      openSection = { key: recognized.key, title: heading[1], markdown: [] };
      sections[recognized.key] = openSection;
      continue;
    }

    if (openSection) {
      openSection.markdown.push(line);
    }
  }

  if (ignored.length > 0) {
    console.warn(`Note: ignored non-campaign H2 section(s): ${ignored.join(", ")}`);
  }

  const rendered = {};

  for (const [key, section] of Object.entries(sections)) {
    if (!section) {
      continue;
    }

    const html = marked.parse(section.markdown.join("\n").trim());

    if (key === "roadmap") {
      rendered[key] = { title: section.title, html: markActiveRoadmapRow(html, campaign.currentWeek) };
    } else if (key === "reviews" || key === "reference") {
      rendered[key] = { title: section.title, html: groupH3Blocks(html, key === "reference") };
    } else {
      rendered[key] = { title: section.title, html };
    }
  }

  return rendered;
}

function markActiveRoadmapRow(html, currentWeek) {
  return html.replace(/<tr>(\s*)<td>\s*W(\d+)\s*<\/td>/gi, (row, whitespace, week) =>
    Number(week) === currentWeek ? `<tr class="is-active">${whitespace}<td>W${week}</td>` : row,
  );
}

function groupH3Blocks(html, useGrid) {
  const chunks = html
    .split(/(?=<h3\b)/i)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const articles = [];
  let leading = "";

  for (const chunk of chunks) {
    if (/^<h3\b/i.test(chunk)) {
      articles.push(`<article>\n${chunk}\n</article>`);
    } else {
      leading += chunk;
    }
  }

  if (articles.length === 0) {
    return html;
  }

  const grouped = articles.join("\n");
  return useGrid ? `${leading}<div class="reference-grid">\n${grouped}\n</div>` : leading + grouped;
}

function formatRaceDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function daysUntilRace(isoDate, now = new Date()) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const race = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((race.getTime() - today.getTime()) / 86400000);
}

function countdownText(days) {
  if (days > 1) return `${days} days`;
  if (days === 1) return `1 day`;
  if (days === 0) return `Race day`;
  return `Finished`;
}

function buildRaceFacts(campaign) {
  const facts = [
    `<span>${formatRaceDate(campaign.raceDate)}</span>`,
    `<span>${escapeHtml(campaign.distance)}</span>`,
    `<span>Week ${campaign.currentWeek} of ${campaign.weeks}</span>`,
  ];

  if (campaign.status === "completed") {
    facts.push(`<strong>Completed</strong>`);
  } else {
    facts.push(
      `<strong id="countdown" data-race-date="${campaign.raceDate}">${countdownText(daysUntilRace(campaign.raceDate))}</strong>`,
    );
  }

  return facts.join(`<i></i>`);
}

function buildProgressRoute(campaign) {
  const items = [];

  for (let week = 1; week <= campaign.weeks; week += 1) {
    const state = week < campaign.currentWeek ? "done" : week === campaign.currentWeek ? "active" : "";
    items.push(`<li${state ? ` class="${state}"` : ""}><span>W${week}</span></li>`);
  }

  const raceState = campaign.status === "completed" ? " active" : "";
  items.push(`<li class="race${raceState}"><span>Race</span></li>`);

  return items.join("");
}

function buildDistanceRail(distance) {
  const totalKm = Number.parseFloat(distance);

  if (!Number.isFinite(totalKm) || totalKm <= 0) {
    return "";
  }

  const marks = [];

  for (let km = 0; km < totalKm; km += 10) {
    const position = Math.round((km / totalKm) * 1000) / 10;
    marks.push(`      <span style="--p:${position}">${km}<small>KM</small></span>`);
  }

  return `<div class="course" aria-hidden="true">
  <div class="course-line">
${marks.join("\n")}
  </div>
</div>
`;
}

function buildCountdownScript() {
  return `<script>
  (function () {
    var el = document.getElementById("countdown");
    if (!el) return;
    var parts = (el.getAttribute("data-race-date") || "").split("-");
    if (parts.length !== 3) return;
    var race = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var days = Math.round((race.getTime() - today.getTime()) / 864e5);
    el.textContent = days > 1 ? days + " days" : days === 1 ? "1 day" : days === 0 ? "Race day" : "Finished";
  })();
</script>`;
}

function writeCampaignPage(record, campaignsOutputRoot) {
  const { campaign, sections } = record;
  const { dir, file } = resolveSafeOutputPath(campaignsOutputRoot, campaign.slug);

  const sectionBlocks = Object.keys(SECTION_CLASSES)
    .filter((key) => sections[key])
    .map(
      (key) => `    <section class="${SECTION_CLASSES[key]}" id="${SECTION_IDS[key]}">
      <p class="section-kicker">${SECTION_KICKERS[key]}</p>
      ${renderSectionHeading(sections[key].title)}
      <div class="section-body">
      ${sections[key].html}
      </div>
    </section>`,
    );

  const footerRight =
    campaign.status === "completed"
      ? `Raced · ${formatRaceDate(campaign.raceDate)}`
      : `Race day · ${formatRaceDate(campaign.raceDate)}`;

  const pageHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(campaign.title)}</title>
  <meta name="description" content="${escapeAttribute(campaign.summary)}">
  ${buildFaviconMarkup("../../../assets")}
  <style>
${CAMPAIGN_CSS}
  </style>
</head>
<body>
${buildDistanceRail(campaign.distance)}  <main>
    <nav class="campaign-nav" aria-label="Site navigation">
      <a href="../../index.html">← Plans</a>
      <a href="../index.html">All campaigns</a>
    </nav>
    <header class="campaign-header">
      <p class="eyebrow">Training Campaign</p>
      <h1>${escapeHtml(campaign.title)}</h1>
      <div class="race-facts" aria-label="Race information">
        ${buildRaceFacts(campaign)}
      </div>
      <ol class="campaign-progress" aria-label="Campaign progress">
        ${buildProgressRoute(campaign)}
      </ol>
    </header>
${sectionBlocks.join("\n")}
    <footer><span>Plan → Train → Review → Adapt → Race</span><span>${footerRight}</span></footer>
  </main>
  ${buildCountdownScript()}
</body>
</html>
`;

  mkdirSync(dir, { recursive: true });
  writeFileSync(file, pageHtml);
  console.log(`Imported ${campaign.slug} -> ${file}`);
}

function writeCampaignIndex(records, campaignsOutputRoot) {
  const sorted = [...records].sort((left, right) => {
    const byStatus = STATUS_ORDER[left.campaign.status] - STATUS_ORDER[right.campaign.status];

    if (byStatus !== 0) {
      return byStatus;
    }

    return left.campaign.status === "completed"
      ? right.campaign.raceDate.localeCompare(left.campaign.raceDate)
      : left.campaign.raceDate.localeCompare(right.campaign.raceDate);
  });

  const groups = ["active", "upcoming", "completed"]
    .map((status) => {
      const groupRecords = sorted.filter((record) => record.campaign.status === status);

      if (groupRecords.length === 0) {
        return "";
      }

      const rows = groupRecords
        .map((record) => {
          const { campaign } = record;
          const facts = [formatRaceDate(campaign.raceDate), escapeHtml(campaign.distance)];

          if (campaign.status !== "completed") {
            facts.push(`Week ${campaign.currentWeek} of ${campaign.weeks}`);
          }

          return `        <li class="campaign-row">
          <a href="./${campaign.slug}/">
            <h2>${escapeHtml(campaign.title)}</h2>
            <p class="row-facts">${facts.join(" · ")}</p>
            <p class="row-summary">${escapeHtml(campaign.summary)}</p>
          </a>
        </li>`;
        })
        .join("\n");

      return `    <section class="campaign-group">
      <p class="section-kicker">${capitalize(status)}</p>
      <ul class="campaign-list">
${rows}
      </ul>
    </section>`;
    })
    .filter(Boolean)
    .join("\n");

  const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Training Campaigns</title>
  <meta name="description" content="Long-term race preparation pages: current week, roadmap, weekly reviews, and reference.">
  ${buildFaviconMarkup("../../assets")}
  <style>
${CAMPAIGN_CSS}
  </style>
</head>
<body>
  <main>
    <nav class="campaign-nav" aria-label="Site navigation">
      <a href="../index.html">← Plans</a>
    </nav>
    <header class="campaign-header">
      <p class="eyebrow">Plan → Train → Review → Adapt → Race</p>
      <h1>Training Campaigns</h1>
    </header>
${groups}
  </main>
</body>
</html>
`;

  mkdirSync(campaignsOutputRoot, { recursive: true });
  const outputPath = resolve(campaignsOutputRoot, "index.html");
  writeFileSync(outputPath, indexHtml);
  console.log(`Rebuilt campaign index -> ${outputPath}`);
}

function resolveSafeOutputPath(campaignsOutputRoot, slug) {
  const dir = resolve(campaignsOutputRoot, slug);
  const rootWithSeparator = `${campaignsOutputRoot}/`;

  if (!`${dir}/`.startsWith(rootWithSeparator)) {
    throw new Error(`Unsafe campaign output path for slug "${slug}"`);
  }

  return { dir, file: resolve(dir, "index.html") };
}

function ensureFaviconAsset(siteRoot) {
  const faviconSource = resolve(process.cwd(), FAVICON_FILENAME);

  if (existsSync(faviconSource)) {
    const assetsRoot = resolve(siteRoot, "assets");
    mkdirSync(assetsRoot, { recursive: true });

    if (!existsSync(resolve(assetsRoot, FAVICON_FILENAME))) {
      copyFileSync(faviconSource, resolve(assetsRoot, FAVICON_FILENAME));
    }
  }
}

function buildFaviconMarkup(relativeAssetsPath) {
  const href = `${relativeAssetsPath}/${FAVICON_FILENAME}`;
  return `<link rel="icon" type="image/jpeg" href="${href}">
  <link rel="apple-touch-icon" href="${href}">`;
}

function renderSectionHeading(title) {
  const lowered = title.toLowerCase();
  const recognized = CAMPAIGN_SECTIONS.find((entry) => lowered.startsWith(entry.prefix));

  if (!recognized) {
    return `<h2>${escapeHtml(title)}</h2>`;
  }

  const rest = title.slice(recognized.display.length).trim();
  return rest
    ? `<h2>${recognized.display} <em>${escapeHtml(rest)}</em></h2>`
    : `<h2>${recognized.display}</h2>`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

const CAMPAIGN_CSS = `:root {
  --paper: #f6f3ed;
  --ink: #171717;
  --muted: #72706b;
  --line: #b9b5ad;
  --accent: #c43b2e;
  --page: 760px;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  color: var(--ink);
  background:
    linear-gradient(rgba(25, 25, 25, .035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(25, 25, 25, .035) 1px, transparent 1px),
    var(--paper);
  background-size: 24px 24px;
  font-family: "Nimbus Sans Narrow", "Arial Narrow", Arial, sans-serif;
  line-height: 1.45;
}

main { width: min(var(--page), calc(100% - 80px)); margin: 0 auto; padding: 40px 0 56px; }

h1, h2 { font-family: "Nimbus Roman", "Times New Roman", serif; font-weight: 400; text-transform: uppercase; letter-spacing: -.045em; }
h1 { margin: 14px 0 22px; font-size: clamp(3.35rem, 8.5vw, 6.6rem); line-height: .88; max-width: 700px; }
h2 { margin: 2px 0 4px; font-size: clamp(2.8rem, 6vw, 5rem); line-height: .95; }
h2 em { color: var(--accent); font-style: normal; }
h3 { text-transform: uppercase; letter-spacing: .08em; }
p { margin: 10px 0; }
ul, ol { margin: 10px 0; padding-left: 1.2em; }
li { margin: 5px 0; }
a { color: inherit; }

.eyebrow, .section-kicker { margin: 0; color: var(--accent); font-size: .78rem; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; }

.campaign-nav { display: flex; gap: 22px; margin: 0 0 34px; }
.campaign-nav a { color: var(--muted); text-decoration: none; font-size: .78rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
.campaign-nav a:hover, .campaign-nav a:focus-visible { color: var(--accent); }

.campaign-header { padding-bottom: 70px; }
.race-facts { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; font-size: 1.05rem; letter-spacing: .08em; text-transform: uppercase; }
.race-facts i { width: 3px; height: 3px; border-radius: 50%; background: var(--ink); }
.race-facts strong { color: var(--accent); font-weight: 600; }

.campaign-progress { display: flex; margin: 54px 0 0; padding: 0; list-style: none; }
.campaign-progress li { position: relative; flex: 1; padding-top: 23px; color: var(--muted); font-size: .76rem; text-align: center; text-transform: uppercase; }
.campaign-progress li::before { content: ""; position: absolute; z-index: 2; top: 0; left: 50%; width: 10px; height: 10px; transform: translateX(-50%); border: 1px solid var(--ink); border-radius: 50%; background: var(--paper); }
.campaign-progress li::after { content: ""; position: absolute; top: 5px; left: -50%; width: 100%; border-top: 1px solid var(--ink); }
.campaign-progress li:first-child::after { display: none; }
.campaign-progress .done::before { background: var(--ink); }
.campaign-progress .active { color: var(--accent); }
.campaign-progress .active::before { border-color: var(--accent); background: var(--accent); }
.campaign-progress .race { flex: .75; color: var(--ink); }
.campaign-progress .race::before { border-radius: 0; }

section { padding: 64px 0; border-top: 1px solid var(--ink); }

.campaign-current .section-body > p:first-of-type { margin: 12px 0 20px; font-size: 1.25rem; letter-spacing: .08em; text-transform: uppercase; }
.campaign-current .section-body > p:nth-of-type(2) { margin: 0 0 26px; padding: 15px 6px; border-block: 1px solid var(--line); font-size: 1.12rem; }
.campaign-current table { width: 100%; border-collapse: collapse; font-size: 1.15rem; }
.campaign-current th, .campaign-current td { padding: 15px 8px; text-align: left; }
.campaign-current thead th { border-bottom: 1px solid var(--ink); color: var(--muted); font-size: .8rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
.campaign-current tbody tr { border-bottom: 1px solid var(--line); }
.campaign-current tbody td:first-child { width: 120px; font-size: .88rem; letter-spacing: .12em; text-transform: uppercase; }
.campaign-current tbody tr:last-child { border-bottom: 1px solid var(--ink); color: var(--accent); }

.campaign-roadmap table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 1.02rem; }
.campaign-roadmap thead th { padding: 10px 6px; border-bottom: 1px solid var(--ink); color: var(--muted); font-size: .78rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; text-align: left; }
.campaign-roadmap tbody tr { border-bottom: 1px solid var(--line); }
.campaign-roadmap tbody td { padding: 13px 6px; text-align: left; vertical-align: baseline; }
.campaign-roadmap tbody td:first-child { letter-spacing: .09em; }
.campaign-roadmap tbody td:last-child { text-align: right; }
.campaign-roadmap tr.is-active { color: var(--accent); }
.campaign-roadmap h3 { margin: 42px 0 4px; }

.campaign-reviews article { margin-top: 32px; padding: 22px 0; border-block: 1px solid var(--line); }
.campaign-reviews article h3 { margin: 0; }

.reference-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 36px 50px; margin-top: 34px; }
.reference-grid article { border-top: 1px solid var(--line); }
.reference-grid h3 { margin: 0; font-size: .88rem; }
.reference-grid ul { margin: 8px 0; padding-left: 1.1em; }
.reference-grid li { margin: 7px 0; }

.campaign-group { padding-top: 54px; border-top: 1px solid var(--ink); }
.campaign-list { margin: 0; padding: 0; list-style: none; border-bottom: 1px solid var(--ink); }
.campaign-row { border-top: 1px solid var(--line); }
.campaign-row a { display: block; padding: 26px 0; text-decoration: none; }
.campaign-row h2 { margin: 0 0 8px; font-size: clamp(1.9rem, 4.5vw, 2.7rem); line-height: 1; }
.campaign-row a:hover h2, .campaign-row a:focus-visible h2 { color: var(--accent); }
.row-facts { margin: 0; font-size: .95rem; letter-spacing: .08em; text-transform: uppercase; }
.row-summary { margin: 10px 0 0; max-width: 560px; color: #45433f; }

footer { display: flex; justify-content: space-between; gap: 20px; padding: 36px 0 70px; color: var(--accent); font-size: .78rem; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }

.course { position: fixed; top: 0; left: max(18px, calc(50vw - 510px)); width: 82px; height: 100vh; color: #65635e; font: .68rem/1.35 "Nimbus Sans Narrow", "Arial Narrow", Arial, sans-serif; }
.course-line { position: absolute; top: 98px; bottom: 92px; left: 30px; width: 1px; background: var(--ink); }
.course-line span { position: absolute; top: calc(var(--p) * 1%); left: 0; display: flex; align-items: center; gap: 9px; transform: translate(-4px, -50%); }
.course-line span::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--ink); flex: none; }
.course-line small { display: block; font-size: .58rem; }

@media (max-width: 960px) {
  .course { display: none; }
}

@media (max-width: 620px) {
  main { width: min(100% - 34px, var(--page)); padding-top: 24px; }
  h1 { font-size: clamp(3rem, 17vw, 5rem); }
  h2 { font-size: clamp(2.7rem, 15vw, 4rem); }
  .campaign-header { padding-bottom: 48px; }
  .race-facts { gap: 9px; font-size: .9rem; }
  .campaign-progress { margin-top: 40px; }
  .campaign-progress li span { font-size: .62rem; }
  section { padding: 48px 0; }
  .campaign-current table { font-size: 1rem; }
  .campaign-current tbody td:first-child { width: 66px; }
  .campaign-current th, .campaign-current td { padding: 14px 4px; }
  .campaign-roadmap tbody td { padding: 11px 4px; }
  .reference-grid { grid-template-columns: 1fr; gap: 28px; }
  footer { flex-direction: column; }
}

@media print {
  body { background: #fff; }
  main { width: 100%; padding: 24px 30px; }
  .course { display: none; }
  section { break-inside: avoid; }
}`;

const [, , ...cliArgs] = process.argv;

try {
  main(cliArgs);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
