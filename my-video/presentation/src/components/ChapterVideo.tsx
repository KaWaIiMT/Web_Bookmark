/**
 * Reusable video embed wrapper for chapter steps.
 */
interface Props {
  src: string;
  caption?: string;
  width?: number;
  height?: number;
}

export function ChapterVideo({ src, caption, width = 960, height = 540 }: Props) {
  const fullSrc = `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`;

  return (
    <div className="cv-wrapper" style={{ width, height }}>
      <video
        className="cv-video"
        src={fullSrc}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = 'none';
          const placeholder = el.nextElementSibling as HTMLElement | null;
          if (placeholder) placeholder.style.display = 'flex';
        }}
      />
      <div className="cv-placeholder" style={{ display: 'none' }}>
        <div className="cv-placeholder-icon" />
        <span className="cv-placeholder-text">视频素材待放入</span>
        <span className="cv-placeholder-path">{src}</span>
      </div>
      {caption && <p className="cv-caption">{caption}</p>}
    </div>
  );
}
