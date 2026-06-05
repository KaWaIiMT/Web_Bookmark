"use client";

import { Input } from "@/components/ui/input";
import { Search, RotateCcw, Camera, Filter } from "lucide-react";

export interface GraphToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onReset: () => void;
  nodeCount: number;
  linkCount: number;
  /** Available node labels for the filter dropdown */
  nodeLabels: string[];
  /** Currently selected filter node label (empty = show all) */
  filterNode: string;
  onFilterChange: (label: string) => void;
  /** Screenshot callback */
  onScreenshot: () => void;
}

export function GraphToolbar({
  searchQuery,
  onSearchChange,
  onReset,
  nodeCount,
  linkCount,
  nodeLabels,
  filterNode,
  onFilterChange,
  onScreenshot,
}: GraphToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm">
      <Search className="h-4 w-4 text-[var(--foreground)]/25 shrink-0" />
      <Input
        placeholder="搜索标签或分类..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 h-9 rounded-xl bg-[var(--input)] border-0 focus:bg-[var(--card)] focus:ring-2 focus:ring-[var(--accent)]/10 text-[13px] font-sans"
      />

      {/* Filter dropdown */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Filter className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        <select
          value={filterNode}
          onChange={(e) => onFilterChange(e.target.value)}
          className="h-9 px-2 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/10 cursor-pointer"
        >
          <option value="">全部节点</option>
          {nodeLabels.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Screenshot button */}
      <button
        onClick={onScreenshot}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-sans text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all active:scale-[0.98] cursor-pointer shrink-0"
        title="导出 PNG"
      >
        <Camera className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">截图</span>
      </button>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-sans text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all active:scale-[0.98] cursor-pointer shrink-0"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">重置</span>
      </button>

      <span className="text-[11px] text-[var(--muted-foreground)] font-sans shrink-0 tabular-nums hidden lg:inline">
        {nodeCount} 节点 · {linkCount} 连线
      </span>
    </div>
  );
}
