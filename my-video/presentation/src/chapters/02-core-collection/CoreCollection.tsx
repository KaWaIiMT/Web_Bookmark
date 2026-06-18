import { ChapterVideo } from "../../components/ChapterVideo";

interface Props { step: number }

/** Check if a video file exists (we rely on onError fallback in ChapterVideo). */
const VID = (name: string) => `/videos/${name}`;

export default function CoreCollection({ step }: Props) {
  return (
    <div className="cc-stage">
      {step === 0 && (
        <div className="cc-scene cc-scene--with-video">
          <div className="cc-app-shell">
            <div className="cc-sidebar">
              <div className="cc-sb-item cc-sb-item--active">全部书签</div>
              <div className="cc-sb-item">未读</div><div className="cc-sb-item">在读</div><div className="cc-sb-item">已归档</div>
              <div className="cc-sb-divider" />
              <div className="cc-sb-cat">前端</div><div className="cc-sb-cat">后端</div><div className="cc-sb-cat">DevOps</div>
            </div>
            <div className="cc-main">
              <div className="cc-topbar"><div className="cc-searchbar" /><div className="cc-add-btn" /></div>
              <div className="cc-empty-state"><div className="cc-empty-icon" /><p className="cc-empty-text">还没有书签</p><p className="cc-empty-hint">点击右上角添加你的第一个书签</p></div>
            </div>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="cc-scene cc-scene--with-video">
          <div className="cc-app-shell"><div className="cc-sidebar" /><div className="cc-main"><div className="cc-topbar"><div className="cc-searchbar" /><div className="cc-add-btn cc-add-btn--active" /></div><div className="cc-form-card"><div className="cc-form-url">https://juejin.cn/post/7...</div><div className="cc-form-row"><div className="cc-form-field" /><div className="cc-form-field cc-form-field--short" /></div><div className="cc-form-save" /></div></div></div>
        </div>
      )}
      {step === 2 && (
        <div className="cc-scene">
          <div className="cc-ai-card"><div className="cc-ai-header"><div className="cc-ai-spark" /><span className="cc-ai-label">AI 分析中</span></div><div className="cc-ai-tags"><span className="cc-tag">React</span><span className="cc-tag">状态管理</span><span className="cc-tag">前端架构</span></div><div className="cc-ai-category">前端 / React 生态</div><div className="cc-ai-summary">本文深入对比了 React 主流状态管理方案在生产环境下的表现，包括性能基准测试与迁移成本分析。</div></div>
          <ChapterVideo src={VID("02-01-add-bookmark.mp4")} caption="↗ 实机演示：添加书签 + AI 自动分类" width={1520} height={680} />
        </div>
      )}
      {step === 3 && (
        <div className="cc-scene">
          <div className="cc-card-grid">
            <div className="cc-card cc-card--video"><div className="cc-card-cover cc-card-cover--video" /><div className="cc-card-body"><div className="cc-card-tag-row"><span className="cc-tag">前端</span></div><div className="cc-card-title">2024 React 状态管理方案对比</div><div className="cc-card-meta">Bilibili · 45:22</div></div></div>
            <div className="cc-card cc-card--article"><div className="cc-card-cover cc-card-cover--article" /><div className="cc-card-body"><div className="cc-card-tag-row"><span className="cc-tag">架构</span></div><div className="cc-card-title">微前端落地的 10 个坑</div><div className="cc-card-meta">掘金 · 15 min read</div></div></div>
            <div className="cc-card cc-card--repo"><div className="cc-card-body"><div className="cc-card-tag-row"><span className="cc-tag">工具</span></div><div className="cc-card-title">tanstack/react-query</div><div className="cc-card-meta"><span className="cc-lang-dot cc-lang-dot--ts" />TypeScript · ★ 42k</div></div></div>
            <div className="cc-card cc-card--webpage"><div className="cc-card-body"><div className="cc-card-tag-row"><span className="cc-tag">参考</span></div><div className="cc-card-title">ES2024 新特性一览</div><div className="cc-card-meta">tc39.es</div></div></div>
          </div>
          <ChapterVideo src={VID("02-02-cards.mp4")} caption="↗ 实机演示：四种卡片布局" width={1520} height={680} />
        </div>
      )}
      {step === 4 && (
        <div className="cc-scene">
          <div className="cc-meta-card"><div className="cc-meta-title">提取到的元数据</div><div className="cc-meta-grid"><div className="cc-meta-item"><label>来源</label><span>Bilibili</span></div><div className="cc-meta-item"><label>作者</label><span>代码与咖啡</span></div><div className="cc-meta-item"><label>发布日期</label><span>2026-03-15</span></div><div className="cc-meta-item"><label>播放量</label><span>12.8 万</span></div><div className="cc-meta-item"><label>时长</label><span>45:22</span></div><div className="cc-meta-item"><label>标签</label><span>React · 状态管理</span></div></div><div className="cc-meta-badge">平台规则自动识别</div></div>
          <ChapterVideo src={VID("02-04-metadata.mp4")} caption="↗ 实机演示：元数据提取" width={1520} height={680} />
        </div>
      )}
      {step === 5 && (
        <div className="cc-scene cc-scene--with-video">
          <div className="cc-app-shell"><div className="cc-sidebar" /><div className="cc-main cc-main--with-detail"><div className="cc-card-grid cc-card-grid--muted"><div className="cc-card cc-card--article cc-card--dim" /><div className="cc-card cc-card--video cc-card--dim" /></div><div className="cc-detail-sheet"><div className="cc-detail-cover" /><div className="cc-detail-title">2024 React 状态管理方案深度对比</div><div className="cc-detail-tags"><span className="cc-tag">React</span><span className="cc-tag">状态管理</span></div><div className="cc-detail-desc">本文深入对比了 React 主流状态管理方案在生产环境下的表现。</div><div className="cc-detail-status"><span className="cc-status-badge cc-status--unread">未读</span><span className="cc-status-next">→ 点击切换</span></div></div></div></div>
          <ChapterVideo src={VID("02-03-detail.mp4")} caption="↗ 实机演示：书签详情面板" width={1520} height={680} />
        </div>
      )}
      {step === 6 && (
        <div className="cc-scene">
          <div className="cc-status-flow"><div className="cc-status-node cc-status-node--active"><div className="cc-status-dot cc-status-dot--unread" /><span>未读</span></div><div className="cc-status-arrow">→</div><div className="cc-status-node"><div className="cc-status-dot cc-status-dot--reading" /><span>在读</span></div><div className="cc-status-arrow">→</div><div className="cc-status-node"><div className="cc-status-dot cc-status-dot--read" /><span>已读</span></div><div className="cc-status-arrow">→</div><div className="cc-status-node"><div className="cc-status-dot cc-status-dot--archived" /><span>归档</span></div></div>
          <ChapterVideo src={VID("02-05-status-toggle.mp4")} caption="↗ 实机演示：阅读状态切换" width={1520} height={680} />
        </div>
      )}
      {step === 7 && (
        <div className="cc-scene">
          <div className="cc-status-grid"><div className="cc-sg-card"><div className="cc-sg-cover" /><div className="cc-sg-title">React 状态管理</div><span className="cc-sg-badge cc-sg-badge--unread">未读</span></div><div className="cc-sg-card"><div className="cc-sg-cover" /><div className="cc-sg-title">微前端实践</div><span className="cc-sg-badge cc-sg-badge--reading">在读</span></div><div className="cc-sg-card"><div className="cc-sg-cover" /><div className="cc-sg-title">Node.js 性能优化</div><span className="cc-sg-badge cc-sg-badge--read">已读</span></div><div className="cc-sg-card cc-sg-card--dimmed"><div className="cc-sg-cover" /><div className="cc-sg-title">Webpack 5 入门</div><span className="cc-sg-badge cc-sg-badge--archived">归档</span></div></div>
          <ChapterVideo src={VID("02-06-status-grid.mp4")} caption="↗ 实机演示：状态视觉区分" width={1520} height={680} />
        </div>
      )}
      {step === 8 && (
        <div className="cc-scene">
          <div className="cc-app-shell"><div className="cc-sidebar"><div className="cc-sb-item cc-sb-item--active">全部书签</div><div className="cc-sb-item">未读 <span className="cc-sb-count">12</span></div><div className="cc-sb-item">在读 <span className="cc-sb-count">5</span></div><div className="cc-sb-item">已归档 <span className="cc-sb-count">34</span></div></div><div className="cc-main"><div className="cc-filter-bar"><div className="cc-filter-chip cc-filter-chip--active">全部</div><div className="cc-filter-chip">未读</div><div className="cc-filter-chip">在读</div><div className="cc-filter-chip">已读</div></div><div className="cc-card-grid cc-card-grid--compact"><div className="cc-card cc-card--article" /><div className="cc-card cc-card--video" /><div className="cc-card cc-card--repo" /></div></div></div>
          <ChapterVideo src={VID("02-07-filter.mp4")} caption="↗ 实机演示：状态筛选联动" width={1520} height={680} />
        </div>
      )}
      {step === 9 && (
        <div className="cc-scene cc-scene--recap"><div className="cc-recap-grid"><div className="cc-recap-item"><div className="cc-recap-icon cc-recap-icon--ai" /><span>AI 自动分类</span></div><div className="cc-recap-item"><div className="cc-recap-icon cc-recap-icon--cards" /><span>自适应卡片</span></div><div className="cc-recap-item"><div className="cc-recap-icon cc-recap-icon--meta" /><span>元数据提取</span></div><div className="cc-recap-item"><div className="cc-recap-icon cc-recap-icon--status" /><span>阅读生命周期</span></div></div><p className="cc-recap-label">核心收藏流 · 回顾</p></div>
      )}
    </div>
  );
}
