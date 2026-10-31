import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const THEME_SOURCE = fileURLToPath(new URL("../site/life.css", import.meta.url));

function esc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function cleanMarkdown(value) {
  return String(value ?? "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*|__|\`/g, "").trim();
}

function readCampaigns(root) {
  const folder = resolve(root, "campaigns");
  if (!existsSync(folder)) return [];
  return readdirSync(folder).filter((f) => f.endsWith(".md")).map((name) => {
    const raw = readFileSync(resolve(folder, name), "utf8");
    const parts = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!parts) return null;
    const meta = {};
    for (const line of parts[1].split("\n")) {
      const m = line.match(/^([a-z_]+):\s*(.*)$/);
      if (m) meta[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
    }
    if (!meta.slug || !meta.title || !["active", "upcoming", "completed"].includes(meta.status)) return null;
    const weekMatch = parts[2].match(/^## This Week([^\n]*)\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
    const reviewsMatch = parts[2].match(/^## Weekly Reviews[^\n]*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m);
    const currentBody = weekMatch?.[2] ?? "";
    const lines = currentBody.split("\n");
    let weekTable = [];
    const headerIndex = lines.findIndex((l,i) => /^\s*\|\s*Day\s*\|/i.test(l) && /^\s*\|\s*[-: |]+\|/.test(lines[i + 1] ?? ""));
    if (headerIndex >= 0) {
      const headers = lines[headerIndex].split("|").slice(1,-1).map(cleanMarkdown);
      for (let i = headerIndex + 2; i < lines.length && /^\s*\|/.test(lines[i]); i++) {
        const cells = lines[i].split("|").slice(1,-1).map(cleanMarkdown);
        if (cells.length >= 2) {
          weekTable.push({ day: cells[0], morning: cells[1], lunch: cells[2] ?? "", korean: cells[3] ?? "" });
        }
      }
    }
    const reviewTitles = [...(reviewsMatch?.[1] ?? "").matchAll(/^### (?:Week |W)(\d+)[^\n]*/gm)];
    return {
      title: meta.title, slug: meta.slug, raceDate: meta.race_date ?? "", status: meta.status,
      summary: meta.summary ?? "", week: Number(meta.current_week) || 1, weeks: Number(meta.weeks) || 1,
      currentHeading: cleanMarkdown(weekMatch?.[1] ?? ""), weekTable, reviewCount: reviewTitles.length,
      lastReviewTitle: reviewTitles.length ? reviewTitles[reviewTitles.length-1][0].replace(/^### /,"") : "",
      currentBody
    };
  }).filter(Boolean).sort((a,b) => {
    const order = {active:0,upcoming:1,completed:2};
    return order[a.status]-order[b.status] || (a.status==="completed" ? b.raceDate.localeCompare(a.raceDate) : a.raceDate.localeCompare(b.raceDate));
  });
}

function nav(prefix = "./", active = "week") {
  const choices = [
    ["week", "本周", prefix + "index.html#this-week"],
    ["goals", "目标", prefix + "index.html#goals"],
    ["library", "参考", prefix + "library/index.html"],
    ["journal", "经历", prefix + "journal/index.html"]
  ];
  return '<a class="life-skip" href="#life-main">跳转到正文</a><nav class="life-nav" aria-label="Life in Motion 主导航">' +
    '<a class="life-brand" href="' + esc(prefix) + 'index.html">Life in Motion<span aria-hidden="true"> ·</span></a>' +
    '<div class="life-nav-links">' + choices.map(([key,title,url]) => '<a ' +
      (key===active?'class="life-link-current" aria-current="page" ':'') +
      'href="'+esc(url)+'">'+title+'</a>').join("") + '</div></nav>';
}

function layout(title, body, prefix = "./", active = "week") {
  return '<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="description" content="Personal Life Playbook — 本周行动、长期目标、知识参考与经历回顾。">' +
    '<title>'+esc(title)+' · Life in Motion</title><link rel="icon" href="'+esc(prefix)+'assets/puran_blog_avator.jpg">' +
    '<link rel="stylesheet" href="'+esc(prefix)+'assets/life.css"></head>' +
    '<body style="background:var(--life-paper)"><div class="life-site">'+nav(prefix,active)+'<main id="life-main">'+body+'</main>' +
    '<footer class="life-foot"><span>Plan → Live → Review → Adapt</span><span>A personal playbook, not a productivity scorecard.</span></footer></div></body></html>';
}

function weekCards(campaign) {
  if (!campaign) {
    return '<div class="life-empty">暂无活动中的 Campaign。本周计划会在创建或启动长期目标后显示于此。</div>';
  }
  const progress = Math.max(0,Math.min(100,Math.round(((campaign.week - 1) / campaign.weeks) * 100)));
  const table = campaign.weekTable.length
    ? '<div class="life-day-list">'+campaign.weekTable.map(row => '<article class="life-day"><strong>'+esc(row.day)+'</strong>' +
      '<p><b>早上</b> '+esc(row.morning)+'</p>' +
      (row.lunch ? '<p><b>中午</b> '+esc(row.lunch)+'</p>' : "") +
      (row.korean ? '<p><b>韩语</b> '+esc(row.korean)+'</p>' : "") + '</article>').join("")+'</div>'
    : '<div class="life-empty">当前 Campaign 未提供日程表，请到目标详情查看本周安排。</div>';
  return '<div class="life-card life-card--lead"><div class="life-label">Current focus · '+esc(campaign.slug)+'</div>' +
    '<h3>'+esc(campaign.title)+'</h3><p>W'+esc(campaign.week)+' / '+esc(campaign.weeks)+
    (campaign.currentHeading ? ' · '+esc(campaign.currentHeading) : "")+'</p>' +
    '<div class="life-rail" role="img" aria-label="已完成约 '+progress+'% 周期"><span style="width:'+progress+'%"></span></div>' +
    table +
    '<div class="life-week-foot"><span class="life-day-note">以本周实际完成与身体状态为准，不为了补任务加练。</span>' +
    '<a class="life-link" href="./campaigns/'+encodeURIComponent(campaign.slug)+'/index.html#this-week">查看完整本周计划</a></div></div>';
}

function home(records, weeks) {
  const active = records.find(r=>r.status==="active");
  const current = active ? weekCards(active) : weekCards(null);
  const activeCards = records.filter(x=>x.status!=="completed").map(c=>
    '<article class="life-card"><div class="life-label">'+esc(c.status==='active'?'In progress':'Up next')+'</div>'+
    '<h3>'+esc(c.title)+'</h3><p>'+esc(c.summary)+'</p>'+
    '<div class="life-meta"><span>W'+c.week+' / '+c.weeks+'</span><span>'+esc(c.raceDate)+'</span></div>'+
    '<a class="life-link life-outline" href="./campaigns/'+encodeURIComponent(c.slug)+'/index.html#roadmap">目标路线图</a></article>').join("");
  const latest = active && active.reviewCount ? '<p>最近记录：'+esc(active.lastReviewTitle)+'。本周继续依据实际情况制定下一周。</p>' :
    '<p>当前还没有已完成的首尔周复盘。记录实际完成情况后，再决定下一周的训练与学习安排。</p>';
  const historical = records.filter(r=>r.status==="completed").slice(0,2).map(r=>
    '<li><a href="./campaigns/'+encodeURIComponent(r.slug)+'/index.html"><strong>'+esc(r.title)+'</strong></a><small>已完成 · '+esc(r.raceDate)+'</small></li>').join("");
  const weekLinks = weeks.length ? '<details><summary class="life-more">查看早期 Weekly Archive（Week '+esc(weeks[weeks.length-1])+'–'+esc(weeks[0])+ '）</summary><ul class="life-list">'+weeks.map(w=>'<li><a href="./weeks/week'+w+'/index.html">Week '+w+'</a></li>').join("")+'</ul></details>' : '';
  const body =
    '<header class="life-hero"><div class="life-eyebrow">Personal Life Playbook</div><h1>让每一周<br>都有方向。</h1>'+
    '<p class="life-lede">把值得坚持的生活，放进可以执行的一周。持续训练、不断学习、认真记录，也允许自己根据生活调整节奏。</p>'+
    '<div class="life-meta"><span>THIS WEEK · 本周行动</span><span>GOALS · 长期目标</span><span>LIBRARY · 知识参考</span><span>JOURNAL · 经历回顾</span></div></header>'+
    '<section class="life-section" id="this-week"><div class="life-section-head"><h2>本周行动</h2><span class="life-label">One clear plan, each week</span></div><div class="life-grid">'+current+'</div></section>'+
    '<section class="life-section" id="goals"><div class="life-section-head"><h2>正在走向的目标</h2>'+
    '<a href="./campaigns/index.html">Training Campaigns · 全部目标</a></div><div class="life-grid">'+
    (activeCards || '<div class="life-empty">暂时没有进行中的长期目标。</div>')+'</div></section>'+
    '<section class="life-section" id="references"><div class="life-section-head"><h2>生活中的常用参考</h2><a href="./library/index.html">查看资料库</a></div>'+
    '<div class="life-grid"><article class="life-card"><div class="life-label">Current Training · Historical Reference</div><h3>力量与身体维护</h3>'+
    '<p>动作示意、精瘦塑形，以及足踝训练。训练时随手查阅。</p><a class="life-link life-outline" href="./library/index.html#movement">查看动作参考</a></article>'+
    '<article class="life-card"><div class="life-label">Current Dinner · Daily Tool</div><h3>晚餐菜池</h3>'+
    '<p>不需要每次重新制定菜单；保留简单好用的抽菜工具。</p><a class="life-link life-outline" href="./current/dinner.html">今晚吃什么</a></article></div></section>'+
    '<section class="life-section" id="review"><div class="life-section-head"><h2>每周复盘</h2>'+
    (active?'<a href="./campaigns/'+encodeURIComponent(active.slug)+'/index.html#reviews">进入复盘记录</a>':'')+'</div>'+
    '<div class="life-card"><div class="life-label">Review → Adapt</div>'+latest+
    '<div class="life-grid"><div><h3>计划</h3><p>本周希望完成的跑步、力量和学习。</p></div>'+
    '<div><h3>实际与调整</h3><p>真实完成了什么？哪里需要恢复、减量或改变？</p></div></div>'+
    '<p class="life-small">缺失数据保持未知，不把计划量当成实际完成。</p></div></section>'+
    '<section class="life-section" id="history"><div class="life-section-head"><h2>一路走过的经历</h2><a href="./journal/index.html">浏览全部经历</a></div>'+
    '<ul class="life-list">'+historical+'</ul>'+weekLinks+'<p class="life-day-note">兼容旧链接：<a href="./latest/dinner.html">Latest dinner</a> · <a href="./latest/training.html">Latest training</a>（后者仅为历史固定训练模板）。</p></section>';
  return layout("本周与目标", body);
}

function libraryPage() {
  const body='<header class="life-hero"><div class="life-eyebrow">Reference Library</div><h1>常用参考，<br>放在伸手可及的地方。</h1>'+
    '<p class="life-lede">把长期复用的动作、教材和生活工具放在这里。计划会变化，但参考资料不需要每周复制。</p></header>'+
    '<section class="life-section" id="movement"><div class="life-section-head"><h2>训练与身体维护</h2></div>'+
    '<div class="life-grid"><article class="life-card"><div class="life-label">Running strength</div><h3>Seoul Strength A / B</h3>'+
    '<p>周三与周五两套力量动作速览，配合当前 Campaign 使用。</p><a class="life-link life-outline" href="../assets/lean-strength-seoul.svg">打开动作速览</a></article>'+
    '<article class="life-card"><div class="life-label">Movement library</div><h3>按肌群查动作</h3>'+
    '<p>现有肌群训练参考图。也可以查阅旧版固定训练模板，但它不是当前执行计划。</p>'+
    '<a class="life-link life-outline" href="../current/training-reference.html">肌群动作参考</a></article></div></section>'+
    '<section class="life-section"><div class="life-section-head"><h2>韩语学习</h2></div>'+
    '<div class="life-card"><div class="life-label">Primary course</div><h3>Online King Sejong Institute</h3>'+
    '<p>先学习 Sejong Korean Introduction，再根据掌握情况进入 King Sejong Institute Korean 1。每周马拉松词汇只是补充。</p>'+
    '<a class="life-link life-outline" href="https://www.iksi.or.kr/" target="_blank" rel="noopener noreferrer">进入在线世宗学堂</a></div></section>'+
    '<section class="life-section"><div class="life-section-head"><h2>日常生活</h2></div><div class="life-grid">'+
    '<article class="life-card"><div class="life-label">Dinner</div><h3>28道家常菜随机池</h3><p>晚餐选择器是一个实用工具，不必硬塞进马拉松计划。</p><a class="life-link life-outline" href="../current/dinner.html">抽一道菜</a></article>'+
    '<article class="life-card"><div class="life-label">Past template</div><h3>早期固定力量模板</h3><p>保留周一到周五的历史方案，供动作参考。当前安排以活动 Campaign 为准。</p>'+
    '<a class="life-link life-outline" href="../current/training.html">查看历史参考</a></article></div></section>';
  return layout("知识与工具",body,"../","library");
}

function journalPage(records, weeks) {
  const races=records.filter(c=>c.status==="completed").map(c=>
    '<li><a href="../campaigns/'+encodeURIComponent(c.slug)+'/index.html"><strong>'+esc(c.title)+'</strong></a>'+
    '<small>完成日期：'+esc(c.raceDate)+' · 包含训练路线图及逐周复盘</small></li>').join("");
  const archive=weeks.map(w=>'<li><a href="../weeks/week'+w+'/index.html"><strong>Week '+w+'</strong></a>'+
    '<small>早期每周晚餐或训练记录 · 原链接保留</small></li>').join("");
  const body='<header class="life-hero"><div class="life-eyebrow">Journal & history</div><h1>已经走过的，<br>值得留下。</h1>'+
    '<p class="life-lede">成绩之外，还有练过的每一周、做过的调整和生活中的小决定。</p></header>'+
    '<section class="life-section"><div class="life-section-head"><h2>已完成的长期目标</h2></div>'+
    (races?'<ul class="life-list">'+races+'</ul>':'<div class="life-empty">暂无已完成的长期目标。</div>')+'</section>'+
    '<section class="life-section"><div class="life-section-head"><h2>Weekly Archive</h2></div>'+
    (archive?'<ul class="life-list">'+archive+'</ul>':'<div class="life-empty">暂无归档周计划。</div>')+'</section>';
  return layout("经历回顾",body,"../","journal");
}

function decoratePage(path, prefix, type) {
  if (!existsSync(path)) return;
  let html = readFileSync(path,"utf8");
  if (!html.includes('data-life-theme="1"')) {
    html = html.replace("</head>", '<link rel="stylesheet" href="'+prefix+'assets/life.css" data-life-theme="1">\n</head>');
  }
  if (!html.includes("<!-- life-navigation -->")) {
    const intro = '<!-- life-navigation -->'+nav(prefix,type==="campaign"?"goals":type==="archive"?"journal":"library");
    html = html.replace(/<body[^>]*>/,match=>match+'\n'+
      (type==="campaign"?'<div class="life-nav-shell">':'<div class="life-legacy-shell">')+
      intro+'</div>');
  }
  if (!html.includes('id="life-main"')) {
    html = html.replace(/(<main(?:\s[^>]*)?>)/,'<a id="life-main"></a>$1');
    if (!html.includes('id="life-main"')) html=html.replace(/<div class="page">/,'<a id="life-main"></a><div class="page">');
  }
  if (type==="training" && !html.includes("life-legacy-note")) {
    html = html.replace('<main class="panel">',
      '<aside class="life-legacy-note">历史固定训练参考：这不是当前晨跑 / 午间力量的执行计划。请以<a href="'+prefix+'campaigns/index.html">活动中的 Campaign</a> 为准。</aside><main class="panel">');
  }
  if (type==="archive" && !html.includes("life-legacy-note")) {
    html = html.replace(/<body[^>]*>/,s=>s+'<aside class="life-legacy-note" style="max-width:980px;margin:16px auto">历史周计划归档 · <a href="'+prefix+'journal/index.html">返回经历回顾</a></aside>');
  }
  writeFileSync(path,html);
}

export function buildLifeSite(siteRoot, contentRoot = process.cwd()) {
  const assets=resolve(siteRoot,"assets");
  mkdirSync(assets,{recursive:true});
  if (existsSync(THEME_SOURCE)) copyFileSync(THEME_SOURCE,resolve(assets,"life.css"));
  const records=readCampaigns(contentRoot);
  const weeksDir=resolve(siteRoot,"weeks");
  const weeks=existsSync(weeksDir)?readdirSync(weeksDir).filter(v=>/^week\d+$/i.test(v) && existsSync(resolve(weeksDir,v,"index.html"))).map(v=>Number(v.replace(/week/i,""))).sort((a,b)=>b-a):[];
  mkdirSync(resolve(siteRoot,"library"),{recursive:true});
  mkdirSync(resolve(siteRoot,"journal"),{recursive:true});
  writeFileSync(resolve(siteRoot,"index.html"),home(records,weeks));
  writeFileSync(resolve(siteRoot,"library","index.html"),libraryPage());
  writeFileSync(resolve(siteRoot,"journal","index.html"),journalPage(records,weeks));
  const campaignsRoot=resolve(siteRoot,"campaigns");
  if (existsSync(campaignsRoot)) {
    decoratePage(resolve(campaignsRoot,"index.html"),"../../","campaign");
    for (const c of records) decoratePage(resolve(campaignsRoot,c.slug,"index.html"),"../../../","campaign");
  }
  const currentRoot=resolve(siteRoot,"current");
  for (const kind of ["dinner","training","training-reference"]) {
    decoratePage(resolve(currentRoot,kind+".html"),"../",kind==="training"?"training":"reference");
  }
  if (existsSync(weeksDir)) {
    for (const w of weeks) {
      const dir=resolve(weeksDir,"week"+w);
      for (const file of ["index.html","dinner.html","training.html"]) {
        decoratePage(resolve(dir,file),"../../","archive");
      }
    }
  }
  return {active:records.find(c=>c.status==="active")?.slug ?? null, campaigns:records.length, archivedWeeks:weeks.length};
}
