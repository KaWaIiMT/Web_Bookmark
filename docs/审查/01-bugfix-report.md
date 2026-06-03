# 审查 02 — Bug 修复自检报告

> 日期: 2026-06-02

---

## 修复清单

| # | Bug | 修复内容 | 状态 |
|---|---|---|---|
| 1 | 拖动阻尼太大 | `activationConstraint.distance` 从 5 降到 3 | ✅ |
| 2 | 添加书签弹窗内容溢出 | `max-h-[60vh]` 改为 `max-h-[50vh]`，整体 padding 收紧 | ✅ |
| 3 | 点击空白处关闭弹窗 | `onPointerDownOutside` 拦截 + 改为底部 Toast 通知进度 | ✅ |
| 4 | B站封面不显示 | 封面 URL 以 `//` 开头时自动补 `https:`（已有此逻辑，确认有效） | ✅ |

## 自检结果

- `npm run build` ✅ 通过，0 错误
- `POST /api/metadata` ✅ B站链接返回正确元数据（标题、封面、类型=video）
- `POST /api/bookmarks` ✅ 创建成功，DeepSeek AI 返回标签 + 摘要（650 tokens，Flash 模型）
- `GET /api/bookmarks` ✅ 列表正常返回

## 已知限制

1. B站 `//` 开头的封面 URL 在浏览器中可能仍需处理（部分浏览器不支持 protocol-relative URL）
2. AI 摘要质量依赖 DeepSeek Flash 模型，Pro 模型会更好但成本更高
