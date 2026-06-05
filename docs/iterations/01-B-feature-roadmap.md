# 迭代 01-B — 功能池 & 开发路线图

> 日期: 2026-06-02
> 最后更新: 2026-06-05
> 依赖: [迭代 01](./01-project-concept.md)

---

## 开发进度总览

| 阶段 | 状态 | 日期 |
|------|------|------|
| MVP 核心 (P0) | ✅ 全部完成 | 06-02 ~ 06-04 |
| 答辩加分 (P1) | ✅ 全部完成 | 06-04 ~ 06-05 |
| 后续规划 (P2) | ✅ 大部分完成 | 06-05 |

---

## 全量功能池（20+ 方向）

### 第一期：MVP 核心 ✅

| # | 功能 | 优先级 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | AI 自动归类 + 智能标签 | P0 | ✅ | DeepSeek V4 Flash 驱动，`src/lib/deepseek.ts` |
| 2 | 富媒体预览 | P0 | ✅ | 不同 contentType 显示不同卡片样式（视频/仓库/文章） |
| 3 | 语义搜索 | P0 | ✅ | 搜索标题、描述、AI摘要、标签名 |
| 4 | 元数据提取引擎 | P0 | ✅ | cheerio OG 提取 + B站 API 降级 |
| 5 | 书签生命周期管理 | P0 | ✅ | 待读→在读→已读→归档，一键切换 |

### 第二期：答辩加分 ✅

| # | 功能 | 优先级 | 状态 | 说明 |
|---|---|---|---|---|
| 14 | AI 摘要 + 关键要点提取 | P1 | ✅ | DeepSeek 自动生成 2-3 句摘要 |
| 19 | 语音搜索 | P1 | ✅ | `src/components/VoiceSearch.tsx`，Web Speech API |

### 第三期：后续规划

#### 知识连接
| # | 功能 | 状态 | 说明 |
|---|---|---|---|
| 6 | 知识图谱视图 | 📋 已规划 | `docs/功能开发/02-知识图谱视图.md` |
| 7 | 关联推荐 | ✅ 已实现 | `src/lib/recommendations.ts` — 标签共现 + 语义精排，详情页/仪表板/发现页三层推荐 |
| 15 | 同一主题横向对比 | 📋 已规划 | `docs/功能开发/04-横向对比.md` |

#### 协作分享
| # | 功能 | 状态 | 说明 |
|---|---|---|---|
| 8 | 共享收藏夹 | ✅ | `/share/[id]` 公开收藏夹页面 |
| 9 | 分享卡片 | ✅ | `/share/bookmark/[token]` 单条书签分享 + 复制链接 |

#### 视觉体验
| # | 功能 | 状态 | 说明 |
|---|---|---|---|
| 10 | 画廊/瀑布流视图 | ✅ | `src/components/MasonryGallery.tsx` — CSS columns 瀑布流 |
| 11 | 数据可视化 Dashboard | ✅ | `src/components/DashboardView.tsx` — Recharts 饼图/柱状图 + 词云 |
| 12 | 可视化时间线 | ✅ | `src/components/TimelineView.tsx` — 按月分组垂直时间线 |
| 16 | 每周书签周报 | ✅ | `src/components/WeeklyReport.tsx` — 本周 vs 上周对比 |
| 17 | 收藏里程碑 | ⬜ | |
| 18 | 随机漫步 | ⬜ | |
| 20 | 导入/导出 | ✅ 部分 | 设置页 JSON 导出已实现，浏览器书签导入待做 |
| 21 | 个人笔记/评论 | ✅ | 学习路径内的 PathNote（微型笔记链） |

#### 其他
| # | 功能 | 状态 | 说明 |
|---|---|---|---|
| 13 | 浏览器扩展 | 📋 已规划 | `docs/功能开发/01-浏览器扩展.md` |
| 22 | RSS 内容更新追踪 | ⬜ | |
| 23 | 书签热度追踪 | 📋 已规划 | `docs/功能开发/05-热度追踪.md` |
| 24 | 多语言摘要翻译 | ⬜ | |
| 25 | 学习路径生成 | ✅ | `src/components/LearningPath*.tsx` — 路径创建/编排/笔记/导出/AI分析 |
| 26 | 新标签页模式 | ⬜ | |

---

## 新增功能（超出原规划）

| 功能 | 说明 |
|------|------|
| GitHub OAuth 登录 | `src/lib/auth.ts` — next-auth v5 + PrismaAdapter |
| 深色模式 | `src/app/globals.css` — CSS 变量 light/dark 主题系统 |
| 设置页面 | `src/app/settings/page.tsx` — 个人信息/主题切换/数据导出 |
| 拖拽排序 | `src/components/SortableBookmarkGrid.tsx` — dnd-kit + Balatro 风格动画+音效 |
| 侧边栏分类拖拽排序 | `src/components/Sidebar.tsx` — dnd-kit 可拖拽重排分类 |
| 发现页 | `src/components/DiscoverView.tsx` — 跨领域/最新/每日精选三种模式 |
| 书签详情推荐 | `src/components/RelatedBookmarks.tsx` — 横向滚动推荐卡片 |
| 收藏夹 CRUD | 侧边栏创建/点击过滤收藏夹 |

---

## 已实现 API 端点（36 个）

```
GET    /api/auth/[...nextauth]
POST   /api/ai/categorize
GET    /api/bookmarks                (支持 status/categoryId/collectionId/q/contentType 过滤)
POST   /api/bookmarks                (创建 + AI 分类 + AI 摘要)
GET    /api/bookmarks/[id]
PATCH  /api/bookmarks/[id]
DELETE /api/bookmarks/[id]
POST   /api/bookmarks/reorder
POST   /api/bookmarks/[id]/share     (生成分享 token)
GET    /api/bookmarks/[id]/related   (关联推荐)
POST   /api/bookmarks/[id]/embed     (生成 embedding 向量)
GET    /api/categories
POST   /api/categories
POST   /api/categories/reorder
GET    /api/collections
POST   /api/collections
PATCH  /api/collections/[id]
DELETE /api/collections/[id]
GET    /api/collections/[id]/bookmarks
POST   /api/collections/[id]/bookmarks
POST   /api/metadata                 (URL 元数据提取)
GET    /api/search                   (全文搜索)
GET    /api/stats                    (统计 + contentType/分类分布 + 本周趋势)
GET    /api/stats/timeline           (按月分组时间线数据)
GET    /api/stats/weekly             (本周 vs 上周对比)
GET    /api/tags
GET    /api/recommendations/dashboard
GET    /api/recommendations/discover
GET    /api/learning-paths
POST   /api/learning-paths
GET    /api/learning-paths/[id]
PATCH  /api/learning-paths/[id]
DELETE /api/learning-paths/[id]
POST   /api/learning-paths/[id]/items
PATCH  /api/learning-paths/[id]/items/[itemId]
DELETE /api/learning-paths/[id]/items/[itemId]
POST   /api/learning-paths/[id]/items/reorder
POST   /api/learning-paths/[id]/analyze   (AI 路径分析)
GET    /api/learning-paths/[id]/export    (Markdown 导出)
POST   /api/learning-paths/[id]/items/[itemId]/notes
PATCH  /api/learning-paths/[id]/items/[itemId]/notes/[noteId]
DELETE /api/learning-paths/[id]/items/[itemId]/notes/[noteId]
```

---

## 组件清单（28 个）

```
src/components/
├── ui/ (15 个 shadcn 基础组件)
├── AddBookmarkDialog.tsx
├── BookmarkCard.tsx
├── BookmarkDetailSheet.tsx
├── SortableBookmarkGrid.tsx
├── Sidebar.tsx
├── MasonryGallery.tsx
├── DashboardView.tsx
├── TimelineView.tsx
├── WeeklyReport.tsx
├── DiscoverView.tsx
├── ViewTabs.tsx
├── WordCloud.tsx
├── VoiceSearch.tsx
├── RelatedBookmarks.tsx
├── LearningPathListView.tsx
├── LearningPathDetailView.tsx
├── ThemeProvider.tsx
└── ThemeToggle.tsx
```
