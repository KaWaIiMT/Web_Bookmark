# markbox-intro - Design Spec

> Human-readable design narrative — rationale, audience, style, color choices, content outline. Read once by downstream roles for context.
>
> Machine-readable execution contract: `spec_lock.md` (color / typography / icon / image short form). Executor re-reads `spec_lock.md` before every SVG page to resist context-compression drift. Keep both in sync; on divergence, `spec_lock.md` wins.

## I. Project Information

| Item | Value |
| ---- | ----- |
| **Project Name** | markbox-intro |
| **Canvas Format** | PPT 16:9 (1280×720) |
| **Page Count** | 14 |
| **Mode** | showcase |
| **Visual Style** | modern-tech |
| **Target Audience** | 开发者、技术团队、知识工作者、开源社区用户 |
| **Use Case** | 项目路演、GitHub README 配套演示、技术分享 |
| **Created Date** | 2026-06-16 |

---

## II. Canvas Specification

| Property | Value |
| -------- | ----- |
| **Format** | PPT 16:9 |
| **Dimensions** | 1280×720 |
| **viewBox** | `0 0 1280 720` |
| **Margins** | left/right 60px, top/bottom 50px |
| **Content Area** | 1160×620 (from margins) |

---

## III. Visual Theme

### Theme Style

- **Mode**: showcase — 产品功能展示型，每页聚焦一个亮点，节奏明快
- **Visual style**: warm-editorial-light — 暖亮编辑风，干净留白，陶土橙点缀
- **Theme**: Light theme
- **Tone**: 专业、温暖、现代、可信赖

### Color Scheme

Dark tech-blue theme with cyan accents. 60-30-10 rule: primary blue ~60% visual weight, secondary slate ~30%, accent cyan ~10%.
→ **Updated**: Warm editorial light theme. White/cream base with terra cotta accents. Screenshots (light mode) blend naturally.

| Role | HEX | Purpose |
| ---- | --- | ------- |
| **Background** | `#FAFAF8` | 页面主背景（暖白） |
| **Secondary bg** | `#F2F0ED` | 卡片背景、分区背景 |
| **Primary** | `#c9866b` | 标题装饰、关键分区、图标主色 |
| **Accent** | `#b76e4b` | 数据高亮、关键信息、强调 |
| **Secondary accent** | `#d4a574` | 次级强调、渐变过渡 |
| **Body text** | `#2D2A26` | 正文主文字 |
| **Secondary text** | `rgba(45,42,38,0.55)` | 说明文字、注释 |
| **Tertiary text** | `rgba(45,42,38,0.30)` | 辅助信息、页脚 |
| **Border/divider** | `rgba(45,42,38,0.08)` | 卡片边框、分割线 |
| **Success** | `#10B981` | 正面指标 |
| **Warning** | `#F59E0B` | 提醒标记 |

### Gradient Scheme

```xml
<!-- Title accent gradient -->
<linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stop-color="#c9866b"/>
  <stop offset="100%" stop-color="#b76e4b"/>
</linearGradient>

<!-- Background decorative glow (light theme: subtle warmth) -->
<radialGradient id="bgGlow" cx="80%" cy="20%" r="50%">
  <stop offset="0%" stop-color="#c9866b" stop-opacity="0.06"/>
  <stop offset="100%" stop-color="#FAFAF8" stop-opacity="0"/>
</radialGradient>
```

---

## IV. Typography System

### Font Plan

Typography direction: modern CJK sans — clean, tech-oriented, unified family across all roles.

| Role | Chinese | English | Fallback tail |
| ---- | ------- | ------- | ------------- |
| **Title** | `"Noto Sans SC"` | `Arial` | `sans-serif` |
| **Body** | `"Noto Sans SC"` | `Arial` | `sans-serif` |
| **Emphasis** | `"Noto Sans SC"` | `Arial` | `sans-serif` |
| **Code** | — | `Consolas, "Courier New"` | `monospace` |

**Per-role font stacks** (CSS `font-family` strings):
- Title: `"Noto Sans SC", Arial, sans-serif`
- Body: `"Noto Sans SC", Arial, sans-serif`
- Emphasis: same as Body
- Code: `Consolas, "Courier New", monospace`

### Font Size Hierarchy

**Baseline**: Body font size = 20px (medium density — balances readability with information density)

| Purpose | Ratio to body | Target px | Weight |
| ------- | ------------- | --------- | ------ |
| Cover title (hero headline) | 2.5-5x | 56-72px | Bold |
| Chapter / section opener | 2-2.5x | 40-50px | Bold |
| Page title | 1.5-2x | 30-40px | Bold |
| Hero number (KPI) | 1.5-2x | 30-40px | Bold |
| Subtitle | 1.2-1.5x | 24-30px | SemiBold |
| **Body content** | **1x** | **20px** | Regular |
| Annotation / caption | 0.7-0.85x | 14-17px | Regular |
| Page number / footnote | 0.5-0.65x | 10-13px | Regular |

---

## V. Layout Principles

### Page Structure

- **Header area**: Top 50-60px — page title left-aligned, optional section label
- **Content area**: Central ~560px — main content, cards, charts, diagrams
- **Footer area**: Bottom 30-40px — page number right-aligned, optional project name

### Layout Pattern Library

| Pattern | Suitable Scenarios |
| ------- | ----------------- |
| **Single column centered** | Cover, closing, key points |
| **Three/four column cards** | Feature lists, view overview |
| **Asymmetric split (2:8 / 3:7)** | Tech stack sidebar + main content |
| **Top-bottom split** | Process flows, timelines |
| **Matrix grid (2×2)** | Quadrant comparisons, feature matrix |
| **Z-pattern / waterfall** | Step-by-step workflows |
| **Negative-space-driven** | Hero moments, single-message pages |

### Spacing Specification

**Universal**:
| Element | Value |
| ------- | ----- |
| Safe margin from canvas edge | 60px |
| Content block gap | 32px |
| Icon-text gap | 12px |

**Card-based layouts**:
| Element | Value |
| ------- | ----- |
| Card gap | 24px |
| Card padding | 24px |
| Card border radius | 12px |

---

## VI. Icon Usage Specification

### Source

- **Built-in icon library**: `templates/icons/` — tabler-outline (stroke icons)
- **Stroke width**: 2

### Recommended Icon List

| Purpose | Icon Path | Page |
| ------- | --------- | ---- |
| 书签/收藏 | `bookmark` | P01-P14 |
| 链接 | `link` | P02, P06 |
| AI 智能 | `brain` | P05 |
| 搜索 | `search` | P04, P10 |
| 标签 | `tag` | P05, P06 |
| 仪表板 | `layout-dashboard` | P08 |
| 图表 | `chart-bar` | P08 |
| 时间线 | `timeline` | P08 |
| 图谱 | `graph` | P09 |
| 对比 | `git-compare` | P09 |
| 学习路径 | `puzzle` | P09 |
| 扩展 | `puzzle` | P10 |
| 安全 | `shield-check` | P11 |
| API密钥 | `key` | P11 |
| 代码 | `terminal` | P13 |
| 设置 | `settings` | P12 |
| GitHub | `git-fork` | P14 |
| 魔法/AI | `sparkles` | P05, P14 |
| 用户 | `users` | P12 |
| 数据库 | `database` | P04, P13 |
| 语音 | `wand` | P10 |
| 火箭 | `rocket` | P03 |
| 锁定 | `lock` | P11 |
| 地球 | `globe` | P02 |
| 眼睛 | `eye` | P07 |
| 星星 | `star` | P01, P14 |

---

## VII. Visualization Reference List

No data-chart templates needed — this deck uses icon-driven layouts and text cards, not data visualizations from the charts library.

---

## VIII. Image Resource List

No images — pure typography + SVG icon + gradient-driven design. This section intentionally empty.

---

## IX. Content Outline

### Part 1: Opening (P01-P03)

#### Slide 01 - Cover

- **Layout**: Single column centered — full dark background with subtle radial glow, large title, vertical stack
- **Title**: MarkBox
- **Subtitle**: AI 智能书签管理器
- **Info**: 粘贴链接 · AI 理解 · 知识沉淀
- **Decor**: decorative icon sparkles + bookmark, gradient underline

#### Slide 02 - 问题

- **Layout**: Asymmetric split — left large headline + right three pain-point cards
- **Title**: 书签的困境
- **Core message**: 收藏从未停止，整理从未开始 — 信息过载时代，传统书签管理已经失效
- **Content**:
  - 收藏 500+ 链接，想找的永远找不到 — 缺乏智能分类和搜索
  - 看到好文章就存，存完再也不看 — 缺乏阅读追踪和回顾机制
  - 知识散落各处，无法形成体系 — 孤立的链接，没有关联和深度

#### Slide 03 - 解决方案

- **Layout**: Single column centered — large hero statement, then horizontal 3-step flow
- **Title**: MarkBox 的答案
- **Core message**: 一个链接进来，AI 自动提取、理解、分类、关联 — 你只管收藏，剩下的交给 AI
- **Content**:
  - 📎 粘贴链接 → 🧠 AI 自动分析 → 📊 知识网络自动生长
  - 三步闭环：收藏 → 理解 → 发现

### Part 2: Core Capabilities (P04-P07)

#### Slide 04 - 技术栈

- **Layout**: Two-row — top row 4 tech cards, bottom row supporting tech badges
- **Title**: 技术栈
- **Core message**: 基于 Next.js 16 + React 19 全栈框架，Prisma 7 持久化，DeepSeek V4 Flash 驱动 AI
- **Content**:
  - **全栈框架**: Next.js 16 (Turbopack) + React 19.2
  - **数据层**: Prisma 7.8 + SQLite (libsql)
  - **AI 引擎**: DeepSeek V4 Flash
  - **UI**: Tailwind CSS 4 + shadcn/ui + motion
  - [badge] TypeScript · next-auth · dnd-kit · Recharts · lucide-react · sonner

#### Slide 05 - AI 智能能力

- **Layout**: Three-column cards, each with icon + title + description
- **Title**: AI 驱动的智能理解
- **Core message**: 三个 AI 能力让每个书签从「一个链接」变成「一份结构化知识」
- **Content**:
  - 🏷️ **自动标签** — AI 生成 2-5 个精准中文标签
  - 📂 **智能分类** — 自动建议层级分类路径
  - 📝 **AI 摘要** — 2-3 句中文摘要，快速回顾

#### Slide 06 - 核心功能闭环

- **Layout**: Four-step horizontal flow (Z-pattern), each step with icon + key actions
- **Title**: 从收藏到洞察
- **Core message**: 添加→管理→发现→洞察 四步闭环，书签不再是终点而是知识起点
- **Content**:
  - ➕ **添加** — URL 自动提取元数据 / 浏览器扩展一键收藏 / 快捷键静默收藏
  - 📋 **管理** — 拖拽排序 / 状态流转(待读→在读→已读→归档) / 收藏夹
  - 🔍 **发现** — 全文搜索 / 相关推荐 / 跨领域发现
  - 📊 **洞察** — 仪表板统计 / 时间线 / 周报

#### Slide 07 - 十大视图总览

- **Layout**: Grid of 3×3 cards + 1 centered card, each with icon + view name
- **Title**: 十大功能视图
- **Core message**: 同一个书签库，十种视角 — 每种视角解决一种「我想看什么」的需求
- **Content**:
  - Grid · Gallery · Discover · Compare · Learning Path
  - Activity · Dashboard · Timeline · Weekly · Knowledge Graph

### Part 3: Deep Dive (P08-P11)

#### Slide 08 - 数据洞察

- **Layout**: Three-column cards — Dashboard, Timeline, Weekly
- **Title**: 数据驱动的阅读洞察
- **Core message**: 不只是收藏，更是对自己知识消费的可视化理解
- **Content**:
  - **📊 仪表板** — 阅读状态饼图 / 内容类型柱状图 / 标签词云 / 智能推荐
  - **🕐 时间线** — 按年月分组，可视化收藏时间分布，交错入场动画
  - **📅 周报** — 本周 vs 上周对比 / 状态分布 / Top 标签 / 增长趋势

#### Slide 09 - 知识发现

- **Layout**: Three-column cards — Graph, Compare, Learning Path
- **Title**: 深度知识发现
- **Core message**: 让书签之间产生联系 — 图谱关联、多维度对比、结构化学习路径
- **Content**:
  - **🧬 知识图谱** — 力导向图展示书签-标签-分类关联网络，Canvas 截图导出
  - **⚖️ 横向对比** — 选择 2-5 篇书签，AI 多维度对比（雷达图+矩阵表格）
  - **📚 学习路径** — 结构化学习计划，进度追踪，AI 分析路径合理性

#### Slide 10 - 浏览器扩展 + 语音

- **Layout**: Two-column split — left extension, right voice search
- **Title**: 无处不在的入口
- **Core message**: 不离开浏览器就能完成一切 — 右键收藏、快捷键、语音搜索
- **Content**:
  - **🧩 浏览器扩展**
    - 右键菜单收藏 / `Ctrl+Shift+S` 静默收藏
    - 弹窗完整收藏流程（去重检测 + AI 分类）
    - 侧边栏浏览搜索最近书签
  - **🎤 语音搜索**
    - Web Speech API（中文识别）
    - 实时识别展示 + 脉冲指示器
    - 自动填入搜索

#### Slide 11 - 认证安全

- **Layout**: Two-column split — left auth, right API keys
- **Title**: 安全与开放
- **Core message**: 双重认证保障安全，API Key 开放集成 — 兼顾安全与可扩展
- **Content**:
  - **🔐 认证体系**
    - GitHub OAuth 登录（NextAuth v5）
    - 双重中间件：Session 优先 + API Key 回退
    - SHA-256 哈希密钥存储
  - **🔑 API Key 管理**
    - `mb_` 前缀 96 字符随机密钥
    - 仅生成时完整显示一次
    - 显示/隐藏/复制/吊销

### Part 4: Admin & Closing (P12-P14)

#### Slide 12 - 管理面板

- **Layout**: Two cards — user management + bookmark oversight
- **Title**: 管理面板
- **Core message**: 多用户管理、书签审查 — 为团队和实例管理员提供完整控制
- **Content**:
  - **👥 用户管理** — 用户列表 / 角色分配 / 书签查看
  - **📋 数据管理** — 书签导出 JSON / 统计卡片 / 数据概览

#### Slide 13 - 技术亮点

- **Layout**: Four-card grid — each with icon + highlight
- **Title**: 技术亮点
- **Core message**: 不止是功能多，架构设计同样讲究
- **Content**:
  - **⚡ 乐观 UI** — dnd-kit 拖拽即时反馈，乐观更新
  - **🎨 动画系统** — motion (Framer Motion) 驱动，从卡片展开到时间线交错
  - **🌐 CORS 中间件** — 浏览器扩展 / localhost / 自定义域名统一支持
  - **🔊 音效反馈** — Web Audio API 拖拽音效，细节打磨
  - **📱 响应式** — 桌面固定侧边栏 / 移动端抽屉式，Balatro 风格动量滚动

#### Slide 14 - 结尾

- **Layout**: Single column centered — large title, GitHub link, CTA
- **Title**: 开始使用 MarkBox
- **Core message**: 开源免费，一行命令启动，让书签成为你的第二大脑
- **Content**:
  - `git clone https://github.com/KaWaIiMT/Web_Bookmark.git`
  - `npm install && npx prisma db push && npm run dev`
  - 欢迎 Star ⭐ & Contribute 🚀

---

## X. Speaker Notes Requirements

One speaker note file per page, saved to `notes/`:
- **Filename**: match SVG name (e.g., `01_cover.md`)
- **Content**: script key points, timing cues, transition phrases

---

## XI. Technical Constraints Reminder

### SVG Generation Must Follow:

1. viewBox: `0 0 1280 720`
2. Background uses `<rect>` elements
3. Text wrapping uses `<tspan>` (`<foreignObject>` FORBIDDEN)
4. Transparency uses `fill-opacity` / `stroke-opacity`; `rgba()` FORBIDDEN
5. FORBIDDEN: `mask`, `<style>`, `class`, `foreignObject`
6. FORBIDDEN: `textPath`, `animate*`, `script`
7. Text characters: write typography & symbols as raw Unicode; HTML named entities FORBIDDEN
8. `marker-start` / `marker-end` conditionally allowed
9. `clipPath` conditionally allowed **only on `<image>` elements**

### PPT Compatibility Rules:
- `<g opacity="...">` FORBIDDEN; set on each child element individually
- Image transparency uses overlay mask layer
- Inline styles only; external CSS and `@font-face` FORBIDDEN
