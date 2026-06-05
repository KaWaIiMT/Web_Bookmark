# 迭代 04 — 横向对比 & 功能冲刺总结

> 日期: 2026-06-05
> 依赖: [迭代 03](./03-recommendations-learning-paths.md) · [迭代 01-B](./01-B-feature-roadmap.md)

---

## 本迭代完成的功能

### 横向对比（AI 深度分析 + 可视化）

**AI 对比引擎：**
- `src/lib/comparisons.ts` — 调用 DeepSeek V4 Flash，一次性输出雷达图评分、对比矩阵、综合评语
- 分析维度：核心观点层（论点/立场/论据）、技术方案层（方案/性能/生态）、元信息层（权威性/深度/可读性/时效/类型）
- 差异高亮：`significance: normal | notable | critical` 三级标注

**可视化呈现：**
- `src/components/CompareRadar.tsx` — Recharts RadarChart 五维度雷达图（深度/可读性/权威性/时效性/实用性）
- `src/components/CompareMatrix.tsx` — 对比矩阵表（分组表头 + 固定首列 + 差异单元格红/黄高亮）
- `src/components/CompareView.tsx` — 主视图（书签选择 → AI 分析中动画 → 结果展示 → Markdown 导出）

**触发方式：**
- ViewTabs 新增「对比」标签页，点击进入书签选择页面
- 勾选 2-5 篇 → 点击「开始对比」→ AI 分析 → 展示结果
- 一键导出 Markdown 对比报告

---

## 全量 API 端点总览（40 个）

```
认证/用户：
┌── /api/auth/[...nextauth]           (NextAuth v5 GitHub OAuth)
└── /api/users/profile                 (计划中)

AI 服务：
├── /api/ai/categorize                 POST   AI 标签/分类/摘要
├── /api/comparisons                   POST   AI 对比分析 (2-5篇)
├── /api/learning-paths/[id]/analyze   POST   AI 路径骨架分析
└── /api/bookmarks/[id]/embed          POST   生成 embedding 向量

书签：
├── /api/bookmarks                     GET|POST
├── /api/bookmarks/[id]                GET|PATCH|DELETE
├── /api/bookmarks/reorder             POST   拖拽排序
├── /api/bookmarks/[id]/share          POST   生成分享token
├── /api/bookmarks/[id]/related        GET    关联推荐(标签共现)
└── /api/bookmarks/[id]/embed          POST   生成embedding

分类：
├── /api/categories                    GET|POST
└── /api/categories/reorder           POST   拖拽排序

收藏夹：
├── /api/collections                   GET|POST
├── /api/collections/[id]              PATCH|DELETE
└── /api/collections/[id]/bookmarks    GET|POST

搜索/统计/推荐：
├── /api/search                        GET    全文搜索
├── /api/stats                         GET    统计数据+趋势
├── /api/stats/timeline                GET    按月分组时间线
├── /api/stats/weekly                  GET    本周vs上周
├── /api/recommendations/dashboard     GET    Dashboard个性化推荐
├── /api/recommendations/discover      GET    发现页推荐
└── /api/metadata                      POST   元数据提取

学习路径：
├── /api/learning-paths                GET|POST
├── /api/learning-paths/[id]           GET|PATCH|DELETE
├── /api/learning-paths/[id]/items     POST
├── /api/learning-paths/[id]/items/[itemId]    PATCH|DELETE
├── /api/learning-paths/[id]/items/reorder     POST
├── /api/learning-paths/[id]/analyze   POST
├── /api/learning-paths/[id]/export    GET
├── /api/learning-paths/[id]/items/[itemId]/notes          POST
└── /api/learning-paths/[id]/items/[itemId]/notes/[noteId] PATCH|DELETE

标签：
└── /api/tags                          GET
```

---

## 组件清单（24 个业务组件 + 15 个 UI 基础组件）

```
业务组件（src/components/）：
├── AddBookmarkDialog.tsx         添加/编辑书签（多步骤：提取→AI分类→预览→保存）
├── BookmarkCard.tsx              书签卡片（封面+状态+标签+右键菜单）
├── BookmarkDetailSheet.tsx       书签详情抽屉（动画展开+相关推荐+分享）
├── SortableBookmarkGrid.tsx      可拖拽排序卡片网格（dnd-kit + Balatro音效）
├── Sidebar.tsx                   侧边栏（收藏夹/状态/分类筛选+分类拖拽排序）
├── MasonryGallery.tsx            画廊瀑布流（CSS columns）
├── DashboardView.tsx             仪表板（Recharts饼图+柱状图+词云）
├── TimelineView.tsx              时间线（按月分组垂直时间线+motion动画）
├── WeeklyReport.tsx              每周周报（本周vs上周对比）
├── DiscoverView.tsx              发现页（跨领域/最新/每日精选三模式）
├── CompareView.tsx               横向对比（选择→AI分析→雷达图+矩阵+评语）
├── CompareRadar.tsx              五维度雷达图（Recharts RadarChart）
├── CompareMatrix.tsx             对比矩阵表（分组展示+差异高亮）
├── LearningPathListView.tsx      学习路径列表（+快速创建）
├── LearningPathDetailView.tsx    路线图视图（Reorder拖拽+笔记+进度+AI分析）
├── ViewTabs.tsx                  视图切换选项卡（8个标签）
├── WordCloud.tsx                 纯CSS词云
├── VoiceSearch.tsx               语音搜索（Web Speech API）
├── RelatedBookmarks.tsx          相关推荐卡片行
├── ThemeProvider.tsx             主题Provider
├── ThemeToggle.tsx               主题切换（浅色/深色/系统）
├── RecommendationCard.tsx        推荐卡片（可复用）
```

---

## 数据库模型（10 个）

```
User                — 用户（GitHub OAuth）
Account             — OAuth账户关联
Session             — 认证会话
VerificationToken   — 验证令牌
Bookmark            — 书签（含embedding/shareToken）
Tag                 — 标签（用户私有）
BookmarkTag         — 书签-标签多对多
Category            — 分类（树形结构）
Collection          — 收藏夹
CollectionBookmark  — 收藏夹-书签多对多
LearningPath        — 学习路径
LearningPathItem    — 路径节点
PathNote            — 微型笔记
```

---

## 技术栈总结

| 技术 | 用途 |
|------|------|
| Next.js 16.2.6 (Turbopack) | 全栈框架 |
| React 19.2.4 | UI |
| TypeScript 5.x | 类型安全 |
| Prisma 7.8.0 + SQLite | ORM + 数据库 |
| next-auth v5 beta | GitHub OAuth 认证 |
| Tailwind CSS 4.x | 原子化 CSS |
| shadcn/ui + base-ui | UI 组件库 |
| motion 12.x | 动画引擎 |
| dnd-kit | 拖拽排序 |
| Recharts 3.8.1 | 图表（饼图/柱状图/雷达图） |
| DeepSeek V4 Flash | AI 分类/摘要/推荐/对比 |
| DeepSeek Embedding | 语义向量 |
| OpenAI SDK 6.41.0 | AI API 调用 |
| date-fns 4.x | 日期处理 |
| cheerio 1.x | HTML 元数据提取 |
| sonner | Toast 通知 |
| lucide-react | 图标库 |

---

## 功能完成度 vs 原规划

| 规划中的功能 | 状态 |
|------|------|
| AI 自动归类 + 智能标签 (P0) | ✅ |
| 富媒体预览 (P0) | ✅ |
| 语义搜索 (P0) | ✅ |
| 元数据提取引擎 (P0) | ✅ |
| 书签生命周期管理 (P0) | ✅ |
| AI 摘要 (P1) | ✅ |
| 语音搜索 (P1) | ✅ |
| 关联推荐 (P2) | ✅ |
| 共享收藏夹 (P2) | ✅ |
| 分享卡片 (P2) | ✅ |
| 画廊/瀑布流 (P2) | ✅ |
| 数据可视化 Dashboard (P2) | ✅ |
| 可视化时间线 (P2) | ✅ |
| 每周书签周报 (P2) | ✅ |
| 学习路径生成 (P2) | ✅ |
| 同一主题横向对比 (P2) | ✅ |
| 浏览器扩展 (P2) | 📋 已规划 |
| 知识图谱视图 (P2) | 📋 已规划 |
| 书签热度追踪 (P2) | 📋 已规划 |
| 收藏里程碑 (P2) | ⬜ |
| 随机漫步 (P2) | ⬜ |
| RSS 追踪 (P2) | ⬜ |

**总计：20 个规划功能中 16 个已完成，3 个已规划文档，1 个未开始。**
