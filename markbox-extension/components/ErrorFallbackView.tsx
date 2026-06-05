import { useState } from "react";
import { LinkIcon, AlertTriangle } from "lucide-react";

interface ErrorFallbackViewProps {
  url: string;
  defaultTitle?: string;
  onSaveLinkOnly: (url: string, title: string) => void;
  saving?: boolean;
}

export function ErrorFallbackView({
  url,
  defaultTitle = "",
  onSaveLinkOnly,
  saving,
}: ErrorFallbackViewProps) {
  const [title, setTitle] = useState(defaultTitle);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-zinc-100/60 dark:bg-zinc-500/10 border border-zinc-200/40 dark:border-zinc-500/20">
        <AlertTriangle className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 font-sans">
            无法自动提取页面信息
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-sans mt-0.5">
            请手动输入标题后保存链接
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* URL display */}
        <div>
          <label className="text-[11px] font-medium text-[var(--muted-foreground)] font-sans">
            URL
          </label>
          <div className="flex items-center gap-1.5 mt-1 px-3 py-2 rounded-xl bg-[var(--muted)] text-[12px] text-[var(--foreground)]/50 font-sans truncate">
            <LinkIcon className="h-3 w-3 shrink-0" />
            {url}
          </div>
        </div>

        {/* Title input */}
        <div>
          <label className="text-[11px] font-medium text-[var(--muted-foreground)] font-sans">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入标题..."
            className="w-full mt-1 px-3 py-2 text-[13px] rounded-xl border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] font-sans outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all"
            onKeyDown={(e) =>
              e.key === "Enter" && onSaveLinkOnly(url, title)
            }
          />
        </div>
      </div>

      <button
        onClick={() => onSaveLinkOnly(url, title)}
        disabled={saving}
        className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] text-[13px] font-medium font-sans transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      >
        {saving ? "保存中..." : "仅保存链接"}
      </button>
    </div>
  );
}
