import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, resolve } from "node:path";

const SEARCH_PROVIDERS = {
  youtube: "https://www.youtube.com/results?search_query=",
  bilibili: "https://search.bilibili.com/all?keyword=",
};

const ACTIVE_SEARCH_PROVIDER = resolveSearchProvider(process.env.PLAN_SEARCH_PROVIDER ?? "youtube");

const TOKEN_FALLBACKS = {
  "--font-sans":
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  "--color-background-primary": "#ffffff",
  "--color-background-secondary": "#f8f5ee",
  "--color-background-tertiary": "#f2f4f7",
  "--color-border-tertiary": "#d8dde6",
  "--color-text-primary": "#202327",
  "--color-text-secondary": "#4f5b67",
  "--color-text-tertiary": "#6d7782",
  "--border-radius-md": "999px",
  "--border-radius-lg": "18px",
};

const PAGE_CONFIG = {
  dinner: {
    heroTitle: (weekNumber) => `Week ${weekNumber} Dinner Plan`,
    bodyGradient:
      "radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 30%), linear-gradient(180deg, #f7f3eb 0%, #f2efe8 100%)",
    pageBackground: "#f4f1ea",
    surfaceBorder: "rgba(178, 163, 138, 0.28)",
    accentColor: "#0f6e56",
    shadowColor: "rgba(40, 35, 28, 0.08)",
    sectionLabel: "Dinner",
    sectionSummary: "一周晚餐安排",
  },
  training: {
    heroTitle: (weekNumber) => `Week ${weekNumber} Training Plan`,
    bodyGradient:
      "radial-gradient(circle at top right, rgba(255, 255, 255, 0.72), transparent 26%), linear-gradient(180deg, #f2f6f9 0%, #e8eef2 100%)",
    pageBackground: "#edf2f5",
    surfaceBorder: "rgba(95, 122, 145, 0.24)",
    accentColor: "#3c3489",
    shadowColor: "rgba(25, 36, 46, 0.08)",
    sectionLabel: "Training",
    sectionSummary: "一周训练安排",
  },
};

const [, , sourceArg, ...restArgs] = process.argv;

if (!sourceArg) {
  console.error("Usage: node scripts/import_plan_html.mjs <source-html> [--site-root <path>]");
  process.exit(1);
}

const options = parseArgs(restArgs);
const sourcePath = resolve(process.cwd(), sourceArg);
const siteRoot = options.siteRoot
  ? resolve(process.cwd(), options.siteRoot)
  : resolve(process.cwd(), "static", "plans");

if (!existsSync(sourcePath)) {
  console.error(`Source HTML not found: ${sourcePath}`);
  process.exit(1);
}

const parsed = parseSourceFilename(basename(sourcePath));
const rawHtml = readFileSync(sourcePath, "utf8");
const hydratedFragment = addFallbacks(rawHtml);

mkdirSync(siteRoot, { recursive: true });

const pageHtml = buildPlanPage({
  rawFragment: hydratedFragment,
  siteRoot,
  weekNumber: parsed.weekNumber,
  weekSlug: parsed.weekSlug,
  kind: parsed.kind,
});

const outputPath = resolve(siteRoot, "weeks", parsed.weekSlug, `${parsed.kind}.html`);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, pageHtml);

writeLatestRedirect({
  siteRoot,
  weekSlug: parsed.weekSlug,
  kind: parsed.kind,
});

writeIndex(siteRoot);

console.log(`Imported ${basename(sourcePath)} -> ${outputPath}`);

function parseArgs(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--site-root") {
      options.siteRoot = args[index + 1];
      index += 1;
    }
  }

  return options;
}

function parseSourceFilename(filename) {
  const match = filename.match(/^week(\d+)_(dinner|training)_plan\.html$/i);

  if (!match) {
    throw new Error(
      `Filename must look like week14_training_plan.html or week14_dinner_plan.html. Received: ${filename}`,
    );
  }

  const weekNumber = Number(match[1]);
  const kind = match[2].toLowerCase();

  return {
    weekNumber,
    weekSlug: `week${weekNumber}`,
    kind,
  };
}

function addFallbacks(html) {
  return html.replace(/var\((--[\w-]+)\)/g, (fullMatch, token) => {
    const fallback = TOKEN_FALLBACKS[token];
    return fallback ? `var(${token}, ${fallback})` : fullMatch;
  });
}

function buildPlanPage({ rawFragment, weekNumber, weekSlug, kind }) {
  const config = PAGE_CONFIG[kind];
  const planStyles = extractStyleMarkup(rawFragment);
  const planMarkup = addSearchLinks(extractPlanMarkup(rawFragment));

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${config.heroTitle(weekNumber)}</title>
  <meta name="description" content="${escapeHtmlAttribute(config.sectionSummary)}">
  <style>
    :root {
      color-scheme: light;
      --page-background: ${config.pageBackground};
      --surface-background: rgba(255, 255, 255, 0.82);
      --surface-border: ${config.surfaceBorder};
      --heading-color: #24303b;
      --muted-color: #667281;
      --accent-color: ${config.accentColor};
      --shadow-soft: 0 18px 45px ${config.shadowColor};
    }

    * { box-sizing: border-box; }
    html { background: var(--page-background); }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: var(--heading-color);
      background: ${config.bodyGradient};
    }

    a { color: inherit; }

    .page {
      width: min(100%, 980px);
      margin: 0 auto;
      padding: 20px 16px 40px;
    }

    .hero {
      margin-bottom: 18px;
      padding: 14px 16px 16px;
      border: 1px solid var(--surface-border);
      border-radius: 22px;
      background: var(--surface-background);
      box-shadow: var(--shadow-soft);
      backdrop-filter: blur(14px);
    }

    .hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .hero-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .nav-link,
    .nav-pill,
    .nav-back {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      padding: 0 11px;
      border-radius: 999px;
      text-decoration: none;
      font-size: 13px;
      border: 1px solid rgba(36, 48, 59, 0.12);
      background: rgba(255, 255, 255, 0.68);
      color: var(--heading-color);
    }

    .nav-back {
      color: var(--muted-color);
      background: transparent;
      padding-left: 0;
      border: none;
    }

    .nav-link.is-active {
      background: #24303b;
      color: #fff;
      border-color: #24303b;
    }

    .hero-kicker {
      margin: 0;
      color: var(--muted-color);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hero h1 {
      margin: 6px 0 0;
      font-size: clamp(28px, 6vw, 34px);
      line-height: 1;
      letter-spacing: -0.04em;
    }

    .panel {
      margin-top: 18px;
      padding: 18px;
      border-radius: 24px;
      border: 1px solid var(--surface-border);
      background: rgba(255, 255, 255, 0.72);
      box-shadow: var(--shadow-soft);
      overflow: hidden;
    }

    .search-link {
      color: inherit;
      text-decoration: none;
      transition: color 160ms ease, opacity 160ms ease;
    }

    .search-link:hover,
    .search-link:focus-visible {
      color: var(--accent-color);
      opacity: 0.92;
      outline: none;
    }

    .search-link:active {
      opacity: 0.78;
    }

    @media (max-width: 720px) {
      .page { padding: 14px 12px 28px; }
      .hero, .panel { padding: 14px; border-radius: 20px; }
      .hero { padding-top: 12px; }
    }
  </style>
${planStyles}
</head>
<body>
  <div class="page">
    <header class="hero">
      <div class="hero-top">
        <a class="nav-back" href="../../index.html">← Plans Home</a>
        <nav class="hero-nav" aria-label="Plans navigation">
          <a class="nav-link${kind === "dinner" ? " is-active" : ""}" href="./dinner.html">Dinner</a>
          <a class="nav-link${kind === "training" ? " is-active" : ""}" href="./training.html">Training</a>
        </nav>
      </div>
      <p class="hero-kicker">Week ${weekNumber}</p>
      <h1>${config.heroTitle(weekNumber)}</h1>
    </header>
    <main class="panel">
${planMarkup}
    </main>
  </div>
</body>
</html>
`;
}

function resolveSearchProvider(providerName) {
  if (!SEARCH_PROVIDERS[providerName]) {
    throw new Error(
      `Unknown search provider "${providerName}". Supported values: ${Object.keys(SEARCH_PROVIDERS).join(", ")}`,
    );
  }

  return providerName;
}

function extractStyleMarkup(fragment) {
  const match = fragment.match(/<style>[\s\S]*?<\/style>/i);
  return match ? match[0] : "";
}

function addSearchLinks(markup) {
  return markup
    .replace(/<div class="dish-name">([\s\S]*?)<\/div>/g, (_full, innerHtml) => {
      const query = buildSearchQuery(innerHtml);
      return `<div class="dish-name">${wrapSearchLink(innerHtml, query)}</div>`;
    })
    .replace(/<div class="move">([\s\S]*?)<\/div>/g, (_full, innerHtml) => {
      const query = buildSearchQuery(innerHtml.replace(/<span\b[\s\S]*?<\/span>/gi, ""));
      return `<div class="move">${wrapSearchLink(innerHtml, query)}</div>`;
    });
}

function extractPlanMarkup(fragment) {
  return fragment.replace(/^\s*<style>[\s\S]*?<\/style>\s*/i, "").trim();
}

function buildSearchQuery(htmlFragment) {
  return htmlFragment.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function wrapSearchLink(innerHtml, query) {
  const href = `${SEARCH_PROVIDERS[ACTIVE_SEARCH_PROVIDER]}${encodeURIComponent(query)}`;
  return `<a class="search-link" href="${href}" target="_blank" rel="noreferrer">${innerHtml}</a>`;
}

function writeLatestRedirect({ siteRoot, weekSlug, kind }) {
  const targetHref = `../weeks/${weekSlug}/${kind}.html`;
  const latestPath = resolve(siteRoot, "latest", `${kind}.html`);
  mkdirSync(dirname(latestPath), { recursive: true });
  writeFileSync(
    latestPath,
    `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Latest ${capitalize(kind)} Plan</title>
  <meta http-equiv="refresh" content="0; url=${targetHref}">
  <link rel="canonical" href="${targetHref}">
</head>
<body>
  <p>Redirecting to the latest ${kind} plan: <a href="${targetHref}">${weekSlug}/${kind}.html</a></p>
</body>
</html>
`,
  );
}

function writeIndex(siteRoot) {
  const weeksRoot = resolve(siteRoot, "weeks");
  const weeks = existsSync(weeksRoot)
    ? readdirSync(weeksRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && /^week\d+$/i.test(entry.name))
        .map((entry) => buildWeekRecord(siteRoot, entry.name))
        .sort((left, right) => right.weekNumber - left.weekNumber)
    : [];

  const weekBlocks = weeks
    .map((week) => {
      const actionLinks = [];

      if (week.hasDinner) {
        actionLinks.push(
          `          <a class="button green" href="./weeks/${week.weekSlug}/dinner.html">Dinner</a>`,
        );
      }

      if (week.hasTraining) {
        actionLinks.push(
          `          <a class="button indigo" href="./weeks/${week.weekSlug}/training.html">Training</a>`,
        );
      }

      const statusLabel = week.hasDinner && week.hasTraining ? "已发布晚餐和训练" : "部分内容已发布";

      return `        <div class="week-item">
        <div class="week-copy">
          <strong>Week ${week.weekNumber}</strong>
          <span>${statusLabel}</span>
        </div>
        <div class="week-links">
${actionLinks.join("\n")}
        </div>
      </div>`;
    })
    .join("\n");

  const indexHtml = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Weekly Plans</title>
  <meta name="description" content="Shareable dinner and training plans, optimized for quick mobile viewing.">
  <style>
    :root {
      color-scheme: light;
      --page-background: #f4f1ea;
      --card-background: rgba(255, 255, 255, 0.84);
      --card-border: rgba(164, 150, 126, 0.24);
      --heading-color: #24303b;
      --muted-color: #667281;
      --accent-green: #0f6e56;
      --accent-indigo: #3c3489;
      --shadow-soft: 0 24px 55px rgba(38, 33, 24, 0.08);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: var(--heading-color);
      background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 28%),
        linear-gradient(180deg, #f7f3eb 0%, #eef2f5 100%);
    }

    .page {
      width: min(100%, 960px);
      margin: 0 auto;
      padding: 20px 16px 40px;
    }

    .hero,
    .card {
      border-radius: 26px;
      border: 1px solid var(--card-border);
      background: var(--card-background);
      box-shadow: var(--shadow-soft);
      backdrop-filter: blur(14px);
    }

    .hero {
      padding: 22px;
      margin-bottom: 18px;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      padding: 6px 11px;
      border-radius: 999px;
      background: rgba(36, 48, 59, 0.08);
      color: var(--muted-color);
      font-size: 13px;
      font-weight: 600;
    }

    h1 {
      margin: 14px 0 10px;
      font-size: clamp(32px, 8vw, 48px);
      line-height: 1.02;
      letter-spacing: -0.04em;
    }

    .hero-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-label {
      display: inline-flex;
      align-items: center;
      padding: 6px 11px;
      border-radius: 999px;
      background: rgba(36, 48, 59, 0.08);
      color: var(--muted-color);
      font-size: 13px;
      font-weight: 600;
    }

    .hero-kicker {
      margin: 14px 0 0;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #7a6e5e;
    }

    .hero-copy {
      margin: 8px 0 0;
      max-width: 36rem;
      color: var(--muted-color);
      font-size: 15px;
      line-height: 1.6;
    }

    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      margin-bottom: 18px;
    }

    .card {
      padding: 18px;
    }

    .card h2,
    .card h3 {
      margin: 0 0 8px;
      font-size: 20px;
    }

    .card p {
      margin: 0;
      color: var(--muted-color);
      line-height: 1.6;
      font-size: 14px;
    }

    .actions,
    .week-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 0 14px;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      border: 1px solid rgba(36, 48, 59, 0.1);
      color: var(--heading-color);
      background: rgba(255, 255, 255, 0.78);
    }

    .button.green {
      background: rgba(15, 110, 86, 0.1);
      color: var(--accent-green);
      border-color: rgba(15, 110, 86, 0.12);
    }

    .button.indigo {
      background: rgba(60, 52, 137, 0.1);
      color: var(--accent-indigo);
      border-color: rgba(60, 52, 137, 0.12);
    }

    .section-title {
      margin: 0 0 12px;
      font-size: 18px;
    }

    .archive-list {
      margin-top: 12px;
    }

    .week-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding: 14px 0;
      border-top: 1px solid rgba(36, 48, 59, 0.08);
    }

    .week-copy {
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex-wrap: wrap;
    }

    .week-copy strong {
      font-size: 18px;
    }

    .week-copy span {
      color: var(--muted-color);
      font-size: 13px;
    }

    @media (max-width: 720px) {
      .page { padding: 14px 12px 28px; }
      .hero, .card { border-radius: 22px; }
      .hero { padding: 16px; }
      .card { padding: 16px; }
      .hero-top { gap: 10px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div class="hero-top">
        <div>
          <span class="hero-label">Weekly Plans</span>
          <p class="hero-kicker">Latest first, archive below</p>
          <h1>Dinner + Training</h1>
          <p class="hero-copy">先看本周，再继续翻历史周。首页像目录页一样清楚，但依旧能一键直达最新内容。</p>
        </div>
        <div class="eyebrow">Archive</div>
      </div>
    </section>

    <section class="grid" aria-label="Latest links">
      <article class="card">
        <h2>Latest Dinner</h2>
        <p>优先查看当前周的晚餐安排，适合饭前快速打开。</p>
        <div class="actions">
          <a class="button green" href="./latest/dinner.html">Open latest dinner</a>
        </div>
      </article>
      <article class="card">
        <h2>Latest Training</h2>
        <p>优先查看当前周的训练安排，去健身房前直接打开就行。</p>
        <div class="actions">
          <a class="button indigo" href="./latest/training.html">Open latest training</a>
        </div>
      </article>
    </section>

    <section class="card" aria-label="Weeks archive">
      <h2 class="section-title">Weeks Archive</h2>
      <div class="archive-list">
${weekBlocks || '        <p>还没有导入任何计划页面。</p>'}
      </div>
    </section>
  </div>
</body>
</html>
`;

  writeFileSync(resolve(siteRoot, "index.html"), indexHtml);
}

function buildWeekRecord(siteRoot, weekSlug) {
  const weekDir = resolve(siteRoot, "weeks", weekSlug);
  const weekNumber = Number(weekSlug.replace(/^week/i, ""));

  return {
    weekSlug,
    weekNumber,
    hasDinner: existsSync(resolve(weekDir, "dinner.html")),
    hasTraining: existsSync(resolve(weekDir, "training.html")),
  };
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtmlAttribute(value) {
  return value.replace(/"/g, "&quot;");
}
