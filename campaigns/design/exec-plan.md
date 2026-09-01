最合适的方式是：把 Training Campaign 作为现有 weekly 系统旁边的一条独立生成链，不改写原来的 HTML import 逻辑。

```text
现有：
source-html/*.html
    → scripts/import_plan_html.mjs
    → static/plans/current|weeks|latest/

新增：
campaigns/*.md
    → scripts/import_campaign_md.mjs
    → static/plans/campaigns/<slug>/index.html
    → static/plans/campaigns/index.html
```

这样不会让已经稳定的 dinner/training 页面承担 Markdown、front matter、campaign 状态等新概念。

## 推荐目录

```text
micro-weekly/
├── campaigns/
│   └── tj-2026.md
├── scripts/
│   ├── import_plan_html.mjs
│   └── import_campaign_md.mjs
├── static/
│   └── plans/
│       ├── campaigns/
│       │   ├── index.html
│       │   └── tj-2026/
│       │       └── index.html
│       ├── current/
│       ├── latest/
│       ├── weeks/
│       └── index.html
├── tests/
│   ├── import_campaign_md.test.mjs
│   ├── import_plan_html.test.mjs
│   ├── repo_layout.test.mjs
│   └── verify_plans_site.mjs
├── package.json
└── package-lock.json
```

## Markdown contract

`campaigns/tj-2026.md` 使用简单、稳定的 front matter：

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

# Tianjin Marathon 2026

## This Week · W1

Aug 31 – Sep 6, 2026

Target: **30–35 km**

Focus: Run easy. Observe the left arch.

| Day | Training |
| --- | --- |
| Mon | Rest |
| Tue | 7–8 km Easy + 4 × 20s strides |
...

## 8-Week Roadmap

| Week | Dates | Phase | Target |
...

## Weekly Reviews

### Week 1 · Aug 31 – Sep 6

- Actual distance:
- LDR:
- Overall:
- Review:
- Next adjustment:

## Reference

### Effort

...
```

第一版 contract 应当保持严格：

* `slug` 只允许小写字母、数字和连字符。
* `race_date` 使用 `YYYY-MM-DD`。
* `status` 只允许 `upcoming`、`active`、`completed`。
* `current_week` 必须介于 `1` 和 `weeks` 之间。
* 只将这几个二级标题识别为特殊页面区域：

  * `This Week`
  * `8-Week Roadmap`
  * `Weekly Reviews`
  * `Reference`
* 不在 Markdown 中保存 CSS、HTML shell 或生成后的 URL。
* `static/plans/**` 始终是生成结果，不作为内容源。

## Markdown renderer

建议只增加一个依赖：

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "campaign:build": "node scripts/import_campaign_md.mjs",
    "test": "node --test tests/*.test.mjs && node tests/verify_plans_site.mjs"
  },
  "dependencies": {
    "marked": "^16.0.0"
  }
}
```

具体版本让本地 Coding Agent 查询当前稳定版本后锁定，不建议自己实现 Markdown table/list parser。

Front matter 很简单，可以在项目内写一个严格的小型 parser，不必再引入 `gray-matter`。如果 Coding Agent 判断手写 parser 会变复杂，再使用 `gray-matter`。

## 生成命令

支持两种模式：

```bash
node scripts/import_campaign_md.mjs campaigns/tj-2026.md
```

只生成一个 campaign，并重建 campaign index。

```bash
node scripts/import_campaign_md.mjs --all
```

扫描全部 `campaigns/*.md`，重建所有 campaign 页面和索引。

输出：

```text
static/plans/campaigns/tj-2026/index.html
static/plans/campaigns/index.html
```

不需要 `latest` alias。Campaign 的 canonical URL 天生稳定：

```text
/plans/campaigns/tj-2026/
```

## 页面生成方式

生成器应负责：

1. 解析、验证 front matter。
2. 按二级标题把 Markdown 分成四个 section。
3. 使用 `marked` 渲染每个 section 内部的 Markdown。
4. 用独立的 Campaign HTML shell 包裹内容。
5. 根据 metadata 生成：

   * race header
   * `current_week / weeks`
   * progress timeline
   * countdown
   * course-distance side rail
6. 使用 section class 做不同排版：

   * `.campaign-current`
   * `.campaign-roadmap`
   * `.campaign-reviews`
   * `.campaign-reference`
7. 重建 `/plans/campaigns/index.html`。

Countdown 最好在构建时生成一个静态数字，同时用极少量浏览器 JavaScript在访问时重新计算，避免页面长期显示过期数字。

比赛结束后：

```text
status: completed
```

页面标题、日期和内容保留，campaign index 自动将其移动到 Completed。

## Campaign index

`/plans/campaigns/` 建议只显示两组：

```text
ACTIVE / UPCOMING

Tianjin Marathon 2026
Oct 25, 2026 · 42.195 km
Week 1 of 8
Open campaign →

COMPLETED

...
```

排序：

1. `active`
2. `upcoming`，按比赛日期升序
3. `completed`，按比赛日期降序

## 与 `/plans/` 首页集成

现有 `writeIndex()` 会在每次 weekly import 后重建 `static/plans/index.html`，因此不能直接手改生成后的首页。

应该修改 `scripts/import_plan_html.mjs` 中的 `writeIndex()`，永久加入一个通用入口：

```text
Training Campaigns

Long-term race preparation, weekly reviews and adaptations.

Open campaigns →
```

链接：

```text
./campaigns/index.html
```

它不需要读取具体 campaign，所以 weekly generator 以后每次重建首页，都不会把入口覆盖掉。

第一版不必在 `/plans/` 首页直接展示 `tj-2026` 状态。具体状态由 `/plans/campaigns/` 负责，可以避免两个生成器共享复杂数据。

## 测试范围

新增 `tests/import_campaign_md.test.mjs`，至少覆盖：

* 单文件生成到正确 slug 目录。
* `--all` 生成所有 Markdown。
* 输出包含 title、distance、race date、current week。
* `This Week` 被包装为突出区域。
* Markdown table 正常变成 HTML table。
* roadmap、review、reference 都存在。
* campaign index 包含 `tj-2026`。
* active/upcoming/completed 排序正确。
* 非法 slug 被拒绝。
* 缺少必填 metadata 被拒绝。
* `current_week > weeks` 被拒绝。
* 输出具有 viewport、favicon 和返回 `/plans/` 的链接。
* 手机样式不存在明显的固定宽度溢出。

更新现有测试：

* `repo_layout.test.mjs`

  * 检查 `campaigns/tj-2026.md`
  * 检查 `scripts/import_campaign_md.mjs`
  * 检查 campaign 输出。

* `verify_plans_site.mjs`

  * 检查 `/plans/index.html` 包含 Campaigns 入口。
  * 检查 campaign index。
  * 检查 `tj-2026/index.html` 的必要内容和链接。

* 保持以下现有测试完全通过：

  * `import_plan_html.test.mjs`
  * weekly/current/latest 相关验证。

## 每周更新闭环

以后每周只需要编辑：

```text
campaigns/tj-2026.md
```

流程：

1. 在 `Weekly Reviews` 补完刚结束的一周。
2. 调整下一周实际安排。
3. 修改：

```yaml
current_week: 2
```

4. 把 `This Week · W1` 更新成 `This Week · W2`。
5. 运行：

```bash
node scripts/import_campaign_md.mjs campaigns/tj-2026.md
npm test
```

6. commit source 和生成结果。

建议两者一起 commit，因为 Micro.blog 实际托管的是 `static/plans/`：

```bash
git add campaigns/tj-2026.md static/plans/campaigns
git commit -m "docs(training): review week 1 and plan week 2"
```

---

我建议先让本地 Coding Agent 严格完成这一个 vertical slice：

```text
tj-2026.md
→ tj-2026/index.html
→ campaigns/index.html
→ plans 首页入口
```

暂时不要加入通用主题系统、自动生成 weekly 文件或 campaign 与 weekly training 的双向同步。天津这一页完整跑通以后，再决定是否值得进一步抽象。
