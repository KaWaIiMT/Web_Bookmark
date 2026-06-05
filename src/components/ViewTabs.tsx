"use client";

import { LayoutGrid, Images, Compass, BookOpen, GitCompare, TrendingUp, BarChart3, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/lib/types";

const TABS: { value: ViewType; label: string; icon: typeof LayoutGrid }[] = [
  { value: "grid", label: "网格", icon: LayoutGrid },
  { value: "gallery", label: "画廊", icon: Images },
  { value: "discover", label: "发现", icon: Compass },
  { value: "compare", label: "对比", icon: GitCompare },
  { value: "learning-path", label: "学习路径", icon: BookOpen },
  { value: "activity", label: "热度", icon: TrendingUp },
  { value: "dashboard", label: "仪表板", icon: BarChart3 },
  { value: "timeline", label: "时间线", icon: Clock },
  { value: "weekly", label: "周报", icon: CalendarDays },
];

interface ViewTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewTabs({ activeView, onViewChange }: ViewTabsProps) {
  return (
    <div className="flex items-center gap-0.5 p-1 rounded-xl bg-[var(--muted)] overflow-x-auto">
      {TABS.map(({ value, label, icon: Icon }) => (
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
    </div>
  );
}
