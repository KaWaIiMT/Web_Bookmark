"use client";

import { useState } from "react";
import {
  LayoutGrid, Images, Compass, BookOpen, GitCompare,
  TrendingUp, BarChart3, Clock, CalendarDays, GitGraph,
  MessageCircle, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/lib/types";

type IconComponent = typeof LayoutGrid;

interface TabItem { value: ViewType; label: string; icon: IconComponent }

const PRIMARY_TABS: TabItem[] = [
  { value: "grid", label: "网格", icon: LayoutGrid },
  { value: "gallery", label: "画廊", icon: Images },
  { value: "dashboard", label: "仪表板", icon: BarChart3 },
  { value: "chat", label: "问答", icon: MessageCircle },
];

const SECONDARY_TABS: TabItem[] = [
  { value: "discover", label: "发现", icon: Compass },
  { value: "compare", label: "对比", icon: GitCompare },
  { value: "learning-path", label: "学习路径", icon: BookOpen },
  { value: "activity", label: "热度", icon: TrendingUp },
  { value: "timeline", label: "时间线", icon: Clock },
  { value: "weekly", label: "周报", icon: CalendarDays },
  { value: "graph", label: "图谱", icon: GitGraph },
];

interface ViewTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewTabs({ activeView, onViewChange }: ViewTabsProps) {
  const [open, setOpen] = useState(false);
  const activeSecondary = SECONDARY_TABS.find((t) => t.value === activeView);

  function TabButton({ value, label, icon: Icon }: TabItem) {
    return (
      <button
        onClick={() => { onViewChange(value); setOpen(false); }}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-all font-sans whitespace-nowrap cursor-pointer",
          activeView === value
            ? "bg-[var(--card)] text-[var(--foreground)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)]/50"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-xl bg-[var(--muted)]">
      {/* Primary tabs — always visible */}
      {PRIMARY_TABS.map((t) => (
        <TabButton key={t.value} {...t} />
      ))}

      {/* Separator */}
      <div className="w-px h-5 bg-[var(--border)] mx-1" />

      {/* Secondary tabs — overflow dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-all font-sans whitespace-nowrap cursor-pointer",
            activeSecondary
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)]/50"
          )}
        >
          <span className="hidden sm:inline">{activeSecondary ? activeSecondary.label : "更多"}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute top-full right-0 mt-1 z-20 w-36 rounded-xl border border-[var(--border)] bg-[var(--popover)] shadow-lg py-1">
              {SECONDARY_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { onViewChange(t.value); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-[12px] font-sans transition-colors cursor-pointer text-left",
                    activeView === t.value
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                      : "text-[var(--foreground)]/70 hover:bg-[var(--muted)]"
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
