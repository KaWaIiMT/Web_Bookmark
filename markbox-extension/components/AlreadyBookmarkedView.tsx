import { ExternalLink } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { resolveImageUrl } from "@/lib/utils";
import type { BookmarkData } from "@/lib/types";

interface AlreadyBookmarkedViewProps {
  bookmark: BookmarkData;
  baseUrl: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 30) return `${Math.floor(days / 30)} 个月前`;
  if (days > 0) return `${days} 天前`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours} 小时前`;
  return "刚刚";
}

export function AlreadyBookmarkedView({
  bookmark,
  baseUrl,
}: AlreadyBookmarkedViewProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Banner */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/40 dark:border-amber-500/20">
        <span className="text-lg">✅</span>
        <div>
          <p className="text-[13px] font-medium text-amber-800 dark:text-amber-400 font-sans">
            已收藏
          </p>
          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60 font-sans">
            {formatDate(bookmark.createdAt)} ·{" "}
            <StatusBadge status={bookmark.status} />
          </p>
        </div>
      </div>

      {/* Cover */}
      {bookmark.coverImage && (
        <div className="aspect-[2.2/1] rounded-xl bg-[var(--muted)] overflow-hidden">
          <img
            src={
              resolveImageUrl(bookmark.coverImage, bookmark.url) ?? undefined
            }
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold text-[14px] text-[var(--foreground)]/85 font-sans">
        {bookmark.title}
      </h3>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={`${baseUrl}/share/bookmark/${bookmark.shareToken || bookmark.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border)] text-[13px] text-[var(--foreground)]/60 font-sans hover:bg-[var(--muted)] transition-colors cursor-pointer no-underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          打开详情
        </a>
      </div>
    </div>
  );
}
