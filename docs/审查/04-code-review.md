# 代码审查报告 — 2026-06-03

## 审查范围

全部 `src/` 源码文件（无 git 历史，审查整个代码库）。

## 审查方法

7 个角度 × 独立 Agent 扫描 → 1 票验证（recall-bias）→ CONFIRMED / PLAUSIBLE / REFUTED

---

## 🔴 确认的 Bug（按严重程度排序）

### 1. 编辑书签流程完全损坏
**文件:** `src/components/AddBookmarkDialog.tsx`
**行:** 34, 95-99

两个子问题：
- `useState(editBookmark?.url || "")` — useState 只在组件首次挂载时读初始值，`editBookmark` prop 变化后不会重新同步。关闭对话框时 `reset()` 把 url 设为 `""`，导致每次编辑打开时 URL 输入框都是空的。
- `handleSave` 无条件地 POST 创建新书签，从不检查 `editBookmark` 是否存在，没有 PATCH 逻辑。编辑 = 创建重复书签。

**失效场景:** 右键点击书签 → 编辑 → URL 输入框为空 → 手动输入 URL → 保存 → 创建一个重复书签，原书签不变。

### 2. 拖拽排序无效 — order 字段写入但从不读取
**文件:** `src/app/api/bookmarks/route.ts`
**行:** 158

`POST /api/bookmarks/reorder` 正确地把 `order` 列写入数据库，但 `GET /api/bookmarks` 硬编码了 `orderBy: { createdAt: "desc" }`，完全忽略 `order` 字段。页面刷新/筛选变化后排序回到创建时间顺序。

**失效场景:** 用户拖拽书签 C 到第一位 → 乐观更新显示正确 → 切换筛选状态 → 列表刷新 → C 回到原来的位置。

### 3. 搜索竞态条件 — 无 debounce，无 AbortController
**文件:** `src/app/page.tsx`
**行:** 175, 46, 54-58

每次按键触发新的 API 请求，没有 debounce、没有 AbortController、没有 effect cleanup。响应乱序到达时（"rea" 的响应晚于 "react"），旧数据覆盖新数据。

**失效场景:** 输入 "react" → 4 次请求发出 → 第 3 次请求的响应最后到达 → 页面显示 "rea" 的结果，输入框却显示 "react"。

### 4. 详情面板中修改状态后 selectedBookmark 未更新
**文件:** `src/app/page.tsx`
**行:** 60-73

`handleStatusChange` 成功后调用 `fetchBookmarks()` 刷新列表，但 `selectedBookmark` 状态从未更新。详情面板继续高亮旧状态。

**失效场景:** 点击卡片打开详情面板(status: "待读") → 在面板中点"在读" → PATCH 成功 → 面板仍显示"待读"为选中状态，与服务器状态不匹配。

### 5. Tags API 路由缺少错误处理
**文件:** `src/app/api/tags/route.ts`
**行:** 4-11

GET handler 没有任何 try/catch。数据库查询失败时，错误会作为未处理异常传播，返回泛型 HTML 错误页而非结构化 JSON 错误响应。

**失效场景:** 数据库连接丢失 → 请求 tags → 未处理的 Promise rejection → Next.js 返回 HTML 500 页 → 前端 JSON 解析失败。

---

## 🟡 代码质量问题

### 6. STATUS_CONFIG 在 2 个组件中重复定义
**文件:** `src/components/BookmarkCard.tsx` (43-48), `src/components/BookmarkDetailSheet.tsx` (11-16)

完全相同的 `STATUS_CONFIG` 对象（4 个状态键、标签、图标、CSS 类名、圆点颜色）在两个文件中逐字节重复。应提取到 `src/lib/constants.ts`。

### 7. contentTypeLabels 在 2 个组件中重复
**文件:** `src/components/BookmarkDetailSheet.tsx` (22-24), `src/components/AddBookmarkDialog.tsx` (128-135)

### 8. safeURL 和 formatDate 内联定义，未放入 utils
**文件:** `BookmarkDetailSheet.tsx` (18-20), `BookmarkCard.tsx` (19-32)

这些纯函数应放入 `src/lib/utils.ts` 共享。

---

## 📊 总结

| 严重程度 | 数量 | 描述 |
|---------|------|------|
| 🔴 严重 Bug | 5 | 功能直接损坏，用户可见 |
| 🟡 代码质量 | 3 | 维护风险，不一致隐患 |

**关键修复优先级:** Bug 1（编辑）+ Bug 2（排序）影响核心功能，应最先修复。

---

> 审查由 `code-review` skill 驱动：7 角度扫描 + 独立验证
