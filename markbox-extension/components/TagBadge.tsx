import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  color?: string | null;
  onRemove?: () => void;
  size?: "sm" | "md";
}

const TAG_COLORS = [
  "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function TagBadge({ name, onRemove, size = "sm" }: TagBadgeProps) {
  const colorClass = TAG_COLORS[hashString(name) % TAG_COLORS.length];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-0 font-normal font-sans transition-all",
        colorClass,
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1"
      )}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="h-2.5 w-2.5 opacity-60" />
        </button>
      )}
    </span>
  );
}
