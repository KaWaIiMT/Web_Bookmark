# 迭代 04 — 浏览器扩展 Phase 1：API Key 认证 + Popup 快速收藏

> 日期: 2026-06-05
> 依赖: [功能开发/01-浏览器扩展](../功能开发/01-浏览器扩展.md)
> 关联: [迭代 02 — MVP 功能](./02-mvp-features-and-data-model.md)

---

## 一、本轮完成了什么

### 1.1 后端 — API Key 认证体系

为了让浏览器扩展能调用 API，新增了 API Key 认证方式，与原有的 Session 认证并存。

| 变更 | 文件 | 说明 |
|---|---|---|
| ApiKey 数据模型 | `prisma/schema.prisma` | `id, name, key(hashed), userId, lastUsedAt, createdAt` |
| 双认证辅助函数 | `src/lib/auth-helpers.ts` | `getUserIdFromRequest()` — 先试 Session，fallback 到 API Key；`generateApiKey()` — `mb_` 前缀 + SHA-256 哈希存储；`maskApiKey()` — 显示脱敏 |
| CORS 中间件 | `src/middleware.ts` | 允许 `chrome-extension://` 和 `localhost` 跨域，处理 OPTIONS 预检 |
| API Key 管理端点 | `src/app/api/settings/api-keys/` | `GET /api/settings/api-keys` — 列表；`POST` — 生成新 key（仅返回一次 raw key）；`DELETE /api/settings/api-keys/[id]` — 吊销 |
| **13 个 API 路由**全部切换认证 | `src/app/api/**/route.ts` | 从 `auth()` 改为 `getUserIdFromRequest(req)`，统一支持 Session + API Key 双认证 |

**认证流程：**
```
请求到达 → getUserIdFromRequest(req)
  ├─ 1. auth() 检查 Session Cookie → 有则用
  └─ 2. Authorization: Bearer <key> → SHA-256 匹配 → 更新 lastUsedAt
```

### 1.2 浏览器扩展 — Popup 快速收藏（Phase 1）

基于 WXT 框架，实现了 Popup 快速收藏完整流程：

```
点击工具栏图标
  → 自动获取当前页面 URL
  → 骨架屏加载（~0.5s）
  → Content Script 从 DOM 提取元数据（OG 标签、favicon、内容类型检测）
  → 检查 URL 是否已收藏
  → AI 分类 + 标签 + 摘要
  → 展示预览卡片
  → 用户确认收藏
  → Toast 成功提示 → Popup 自动关闭
```

**已实现的组件：**

| 文件 | 功能 |
|---|---|
| `entrypoints/popup/App.tsx` | Popup 主流程：loading → preview → already_bookmarked → error |
| `entrypoints/content.ts` | Content Script — DOM 元数据提取（响应 `EXTRACT_METADATA` 消息） |
| `entrypoints/background.ts` | Service Worker — 转发 `GET_CURRENT_TAB` 消息 |
| `components/BookmarkPreviewCard.tsx` | 预览卡片：封面图 + 标题（可编辑）+ AI 摘要 + 分类 + 标签（增删）+ 确认按钮 |
| `components/AuthGuard.tsx` | 认证守卫：输入 API Key / URL → 验证 → 放行 |
| `components/AlreadyBookmarkedView.tsx` | 已收藏提示：✅ + 收藏时间 + 状态 + "打开详情"链接 |
| `components/ErrorFallbackView.tsx` | 降级 UI：URL + 手动输入标题 + "仅保存链接" |
| `components/SkeletonLoader.tsx` | 骨架屏加载动画 |
| `components/TagBadge.tsx` | 标签徽章（可删除） |
| `components/StatusBadge.tsx` | 书签状态标识 |
| `components/Toast.tsx` | Toast 通知 |
| `lib/api.ts` | API 客户端：checkDuplicate / categorize / createBookmark / validateKey |
| `lib/metadata.ts` | DOM 元数据提取逻辑（OG/Twitter meta、favicon、6 种内容类型检测） |
| `lib/storage.ts` | chrome.storage.local 持久化 API Key 和 URL |
| `lib/types.ts` | TypeScript 类型定义 |

---

## 二、端到端测试结果

```
✅ 未认证请求 → 401 Unauthorized
✅ 错误 API Key → 401 Unauthorized
✅ CORS 预检（chrome-extension://） → 204 + 正确 headers
✅ GET /api/bookmarks → 返回分页数据
✅ POST /api/bookmarks → 创建书签 + 元数据提取 + AI 分类 + 自动标签
✅ GET /api/stats → 完整统计对象
✅ GET /api/stats/timeline → 时间线分组
✅ GET /api/stats/weekly → 周报对比
✅ GET /api/tags → 标签列表
✅ GET /api/search → 搜索结果
✅ GET /api/collections → 收藏集列表
✅ POST /api/metadata → 页面元数据提取
✅ PATCH /api/bookmarks/reorder → 拖拽排序
✅ 扩展收藏流程 → 全部跑通，确认收藏成功
```

---

## 三、进度对照表

按照 [浏览器扩展功能文档](../功能开发/01-浏览器扩展.md) 六个开发阶段：

| 阶段 | 完成度 | 说明 |
|---|---|---|
| **阶段 1**：基础框架 + Popup 收藏 | 🟢 **95%** | Popup 流程完整，缺 Session Cookie 自动认证（当前仅 API Key） |
| **阶段 2**：Side Panel 基础 | 🔴 **0%** | `sidepanel/` 目录未创建，最近列表/搜索/状态切换均未实现 |
| **阶段 3**：智能上下文 | 🔴 **0%** | 关联推荐/知识缺口/阅读路径/重复检测 均未开始 |
| **阶段 4**：批量收藏 + 降级 | 🟡 **25%** | 仅 `ErrorFallbackView` 降级 UI 完成，批量列表检测/收藏 UI/离线队列 未实现 |
| **阶段 5**：打磨 | 🟡 **30%** | 扩展可打包加载，`Ctrl+Shift+D` 已声明但只是打开 Popup 非静默收藏，动画/右键菜单未实现 |

### 与文档规划的差异

| 维度 | 文档预期 | 当前实际 | 差距 |
|---|---|---|---|
| 认证方式 | A（Session Cookie 优先）+ B（API Key 备用）自动切换 | 仅 B（API Key），无自动切换 | 需补 Session Cookie 检测 + 自动 fallback 逻辑 |
| 分类选择器 | `CategorySelector.tsx` | 未实现，只展示 AI 返回的分类文本 | 需补组件 |
| 批量收藏建议 | `BatchCollectPanel.tsx` | 未实现 | 阶段 4 内容 |
| 快捷键 | `Ctrl+Shift+D` 静默收藏 | `Ctrl+Shift+D` 只打开 Popup | 需补静默收藏逻辑 |

---

## 四、下一步计划

按优先级排序：

### P0 — 必须做的（通体验流程）

1. **设置页面 UI** — `src/app/settings/` 页面没有渲染，用户无法在网页中管理 API Key，只能从数据库创建
2. **认证方案自动检测** — `AuthGuard` 应该先尝试 Session Cookie（`credentials: "include"`），失败后再让用户输入 API Key

### P1 — 阶段 2 启动

3. **Side Panel 基础** — 创建 `sidepanel/` 入口，实现最近收藏列表 + 搜索 + 当前页面状态
4. **CategorySelector 组件** — 补齐 Popup 内切换分类的能力

### P2 — 打磨

5. **静默收藏** — `Ctrl+Shift+D` 不弹 Popup，直接在后台保存，右上角 Toast 提示
6. **`/api/bookmarks?url=` 查询** — 确保 GET bookmarks 支持 URL 参数查重（已实现 `url` 参数过滤，需确认扩展 `checkDuplicate` 用对了）

### P3 — 智能上下文

7. **关联书签推荐** — 基于标签相似度的关联推荐算法
8. **重复内容检测** — 收藏前检测语义相似内容

---

## 五、构建 & 加载备忘

```bash
# 构建扩展
cd /f/Claude/bookmark/markbox-extension
npx wxt build

# Chrome 加载
# chrome://extensions/ → 开发者模式 → 加载已解压的扩展程序
# 选择目录: F:\Claude\bookmark\markbox-extension\.output\chrome-mv3
```

API Key（开发测试用）：
```
mb_0c4f24cff134aff2de86d03a5fe848fd96352a799798d4f0e165e40c47c600ec61db531492adb58adf8f98d85abeca40
```

