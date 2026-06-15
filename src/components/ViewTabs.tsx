"use client";

import { LayoutGrid, Images, Compass, BookOpen, GitCompare, TrendingUp, BarChart3, Clock, CalendarDays, GitGraph, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ViewType } from "@/lib/types";

const PRIMARY_TABS: { value: ViewType; label: string; icon: typeof LayoutGrid }[] = [
  { value: "grid", label: "网格", icon: LayoutGrid },
  { value: "gallery", label: "画廊", icon: Images },
  { value: "timeline", label: "时间线", icon: Clock },
  { value: "discover", label: "发现", icon: Compass },
];

const MORE_TABS: { value: ViewType; label: string; icon: typeof LayoutGrid }[] = [
  { value: "dashboard", label: "仪表板", icon: BarChart3 },
  { value: "compare", label: "对比", icon: GitCompare },
  { value: "learning-path", label: "学习路径", icon: BookOpen },
  { value: "activity", label: "热度", icon: TrendingUp },
  { value: "weekly", label: "周报", icon: CalendarDays },
  { value: "graph", label: "图谱", icon: GitGraph },
];

interface ViewTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewTabs({ activeView, onViewChange }: ViewTabsProps) {
  return (
    <div className="flex items-center gap-0.5 p-1 rounded-xl bg-[var(--muted)] shrink-0">
      {PRIMARY_TABS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => onViewChange(value)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-all font-sans whitespace-nowrap",
            activeView === value
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}

      {/* More dropdown — always shows ellipsis */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-all font-sans whitespace-nowrap outline-none",
            MORE_TABS.some((t) => t.value === activeView)
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-40 rounded-2xl border border-[var(--border)] shadow-[0_12px_40px_rgba(0,0,0,0.08)] bg-[var(--popover)] backdrop-blur-xl p-1.5"
        >
          {MORE_TABS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => onViewChange(value)}
              className={cn(
                "text-[13px] rounded-xl cursor-pointer font-sans gap-2.5",
                activeView === value && "font-medium bg-[var(--muted)]"
              )}
            >
              <Icon className="h-3.5 w-3.5 opacity-50" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
