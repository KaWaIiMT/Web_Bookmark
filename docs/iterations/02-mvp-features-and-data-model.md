# 迭代 02 — MVP 功能详细描述 & 数据模型

> 日期: 2026-06-02
> 依赖: [迭代 01 — 项目概念 & MVP 定义](./01-project-concept.md)

---

## 一、MVP 五大功能 —— 用户故事

### F1. 一键丢入书签（核心流程）

**用户故事：** 用户在输入框粘贴一个 URL，点击"收藏"，系统自动完成以下事情：

1. **元数据提取**（规则层，毫秒级）
   - 从网页 OG 标签 / JSON-LD / `<meta>` 中提取：标题、描述、封面图、网站名、Favicon
   - 根据域名映射内容类型：
     | 域名模式 | 内容类型 | 特殊字段 |
     |---|---|---|
     | `bilibili.com/video/*` | 视频 | UP主、播放量、时长 |
     | `zhihu.com/*` | 问答 | 作者、赞同数 |
     | `github.com/*` | 代码仓库 | Star数、语言、License |
     | `cnblogs.com/*` / 博客园 | 技术文章 | 作者、发布日期 |
     | 通用（无匹配规则） | 网页 | 仅 OG 基础字段 |
   - 自动获取网页截图/缩略图

2. **AI 自动整理**（AI 层，1-3 秒）
   - 根据提取的元数据，AI 返回：
     - 2-5 个智能标签（如 `React`, `前端`, `教程`）
     - 一个分类建议（如 `技术学习 > 前端 > React`）
     - 一段 2-3 句的中文摘要
   - AI 结果展示在确认弹窗中，用户可修改后确认

3. **生命周期初始状态**
   - 默认标记为 `待读`
   - 记录收藏时间

**验收标准：** 粘贴一个链接，3 秒内看到带有封面、标签、摘要的预览卡片，点确认后存入。

---

### F2. 富媒体预览（书签展示）

**用户故事：** 浏览书签列表时，不同内容类型的书签展示不同的卡片样式。

| 内容类型 | 卡片样式 | 展示信息 |
|---|---|---|
| **视频** | 横向大卡片，封面图左侧 | 封面、标题、UP主/频道、时长、播放量、标签、阅读状态 |
| **文章** | 纵向卡片，头图在顶部 | 头图、标题、作者、摘要前两行、标签、阅读时长 |
| **代码仓库** | 紧凑卡片，语言色条 | 仓库名、描述、Star/Fork 数、语言色点、License |
| **通用网页** | 简约卡片，Favicon + 描述 | 标题、域名、描述片段、标签 |

**附加视图：**
- **画廊/瀑布流** — 适用于图片类书签，Masonry 布局
- **列表视图** — 紧凑列表，适合快速浏览
- **按分类筛选** — 侧边栏分类树，点击过滤

**验收标准：** 分别存入 B 站视频、博客园文章、GitHub 仓库、一个普通网页，四种卡片样式正确渲染。

---

### F3. 语义搜索

**用户故事：** 在搜索框输入自然语言，系统返回相关的书签。

- 输入 `"上次那个讲 React hooks 的视频"` → 返回讲 React hooks 的 B 站视频
- 输入 `"Docker 相关的教程"` → 返回标签含 Docker 的所有书签
- 输入 `"上周存的那篇讲 CSS 的文章"` → 返回匹配的书签

**实现方式：**
- 关键词搜索（基础，离线可用）：标题、描述、标签包含搜索词
- 语义搜索（AI 增强，需联网）：将搜索结果用 AI 重排 + 补充语义匹配结果
- 提供搜索建议/自动补全（Optional）

**验收标准：** 自然语言输入能找到目标书签，关键词搜索离线可工作。

---

### F4. 元数据提取引擎

**用户故事：** 这是 F1 的技术基座，用户无感，但作为独立模块展示技术深度。

**输入：** 一个 URL
**输出：** 结构化元数据对象

```typescript
interface BookmarkMetadata {
  title: string;           // 网页标题
  description: string;     // 网页描述
  coverImage: string;      // 封面图 URL
  favicon: string;         // 网站图标
  siteName: string;        // 网站名称（B站、GitHub、博客园...）
  contentType: 'video' | 'article' | 'repository' | 'image' | 'social' | 'webpage';
  
  // 类型特有字段
  specifics?: {
    // 视频
    author?: string;
    duration?: number;
    viewCount?: number;
    
    // 文章
    publishDate?: string;
    wordCount?: number;
    
    // 仓库
    stars?: number;
    forks?: number;
    language?: string;
    license?: string;
  };
  
  // 原始数据
  rawOGTags: Record<string, string>;
  rawJSONLD: object | null;
}
```

**实现：** 后端服务端抓取 HTML → 解析 `<meta>` + OG + JSON-LD → 域名规则映射 → 返回结构化数据。

**答辩亮点：** 可以展示对不同网站的不同提取策略，以及架构图。

---

### F5. 书签生命周期管理

**用户故事：** 书签不只是"存了"，它有自己的状态流转。

```
待读 ──→ 在读 ──→ 已读
  │                 │
  └──── 归档 ←──────┘
```

- **待读**：默认状态，新收藏的书签
- **在读**：用户标记正在阅读
- **已读**：用户标记已读完
- **归档**：过时/不再需要的书签，隐藏但不删除

**定期回顾提醒：**
- 首页显示 `"你 3 个月前收藏的 X 还没看"`
- 可配置提醒周期（关闭 / 每周 / 每月）
- 推送一个随机"待读"书签

**验收标准：** 可以切换书签状态，首页显示待读数量，"随机回顾"按钮可用。

---

## 二、数据模型设计

### 核心表

```
┌─────────────────────┐
│       Bookmark       │
├─────────────────────┤
│ id (PK)              │
│ url                  │
│ title                │
│ description          │
│ coverImage           │
│ favicon              │
│ siteName             │
│ contentType          │  ← 'video' | 'article' | 'repository' | 'webpage' | ...
│ metadata             │  ← JSON, 类型特有字段
│ aiSummary            │  ← AI 生成的摘要 (nullable)
│ status               │  ← 'unread' | 'reading' | 'read' | 'archived'
│ createdAt            │
│ updatedAt            │
│ readAt               │  ← 标记已读的时间
└──────┬──────────────┘
       │
       │ M:N
       ▼
┌─────────────────────┐
│         Tag          │
├─────────────────────┤
│ id (PK)              │
│ name                 │  ← 'React', '前端', '教程'
│ slug                 │  ← 'react'
│ color                │  ← 可选，标签颜色
└─────────────────────┘

┌─────────────────────┐
│    BookmarkTag       │  ← 多对多关联表
├─────────────────────┤
│ bookmarkId (FK)      │
│ tagId (FK)           │
└─────────────────────┘

┌─────────────────────┐
│      Category        │
├─────────────────────┤
│ id (PK)              │
│ name                 │  ← '技术学习'
│ parentId (FK)        │  ← 自引用，支持嵌套
│ slug                 │
│ order                │  ← 排序
└─────────────────────┘

bookmark.categoryId → Category.id  (1:N)
```

### Prisma Schema 预览

```prisma
model Bookmark {
  id          String   @id @default(cuid())
  url         String
  title       String
  description String?
  coverImage  String?
  favicon     String?
  siteName    String?
  contentType String   @default("webpage") // video, article, repository, webpage
  metadata    Json?                        // 类型特有字段
  aiSummary   String?
  status      String   @default("unread")  // unread, reading, read, archived
  categoryId  String?
  category    Category?  @relation(fields: [categoryId], references: [id])
  tags        BookmarkTag[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  readAt      DateTime?
}

model Tag {
  id        String        @id @default(cuid())
  name      String        @unique
  slug      String        @unique
  color     String?
  bookmarks BookmarkTag[]
}

model BookmarkTag {
  bookmarkId String
  tagId      String
  bookmark   Bookmark @relation(fields: [bookmarkId], references: [id], onDelete: Cascade)
  tag        Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([bookmarkId, tagId])
}

model Category {
  id       String     @id @default(cuid())
  name     String
  slug     String     @unique
  parentId String?
  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
  order    Int        @default(0)
  bookmarks Bookmark[]
}
```

---

## 三、API 设计预览

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/bookmarks` | GET | 列表（支持筛选、搜索、分页） |
| `/api/bookmarks` | POST | 创建书签（触发元数据提取 + AI 整理） |
| `/api/bookmarks/[id]` | GET | 单个书签详情 |
| `/api/bookmarks/[id]` | PATCH | 更新状态/分类 |
| `/api/bookmarks/[id]` | DELETE | 删除书签 |
| `/api/metadata/extract` | POST | 元数据提取（传入 URL） |
| `/api/ai/categorize` | POST | AI 分类+标签+摘要（传入元数据） |
| `/api/search` | GET | 搜索（`?q=自然语言查询`） |
| `/api/tags` | GET | 标签列表 |
| `/api/categories` | GET | 分类树 |
| `/api/stats` | GET | 统计数据（总数、状态分布、标签云） |

---

## 四、用户流程（Happy Path）

```
用户打开应用
  → 看到书签列表（默认按时间倒序）
  → 点击左上角"+"或顶部输入框
  → 粘贴 URL (如 https://www.bilibili.com/video/BV1xx411c7mD)
  → 点击"收藏"
  → 系统 loading 动画
    → 后端抓取页面 HTML
    → 提取 OG 标签 + JSON-LD → 得到标题、封面、UP主、播放量
    → 域名匹配 @bilibili.com → contentType="video"
    → 发送元数据到 DeepSeek API
    → AI 返回: { tags: ["React", "前端教程", "B站"], category: "技术学习/前端", summary: "..." }
  → 弹出确认卡片（封面 + 标题 + AI 标签 + 摘要），用户可以编辑
  → 用户点"确认收藏"
  → 卡片出现在列表中，状态为"待读"
  → 用户随时可以切换为"在读"/"已读"
  → 使用搜索框可以用自然语言查找
```

---

## 下一步

- 项目初始化（Next.js + Prisma + shadcn/ui）
- 第一个功能开发：元数据提取引擎
