interface Props { step: number }
const PAIN_POINTS = [
  "收藏了几百篇，要找那一篇？",
  "文件夹套娃，连自己都忘了放在哪。",
  "换个设备？全靠手动导入导出。",
  "几万个标签页，再也没打开过。",
] as const;

export default function Coldopen({ step }: Props) {
  return (
    <div className="co-stage">
      {step === 0 && (
        <div className="co-scene co-chaos">
          <div className="co-browser-frame">
            <div className="co-browser-dots">
              <span className="co-dot co-dot--red" /><span className="co-dot co-dot--yellow" /><span className="co-dot co-dot--green" />
            </div>
            <div className="co-tab-strip">
              {Array.from({ length: 14 }).map((_, i) => <div key={i} className="co-tab" style={{ width: `${60 + (i * 23) % 90}px` }} />)}
            </div>
            <div className="co-url-bar" />
            <div className="co-bookmark-bar">
              {Array.from({ length: 26 }).map((_, i) => <div key={i} className="co-bm-pill" style={{ width: `${26 + Math.sin(i * 1.9) * 14 + (i % 7) * 10}px`, opacity: 0.4 + (i % 5) * 0.12 }} />)}
            </div>
            <div className="co-folder-tree">
              <div className="co-fld co-fld--0">书签栏</div>
              <div className="co-fld co-fld--1">学习资料</div>
              <div className="co-fld co-fld--2">前端</div>
              <div className="co-fld co-fld--3">React</div>
              <div className="co-fld co-fld--4">状态管理</div>
              <div className="co-fld co-fld--5"><span className="co-fld-unknown">···</span></div>
            </div>
          </div>
          <p className="co-chaos-label">翻了五分钟，还没找到。</p>
        </div>
      )}
      {step >= 1 && step <= 4 && (
        <div className={`co-scene co-bang co-bang--${step}`}>
          <div className="co-bang-bg" />
          <p className="co-bang-text">{PAIN_POINTS[step - 1]}</p>
          <span className="co-bang-counter">{step} / 4</span>
        </div>
      )}
      {step === 5 && (
        <div className="co-scene co-reveal">
          <p className="co-reveal-tag">于是，我做了这个东西</p>
          <h1 className="co-reveal-brand">MarkBox</h1>
          <p className="co-reveal-sub">一个把书签管理做到头的&nbsp;All-in-One&nbsp;系统</p>
          <div className="co-reveal-rule" />
        </div>
      )}
    </div>
  );
}
