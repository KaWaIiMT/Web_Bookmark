# 审查 03 — Bug 修复自检报告

> 日期: 2026-06-02

---

## 修复内容

| # | 问题 | 修复 | 状态 |
|---|---|---|---|
| 1 | 拖动不跟手 | 改用 motion (Framer Motion) spring 动画，GPU 加速 transform，拖动时卡片抬起 + 旋转微动 + 阴影，`activationConstraint.distance` 降为 3px | ✅ |
| 2 | 点击展开误解 | 去掉 Sheet 组件，改为 card→detail 溶解扩散动画：卡片位置作为 `initial`，animate 到右侧 420px 全高面板，motion spring 插值，点 X/背景关闭 | ✅ |
| 3 | 添加书签无法滚动 | DialogContent 加 `max-h-[85vh]` + `flex flex-col`，内容区加 `overflow-y-auto flex-1`，header 加 `shrink-0` | ✅ |

## 自检结果

- `npm run build` ✅ 通过，0 错误
- `POST /api/bookmarks` ✅ B站链接创建成功（689 tokens，Flash 模型）
- 服务已启动在 `http://localhost:3000`

## 关键变化

- 引入 `motion` (Framer Motion) 替代纯 CSS transition
- 卡片直接用 `motion.div` 包裹，属性 listeners 直接放外层（整张卡可拖）
- DetailSheet 从 shadcn Sheet 改为自定义 motion 动画面板
- `onCardClick` 签名改为 `(bookmark, element)` 传递卡片坐标
