import { StatusBadge } from "./StatusBadge";
import type { BookmarkData } from "@/lib/types";

const NEXT_STATUS: Record<string, string> = {
  unread: "reading",
  reading: "read",
  read: "archived",
  archived: "unread",
};

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

interface BookmarkListItemProps {
  bookmark: BookmarkData;
  onStatusChange: (id: string, status: string) => void;
}

export function BookmarkListItem({
  bookmark,
  onStatusChange,
}: BookmarkListItemProps) {
  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--muted)]/50 transition-colors cursor-pointer no-underline group"
    >
      {/* Favicon */}
      {bookmark.favicon ? (
        <img
          src={bookmark.favicon}
          alt=""
          className="h-5 w-5 rounded mt-0.5 shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="h-5 w-5 rounded bg-[var(--muted)] mt-0.5 shrink-0" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--foreground)]/85 font-sans truncate leading-snug">
          {bookmark.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-[var(--foreground)]/25 font-sans truncate">
            {bookmark.siteName || new URL(bookmark.url).hostname}
          </span>
          <span className="text-[10px] text-[var(--foreground)]/20 font-sans">
            {formatDate(bookmark.createdAt)}
          </span>
        </div>
      </div>

      {/* Status toggle */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onStatusChange(bookmark.id, NEXT_STATUS[bookmark.status]);
        }}
        className="shrink-0 cursor-pointer"
        title="切换状态"
      >
        <StatusBadge status={bookmark.status} />
      </button>
    </a>
  );
}
