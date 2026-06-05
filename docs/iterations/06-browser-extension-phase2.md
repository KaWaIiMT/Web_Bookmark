# 迭代 06 — 浏览器扩展 Phase 2+：Side Panel、认证优化、快捷操作

> 日期: 2026-06-06
> 依赖: [迭代 04 — 浏览器扩展 Phase 1](./04-browser-extension-phase1.md)
> 关联: [功能开发/01-浏览器扩展](../功能开发/01-浏览器扩展.md)

---

## 一、本轮完成了什么

### 1.1 Side Panel 侧边栏

| 文件 | 操作 | 说明 |
|------|------|------|
| `wxt.config.ts` | 修改 | 添加 `sidePanel` 权限 + `side_panel.default_path` |
| `entrypoints/sidepanel/index.html` | 新建 | HTML 入口 |
| `entrypoints/sidepanel/main.tsx` | 新建 | React 挂载点 |
| `entrypoints/sidepanel/App.tsx` | 新建 | 侧边栏主组件（400px 宽） |
| `entrypoints/sidepanel/styles.css` | 新建 | 样式 |
| `components/BookmarkListItem.tsx` | 新建 | 书签列表项（favicon+标题+域名+时间+状态切换） |
| `lib/api.ts` | 修改 | 新增 `listBookmarks` / `searchBookmarks` / `updateBookmark` |

**功能**：最近 20 条书签列表、搜索框（300ms 防抖）、当前页面收藏状态、状态一键切换、打开主站链接。

### 1.2 认证自动检测

| 文件 | 说明 |
|------|------|
| `lib/api.ts` | 新增 `tryCookieAuth()` — `credentials: "include"` 测试 Session Cookie |
| `components/AuthGuard.tsx` | 认证流程：Cookie → API Key → 手动输入 |

之前必须手动输入 API Key，现在主站已登录的用户打开扩展自动通过认证。

### 1.3 设置页 API Key 管理

| 文件 | 说明 |
|------|------|
| `src/app/settings/page.tsx` | 新增 API Keys 区块：生成 Key（仅展示一次）、已有 Keys 列表、吊销 |

### 1.4 快捷操作

| 功能 | 说明 |
|------|------|
| 右键菜单 | 右键页面 →「收藏当前页面到 MarkBox」；右键链接 →「收藏链接到 MarkBox」 |
| `Ctrl+Shift+S` 静默收藏 | 不弹 Popup 直接保存，图标显示 ✓ 提示 |
| 分类选择器 | Popup 预览中可切换 AI 自动检测的分类 |
| 后端 API 支持 | `POST /api/bookmarks` 接受可选 `categoryId`，用户指定时跳过 AI 分类 |

---

## 二、重要 Bug 修复

### 2.1 Popup 标题丢失（React 闭包）
- **问题**：`setTabTitle(pageTitle)` 异步更新，但 `startBookmarkFlow()` 同步调用，读到空的 `tabTitle`
- **修复**：`pageTitle` 直接作为参数传入 `startBookmarkFlow(url, pageTitle)`

### 2.2 静默收藏标题为 URL
- **问题**：`doSilentBookmark(url, tab.url)` 把 URL 当 title 传给后端，覆盖元数据提取
- **修复**：`title` 参数改为可选，只有真实标题才传，链接收藏不传标题

### 2.3 数据库 Session 表丢失
- **问题**：`taskkill //F //IM node.exe` 后 server 以错误 cwd 重启，引用空数据库
- **修复**：从正确目录 (`cd /f/Claude/bookmark`) 启动 server

---

## 三、浏览器扩展完成度

| 阶段 | 状态 |
|------|------|
| 阶段 1：基础框架 + Popup 收藏 | ✅ |
| 阶段 2：Side Panel 基础 | ✅ |
| 阶段 3：智能上下文（C 层） | 🔴 未开始 |
| 阶段 4：批量收藏 + 降级 | 🟡 仅降级 UI |
| 阶段 5：打磨 | 🟡 右键菜单/快捷键/分类选择器已完成 |
| P0 认证自动检测 | ✅ |
| P0 设置页 API Key 管理 | ✅ |

## 四、构建

```bash
# 后端
npx next build        # 0 错误

# 扩展
cd markbox-extension && npx wxt build   # 0 错误
```
