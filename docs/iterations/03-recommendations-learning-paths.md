# 迭代 03 — 关联推荐 & 学习路径 & 横向对比

> 日期: 2026-06-05
> 依赖: [迭代 02](./02-user-auth-sharing.md) · [迭代 01-B](./01-B-feature-roadmap.md)

---

## 本迭代完成的功能

### 1. 关联推荐（3 层推荐体系）

**标签共现推荐（免 AI，毫秒级）：**
- `src/lib/recommendations.ts` — Jaccard 标签相似度算法 + 同分类热门降级
- `src/app/api/bookmarks/[id]/related/route.ts` — GET Top-5 关联书签
- `src/components/RelatedBookmarks.tsx` — 书签详情抽屉底部的横向滚动推荐卡片行

**语义向量精排（AI 增强）：**
- `src/lib/embeddings.ts` — DeepSeek Embedding API 封装，复用 OpenAI SDK
- `prisma/schema.prisma` — Bookmark 新增 `embedding String?` 字段
- `src/app/api/bookmarks/[id]/embed/route.ts` — POST 生成并缓存 embedding
- 混合评分：标签分 40% + 语义余弦相似度 60%

**Dashboard/Discover 推荐：**
- `src/app/api/recommendations/dashboard/route.ts` — 三维度推荐（继续深入/拓展边界/重温旧藏）
- `src/app/api/recommendations/discover/route.ts` — 三模式发现（跨领域/最新收录/每日精选）
- `src/components/DiscoverView.tsx` — 独立发现页

### 2. 学习路径（创建/编排/追踪/导出）

**数据模型：**
- `LearningPath` — 学习路径（标题、目标标签、状态）
- `LearningPathItem` — 路径节点（排序、难度、阶段、完成状态）
- `PathNote` — 微型笔记链（收获/疑问/行动）

**API（10 个端点）：**
- CRUD：`/api/learning-paths` + `/[id]` + `items`
- 排序：`/api/learning-paths/[id]/items/reorder`
- AI 分析：`/api/learning-paths/[id]/analyze` — 骨架生成 + 知识缺口检测
- 导出：`/api/learning-paths/[id]/export` — Markdown 下载
- 笔记：`/api/learning-paths/[id]/items/[itemId]/notes`

**组件：**
- `src/components/LearningPathListView.tsx` — 路径列表 + 快速创建
- `src/components/LearningPathDetailView.tsx` — 路线图视图（Reoder 拖拽、进度条、笔记、AI 分析）

### 3. 发现页

- `src/components/DiscoverView.tsx` — 跨领域/Trending/每日精选三模式
- 顶部 ViewTabs 新增「发现」和「学习路径」两个标签

### 4. 横向对比（AI 深度分析）

- `src/lib/comparisons.ts` — AI 对比分析引擎（DeepSeek V4 Flash，五维度评分）
- `src/app/api/comparisons/route.ts` — POST 2-5 篇书签对比，返回雷达图 + 矩阵表 + 评语
- `src/components/CompareView.tsx` — 主视图（书签选择 → AI 分析 → 结果展示 → Markdown 导出）
- `src/components/CompareRadar.tsx` — Recharts RadarChart 五维度雷达图
- `src/components/CompareMatrix.tsx` — 对比矩阵表（分组展示 + 差异单元格红/黄高亮）

---

## 新增 API 端点（22 个）

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/bookmarks/[id]/related` | GET | 标签共现关联推荐 |
| `/api/bookmarks/[id]/embed` | POST | 生成 embedding 向量 |
| `/api/recommendations/dashboard` | GET | Dashboard 个性化推荐 |
| `/api/recommendations/discover` | GET | 发现页推荐 |
| `/api/learning-paths` | GET/POST | 学习路径列表/创建 |
| `/api/learning-paths/[id]` | GET/PATCH/DELETE | 路径详情/更新/删除 |
| `/api/learning-paths/[id]/items` | POST | 向路径添加书签 |
| `/api/learning-paths/[id]/items/[itemId]` | PATCH/DELETE | 节点状态/移除 |
| `/api/learning-paths/[id]/items/reorder` | POST | 拖拽重排 |
| `/api/learning-paths/[id]/analyze` | POST | AI 骨架分析 |
| `/api/learning-paths/[id]/export` | GET | Markdown 导出 |
| `/api/learning-paths/[id]/items/[itemId]/notes` | POST | 添加笔记 |
| `/api/learning-paths/[id]/items/[itemId]/notes/[noteId]` | PATCH/DELETE | 编辑/删除笔记 |

---

## 新增文件（17 个）

```
src/lib/recommendations.ts
src/lib/embeddings.ts
src/lib/learning-path.ts
src/app/api/bookmarks/[id]/related/route.ts
src/app/api/bookmarks/[id]/embed/route.ts
src/app/api/recommendations/dashboard/route.ts
src/app/api/recommendations/discover/route.ts
src/app/api/learning-paths/route.ts
src/app/api/learning-paths/[id]/route.ts
src/app/api/learning-paths/[id]/items/route.ts
src/app/api/learning-paths/[id]/items/[itemId]/route.ts
src/app/api/learning-paths/[id]/items/reorder/route.ts
src/app/api/learning-paths/[id]/analyze/route.ts
src/app/api/learning-paths/[id]/export/route.ts
src/app/api/learning-paths/[id]/items/[itemId]/notes/route.ts
src/app/api/learning-paths/[id]/items/[itemId]/notes/[noteId]/route.ts
src/components/LearningPathListView.tsx
src/components/LearningPathDetailView.tsx
src/components/DiscoverView.tsx
src/components/RelatedBookmarks.tsx
```

---

## 关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 推荐算法 | 标签共现（召回）+ AI 语义向量（精排）混合 | 零 API 调用即时响应 + AI 精度 |
| 向量存储 | Bookmark.embedding JSON 文本字段 | SQLite 不支持 pgvector，<10k 条应用层余弦相似度足够 |
| 向量模型 | DeepSeek Embedding API | 复用现有 OpenAI SDK，无需新依赖 |
| 学习路径 AI | 单次 chat.completions.create 批量分析 | 成本最低，DeepSeek Flash 足够 |
| 词云 | 纯 CSS flex-wrap + 动态字号 | 不依赖 d3-cloud，效果足够答辩使用 |
| 雷达图 | Recharts 3.8.1 内置 RadarChart | 已在项目依赖中，同 Dashboard 模式 |
