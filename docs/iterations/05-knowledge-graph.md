# 迭代 05 — 知识图谱视图

> 日期: 2026-06-06
> 依赖: [功能开发/02-知识图谱视图](../功能开发/02-知识图谱视图.md)
> 关联: [迭代 04 — 浏览器扩展](./04-browser-extension-phase1.md)

---

## 一、本轮完成了什么

### 1.1 阶段 1：基础图渲染

| 功能 | 文件 | 说明 |
|------|------|------|
| ViewType 扩展 | `src/lib/types.ts` | 添加 `"graph"` 到 ViewType；GraphNode/GraphLink 接口 |
| 图数据计算 | `src/lib/graph-data.ts` | `computeGraphData()` — 标签共现矩阵、节点大小、连线强度 |
| 图谱主视图 | `src/components/KnowledgeGraphView.tsx` | ForceGraph2D Canvas 渲染 + 暗色/亮色主题 |
| 工具栏 | `src/components/GraphToolbar.tsx` | 搜索高亮 + 重置 + **节点筛选下拉** + **截图导出 PNG** |
| 视图切换 | `src/components/ViewTabs.tsx` | 添加"图谱"标签（GitGraph 图标） |
| 页面接入 | `src/app/page.tsx` | `activeView === "graph"` 条件渲染 |

### 1.2 阶段 2：三层交互

| 功能 | 说明 |
|------|------|
| Layer 1 → Layer 2 | 点击标签/分类节点 → 展开书签子节点（小圆点，颜色按 contentType） |
| Layer 2 → Layer 1 | 再次点击 / 双击空白 / 重置 → 折叠 |
| Layer 2 → Layer 3 | 点击书签节点 → 复用 `BookmarkDetailSheet` 详情抽屉（状态修改/删除） |
| 防抖动画 | 全量节点一次性加载到 graphData，用 `nodeVisibility` 控制显隐，simulation 不重启 |

### 1.3 阶段 3：时间轴

| 功能 | 说明 |
|------|------|
| 时间滑块 | `<input type="range">`，从最早书签到最新书签 |
| 播放动画 | ▶ 自动推进滑块，书签节点按时间出现，支持 1×/2×/5× 速度 |
| 可见计数 | 实时显示当前时间点可见的书签节点数 |
| 自动停止 | 播放到终点自动暂停 |

### 1.4 阶段 4：视觉打磨

| 功能 | 说明 |
|------|------|
| 径向渐变光晕 | `createRadialGradient()` 替代纯色填充，分类节点 ×2.5 光晕半径，标签 ×2 |
| 背景星场 | 暗色模式下 60 个随机白点 CSS `radial-gradient`，模拟星空 |

---

## 二、技术要点

### 防闪烁架构

核心问题：graphData 变化时 D3 simulation `.alpha(1).restart()` 导致所有节点抖动。

解决方案：
```
fullGraphData = useMemo(() => {
  标签 + 分类 + 最多200个书签节点（全部预加载）
}, [bookmarks])  // 不依赖 expandedNode，展开/折叠不触发重算

<ForceGraph2D graphData={fullGraphData} />  // prop 稳定，simulation 不重启

nodeVisibility = 下拉筛选 + Layer 2 展开 + 时间轴过滤
// 只改变 visibility，graphData 不变 → 零闪烁
```

### Canvas 渲染

- `renderNode()` 处理 3 种节点类型：category（大圆+光晕+计数）、tag（中圆+光晕）、bookmark（小圆点+标题截断）
- `renderLink()` 处理 3 种连线类型：tag-tag、tag-category、bookmark-tag
- `nodePointerAreaPaint` 定义点击热区
- 保护：`node.x/y` 非 finite 时跳过渲染（simulation 初期）

### 交互分离

- 左键拖拽节点 / 空白平移画布
- 滚轮缩放
- 中键平移（已回退，改用默认行为）
- 悬停 tooltip + 点击展开/详情

---

## 三、未做（后续迭代）

| 项目 | 说明 |
|------|------|
| 框选多节点（Shift+拖动） | Canvas 框选逻辑较复杂，P3 |
| 书签节点轨道动画 | "行星绕轨"效果需大量 Canvas 动画，P3 |
| 3D 知识图谱 | `react-force-graph-3d` 升级，P4 |
| 移动端适配 | Canvas 在小屏上交互困难，保留桌面端 |

---

## 四、构建 & 测试

```bash
npm run build       # 0 错误
npx next dev        # http://localhost:3000
```

测试清单：
- [x] 力导向图渲染标签/分类节点
- [x] 搜索高亮 + 重置
- [x] 节点筛选下拉（只显示邻居）
- [x] 截图导出 PNG
- [x] 点击标签展开书签节点（Layer 2）
- [x] 点击书签打开详情抽屉（Layer 3）
- [x] 状态修改/删除后图谱刷新
- [x] 时间轴滑块 + 播放动画
- [x] 暗色/亮色主题跟随
- [x] 径向渐变光晕 + 星空背景
