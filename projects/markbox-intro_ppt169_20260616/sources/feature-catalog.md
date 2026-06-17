# MarkBox 功能清单

> AI 驱动的智能书签管理器 | Next.js 16 + Prisma 7 + shadcn/ui + DeepSeek V4 Flash

---

## 一、核心书签管理 (CRUD)

### 1.1 添加书签
- 输入 URL → 自动提取元数据 → AI 分类/标签/摘要 → 预览确认 → 保存
- 自动抓取：标题、描述、封面图、favicon、站点名
- AI 自动生成 2-5 个中文标签
- AI 自动建议层级分类路径（`>` 分隔）
- AI 自动生成 2-3 句中文摘要
- 支持编辑模式（修改已有书签）
- **API**：`POST /api/bookmarks`、`POST /api/metadata`、`POST /api/ai/categorize`

### 1.2 浏览书签
- 响应式卡片网格排列（默认网格视图）
- 瀑布流画廊视图（图片/带封面的书签）
- 多维度筛选：状态、分类、收藏夹、搜索、内容类型
- **API**：`GET /api/bookmarks`

### 1.3 编辑书签
- 打开编辑对话框，修改 URL、标题、描述等
- **API**：`PATCH /api/bookmarks/[id]`

### 1.4 删除书签
- 删除确认弹窗
- **API**：`DELETE /api/bookmarks/[id]`

### 1.5 状态流转
- 四种阅读状态：待读 → 在读 → 已读 → 归档
- 卡片右键菜单、详情面板下拉选择
- **API**：`PATCH /api/bookmarks/[id]`

### 1.6 拖拽排序
- `@dnd-kit` 拖拽排序书签卡片，乐观 UI 更新
- 拖拽时播放取起/放下音效（Web Audio API）
- **API**：`POST /api/bookmarks/reorder`

### 1.7 搜索书签
- 全局搜索栏（标题、描述、AI 摘要、标签名），防抖处理
- **API**：`GET /api/search`

---

## 二、十大功能视图

### 2.1 📋 网格视图 (Grid)
- 响应式卡片网格，右键上下文菜单（切换状态、删除、编辑、分享）

### 2.2 🖼️ 画廊视图 (Gallery)
- CSS Columns 瀑布流布局，展示图片/带封面的书签，悬停查看详情

### 2.3 🔍 发现视图 (Discover)
- **跨领域发现**：从不同分类中各随机抽取一篇
- **最新收录**：按时间排序的最新 10 篇
- **每日精选**：随机抽取 5 篇
- **API**：`GET /api/recommendations/discover`

### 2.4 ⚖️ 对比视图 (Compare)
- 选择 2-5 篇书签，AI 多维度对比分析
- **雷达图**：5 维度评分（深度、可读性、权威性、时效性、实用性）
- **矩阵表格**：详细对比（含重要性标注：critical/notable/normal）
- **AI 评论**：综合对比分析结论
- **API**：`POST /api/comparisons`

### 2.5 📚 学习路径 (Learning Path)
- 创建结构化学习计划，将书签组织成循序渐进的学习路径
- 每个路径项可设置：阶段、难度、预估时间、是否可选
- 完成状态追踪、学习笔记（takeaway/note 类型）
- 拖拽排序学习步骤
- AI 分析路径合理性
- **API**：`GET/POST /api/learning-paths`、`GET/PATCH/DELETE /api/learning-paths/[id]`、`POST /api/learning-paths/[id]/items`、`POST /api/learning-paths/[id]/items/reorder`、`POST /api/learning-paths/[id]/analyze`、`GET/POST /api/learning-paths/[id]/items/[itemId]/notes`

### 2.6 🔥 热度追踪 (Activity)
- 追踪 GitHub 仓库书签的热度指标（Star、Fork、Issue、View、Like）
- Canvas 绘制的 Sparkline 迷你趋势图
- 刷新按钮、指标变化量计算
- **API**：`GET/POST /api/tracking/configs`、`GET /api/tracking/[bookmarkId]/snapshots`

### 2.7 📊 仪表板 (Dashboard)
- **饼图**：阅读状态分布（Recharts PieChart）
- **柱状图**：内容类型分布（Recharts BarChart）
- **词云**：标签使用频率（纯 CSS 实现）
- **智能推荐**：继续深入 / 拓展视野 / 重温旧宝
- **API**：`GET /api/stats`、`GET /api/recommendations/dashboard`

### 2.8 🕐 时间线 (Timeline)
- 按年月分组展示书签，可视化收藏时间分布
- 交错入场动画
- **API**：`GET /api/stats/timeline`

### 2.9 📅 周报 (Weekly)
- 本周 vs 上周书签收藏数据对比
- 状态分布、Top 标签、增长趋势
- 词云可视化
- **API**：`GET /api/stats/weekly`

### 2.10 🧬 知识图谱 (Graph)
- `react-force-graph-2d` 力导向图展示书签-标签-分类关联网络
- 节点搜索与高亮、节点筛选（下拉选择）
- Canvas 截图导出为 PNG
- 暂停/恢复力学模拟
- 时间轴滑块动画播放
- 暗色/亮色主题 Canvas 适配

---

## 三、侧边栏

### 3.1 分类筛选
- 系统分类列表（AI 自动生成的层级分类），点击筛选

### 3.2 状态筛选
- 全部 / 待读 / 在读 / 已读 / 归档（颜色区分图标）

### 3.3 收藏夹管理
- 展示所有收藏夹（含书签计数）
- 内联创建新收藏夹
- 点击筛选收藏夹内书签
- **API**：`GET/POST /api/collections`、`GET/PATCH/DELETE /api/collections/[id]`

### 3.4 丝滑滚动
- Balatro 风格动量滚动（`useMotionValue` + `useSpring`）

### 3.5 拖拽排序
- `@dnd-kit` 拖拽重排分类列表
- **API**：`POST /api/categories/reorder`

### 3.6 移动端适配
- 桌面端固定侧边栏 / 移动端抽屉式侧边栏（backdrop 模糊遮罩）

---

## 四、书签详情面板

### 4.1 动画效果
- 点击卡片 → 记录 `getBoundingClientRect` → 从卡片位置动画展开面板

### 4.2 详情展示
- 标题、URL、站点名、favicon、封面图
- AI 摘要、标签列表、分类路径
- 元数据信息（GitHub Star 数、视频时长等）
- 创建时间、阅读时间

### 4.3 操作
- 切换阅读状态、打开原链接、分享、删除

### 4.4 相关推荐
- 基于标签 Jaccard 相似度 + 语义嵌入余弦相似度推荐关联书签
- 水平滚动卡片列表，展示相似度百分比
- 无限探索（点击相关书签继续浏览）
- **API**：`GET /api/bookmarks/[id]/related`、`POST /api/bookmarks/[id]/embed`

---

## 五、语音搜索

- Web Speech API（`SpeechRecognition`），中文语言（`zh-CN`）
- 实时语音识别结果展示
- 错误处理：not-allowed / no-speech / aborted
- 录音指示器（脉冲动画）
- 完成后自动填入搜索框并执行搜索

---

## 六、浏览器扩展

### 6.1 背景服务 (Background Service Worker)
- **右键菜单**：收藏当前页面 / 收藏链接
- **快捷键**：`Ctrl+Shift+S` 静默收藏（无弹窗）
- **Badge**：成功 ✓（绿色）/ 失败 ✗（红色）

### 6.2 弹窗 (Popup)
- 完整收藏流程：获取标签页 → 提取元数据 → 去重检测 → AI 分类 → 预览确认 → 保存
- 已收藏检测：展示已有书签信息
- 错误回退：受限页面可手动输入标题保存

### 6.3 侧边栏 (Side Panel)
- 当前页面收藏状态显示
- 书签列表浏览（最近 20 条）
- 搜索书签（300ms 防抖）
- 快速切换阅读状态

---

## 七、认证与安全

### 7.1 登录
- GitHub OAuth 登录（NextAuth v5）
- `prompt: "consent"` 强制授权页面 → 支持账号切换

### 7.2 双重认证中间件
- 优先 Session 认证（同源 Web 应用）
- 回退 API Key 认证（SHA-256 哈希比对）
- 自动更新 `lastUsedAt` 时间（异步，不阻塞请求）

### 7.3 API Key 管理
- 生成 API Key（`mb_` 前缀，96 字符随机密钥）
- 仅生成时完整显示一次
- 显示/隐藏切换、一键复制
- 吊销（删除）Key
- 已有 Key 列表（名称、创建时间、上次使用时间）
- **API**：`GET/POST /api/settings/api-keys`、`DELETE /api/settings/api-keys/[id]`

### 7.4 CORS 中间件
- 允许来源：localhost、chrome-extension://、moz-extension://、`NEXT_PUBLIC_APP_URL`
- OPTIONS 预检响应（Access-Control-Allow-Methods/Headers/Credentials）

---

## 八、设置页面

### 8.1 账户信息
- 用户头像、名称、邮箱
- 切换账号 / 退出登录

### 8.2 外观
- 主题切换：浅色 / 深色 / 跟随系统

### 8.3 数据管理
- 书签统计卡片（总计、待读、在读、已读、归档）
- 收藏夹/标签数量
- 导出书签为 JSON（含 URL、标题、描述、标签、状态、分类、AI 摘要、创建时间）

### 8.4 API Key 管理
- （详见 7.3 节）

---

## 九、分享功能

- 生成唯一 `shareToken`（UUID）
- 链接格式：`/share/bookmark/{shareToken}`
- 重复分享复用已有 token
- 一键复制分享链接
- 公开分享页面（无需登录）
- **API**：`POST /api/bookmarks/[id]/share`

---

## 十、主题系统

- 基于 `next-themes` 的 CSS 变量主题系统
- 三种模式：浅色 / 深色 / 跟随系统
- 变量覆盖：`--background`、`--foreground`、`--card`、`--accent`、`--muted`、`--border`、`--input` 等
- 知识图谱 Canvas 渲染也适配暗色/亮色主题

---

## 十一、数据模型 (14 个)

| 模型 | 用途 |
|------|------|
| `User` | 用户账户（关联所有用户数据） |
| `Account` | NextAuth 账号关联 |
| `Session` | NextAuth 会话 |
| `VerificationToken` | NextAuth 邮箱验证 |
| `Bookmark` | 核心书签（URL、标题、描述、封面、favicon、AI 摘要、embedding、状态、排序、分享 token） |
| `Tag` | 标签（用户作用域） |
| `BookmarkTag` | 书签-标签多对多关联 |
| `Category` | 分类（树形结构，slug 唯一） |
| `Collection` | 收藏夹（含 `isPublic`） |
| `CollectionBookmark` | 收藏夹-书签多对多关联 |
| `HotnessTracker` | 热度追踪配置 |
| `HotnessSnapshot` | 热度快照（stars/forks/openIssues/views/likes） |
| `ApiKey` | API 密钥（SHA-256 哈希存储） |
| `LearningPath` | 学习路径 |
| `LearningPathItem` | 学习路径项（阶段、难度、预估时间、可选、完成状态） |
| `PathNote` | 学习笔记（takeaway/note） |

---

## 十二、API 端点总览 (34 个)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 认证 |
| `/api/bookmarks` | GET/POST | 列表/创建书签 |
| `/api/bookmarks/[id]` | GET/PATCH/DELETE | 单个书签 CRUD |
| `/api/bookmarks/[id]/share` | POST | 生成分享链接 |
| `/api/bookmarks/[id]/related` | GET | 相关书签推荐 |
| `/api/bookmarks/[id]/embed` | POST | 生成语义嵌入 |
| `/api/bookmarks/reorder` | POST | 拖拽排序 |
| `/api/search` | GET | 全局搜索 |
| `/api/metadata` | POST | 提取 URL 元数据 |
| `/api/ai/categorize` | POST | AI 分类标签摘要 |
| `/api/categories` | GET/POST | 分类列表/创建 |
| `/api/categories/reorder` | POST | 分类排序 |
| `/api/tags` | GET | 标签列表 |
| `/api/collections` | GET/POST | 收藏夹列表/创建 |
| `/api/collections/[id]` | GET/PATCH/DELETE | 收藏夹 CRUD |
| `/api/collections/[id]/bookmarks` | POST | 添加书签到收藏夹 |
| `/api/stats` | GET | 统计概览 |
| `/api/stats/timeline` | GET | 时间线数据 |
| `/api/stats/weekly` | GET | 周报数据 |
| `/api/recommendations/discover` | GET | 发现推荐 |
| `/api/recommendations/dashboard` | GET | 仪表板推荐 |
| `/api/comparisons` | POST | AI 对比分析 |
| `/api/learning-paths` | GET/POST | 学习路径列表/创建 |
| `/api/learning-paths/[id]` | GET/PATCH/DELETE | 学习路径 CRUD |
| `/api/learning-paths/[id]/items` | POST | 添加步骤 |
| `/api/learning-paths/[id]/items/[itemId]` | PATCH/DELETE | 步骤 CRUD |
| `/api/learning-paths/[id]/items/reorder` | POST | 步骤排序 |
| `/api/learning-paths/[id]/analyze` | POST | AI 分析 |
| `/api/learning-paths/[id]/export` | GET | 导出 |
| `/api/learning-paths/[id]/items/[itemId]/notes` | GET/POST | 笔记 |
| `/api/learning-paths/[id]/items/[itemId]/notes/[noteId]` | PATCH/DELETE | 笔记 CRUD |
| `/api/tracking/configs` | GET/POST | 追踪配置 |
| `/api/tracking/[bookmarkId]/snapshots` | GET | 热度快照 |
| `/api/settings/api-keys` | GET/POST | API Key 管理 |
| `/api/settings/api-keys/[id]` | DELETE | 吊销 API Key |

---

## 十三、组件清单

| 组件 | 功能 |
|------|------|
| `AddBookmarkDialog` | 添加/编辑书签对话框 |
| `BookmarkCard` | 书签卡片（封面、状态颜色、右键菜单） |
| `BookmarkDetailSheet` | 书签详情面板（动画弹出） |
| `RelatedBookmarks` | 相关书签推荐列表 |
| `SortableBookmarkGrid` | 可拖拽排序的书签网格 |
| `MasonryGallery` | 瀑布流画廊视图 |
| `DiscoverView` | 发现视图（三种模式） |
| `CompareView` | 书签对比视图 |
| `CompareRadar` | 雷达图对比可视化 |
| `CompareMatrix` | 对比矩阵表格 |
| `DashboardView` | 数据仪表板 |
| `ActivityView` | 热度追踪视图 |
| `TrackingSparkline` | Canvas 迷你趋势图 |
| `TimelineView` | 时间线展示 |
| `WeeklyReport` | 周报对比 |
| `LearningPathListView` | 学习路径列表 |
| `LearningPathDetailView` | 学习路径详情 |
| `KnowledgeGraphView` | 力导向知识图谱 |
| `GraphToolbar` | 图谱工具栏 |
| `WordCloud` | CSS 标签词云 |
| `VoiceSearch` | 语音搜索 |
| `ViewTabs` | 十大视图切换标签栏 |
| `Sidebar` | 侧边栏（分类/状态/收藏夹） |
| `ThemeProvider` | 主题提供者 |
| `ThemeToggle` | 三态主题切换按钮 |

---

## 十四、技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16.2 (Turbopack, App Router) |
| 语言 | TypeScript |
| 数据库 | SQLite (libsql) + Prisma 7.8 |
| 认证 | NextAuth v5 (GitHub OAuth) |
| UI | shadcn/ui + React 19.2 |
| 动画 | motion (Framer Motion) + CSS transitions |
| 拖拽 | @dnd-kit (core / sortable / utilities) |
| 图表 | Recharts 3.8 |
| 图谱 | react-force-graph-2d |
| AI | DeepSeek V4 Flash (OpenAI SDK) |
| 嵌入 | DeepSeek Embedding API |
| 语音 | Web Speech API |
| 扩展 | WXT framework + Chrome Extension Manifest V3 |

---

> **版本**：v0.2 | **作者**：MarkBox Team | **日期**：2026-06-11
