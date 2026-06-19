import { ChapterVideo } from "../../components/ChapterVideo";

interface Props { step: number }
const VID = (name: string) => `/videos/${name}`;

export default function OrganizeSearch({ step }: Props) {
  return (
    <div className="os-stage">
      {step === 0 && (
        <div className="os-scene os-scene--with-video">
          <div className="os-app-shell">
            <div className="os-sidebar">
              <div className="os-sb-header">分类</div>
              <div className="os-cat"><span className="os-cat-dot" />前端</div>
              <div className="os-cat os-cat--child"><span className="os-cat-dot os-cat-dot--sub" />React</div>
              <div className="os-cat os-cat--child"><span className="os-cat-dot os-cat-dot--sub" />Vue</div>
              <div className="os-cat"><span className="os-cat-dot" />后端</div>
              <div className="os-cat os-cat--child"><span className="os-cat-dot os-cat-dot--sub" />Node.js</div>
              <div className="os-sb-divider" />
              <div className="os-sb-header">标签</div>
              <div className="os-tag-list">
                <span className="os-tag os-tag--blue">React</span>
                <span className="os-tag os-tag--green">TypeScript</span>
                <span className="os-tag os-tag--orange">性能优化</span>
                <span className="os-tag os-tag--purple">架构</span>
                <span className="os-tag os-tag--red">部署</span>
              </div>
            </div>
            <div className="os-main">
              <div className="os-topbar"><div className="os-searchbar" /></div>
              <div className="os-grid">
                {[1,2,3,4].map(i => (
                  <div key={i} className="os-card">
                    <div className="os-card-cover" />
                    <div className="os-card-body">
                      <div className="os-card-line" />
                      <div className="os-card-line os-card-line--short" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ChapterVideo src={VID("03-01-category-tags.mp4")} width={1520} height={680} />
        </div>
      )}

      {step === 1 && (
        <div className="os-scene os-scene--dnd">
          <div className="os-dnd-zone">
            <div className="os-dnd-card os-dnd-card--dragging"><div className="os-dnd-grip" /><span>React 状态管理</span></div>
            <div className="os-dnd-card os-dnd-card--target"><div className="os-dnd-grip" /><span>微前端实践</span><div className="os-dnd-drop-zone" /></div>
            <div className="os-dnd-card"><div className="os-dnd-grip" /><span>Node.js 优化</span></div>
            <div className="os-dnd-card"><div className="os-dnd-grip" /><span>TypeScript 技巧</span></div>
          </div>
          <ChapterVideo src={VID("03-02-drag.mp4")} width={1520} height={680} />
        </div>
      )}

      {step === 2 && (
        <div className="os-scene os-scene--with-video">
          <div className="os-search-demo">
            <div className="os-search-input-row">
              <div className="os-search-input">Docker 部署</div>
              <div className="os-search-icon" />
            </div>
            <div className="os-search-results">
              <div className="os-sr-item">
                <div className="os-sr-title"><span className="os-sr-hl">Docker</span> Compose 在生产环境的<span className="os-sr-hl">部署</span>实践</div>
                <div className="os-sr-meta">标签：DevOps · 容器 · 分类：后端</div>
              </div>
              <div className="os-sr-item">
                <div className="os-sr-title">前端项目的 <span className="os-sr-hl">Docker</span> 化<span className="os-sr-hl">部署</span>方案</div>
                <div className="os-sr-meta">标签：前端工程化 · 分类：前端</div>
              </div>
            </div>
          </div>
          <ChapterVideo src={VID("03-03-search.mp4")} width={1520} height={680} />
        </div>
      )}

      {step === 3 && (
        <div className="os-scene os-scene--voice">
          <div className="os-voice-visual">
            <div className="os-voice-mic" />
            <div className="os-voice-wave"><span /><span /><span /><span /><span /></div>
            <p className="os-voice-text">"Docker 部署"</p>
          </div>
          <p className="os-voice-label">懒得打字？语音搜索也给你做进去了</p>
        </div>
      )}

      {step === 4 && (
        <div className="os-scene os-scene--with-video">
          <div className="os-collection-demo">
            <div className="os-col-cards">
              {[1,2,3].map(i => (
                <div key={i} className="os-col-card">
                  <div className="os-col-check" /><div className="os-col-card-cover" />
                  <div className="os-col-card-title">书签标题 {i}</div>
                </div>
              ))}
            </div>
            <div className="os-col-arrow">→</div>
            <div className="os-col-folder"><div className="os-col-folder-icon" /><span>Kubernetes 入门</span></div>
            <div className="os-share-dialog"><div className="os-share-url">markbox.app/share/abc123</div><div className="os-share-copy" /></div>
          </div>
          <ChapterVideo src={VID("03-04-collection-share.mp4")} width={1520} height={680} />
        </div>
      )}

      {step === 5 && (
        <div className="os-scene os-scene--with-video">
          <div className="os-view-roulette">
            <div className="os-view-name os-view-name--anim">Grid 网格</div>
            <div className="os-view-preview" />
          </div>
          <ChapterVideo src={VID("03-05-view-switch.mp4")} width={1520} height={680} />
        </div>
      )}
    </div>
  );
}
