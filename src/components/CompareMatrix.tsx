"use client";

import { cn } from "@/lib/utils";
import type { MatrixSection } from "@/lib/comparisons";

interface CompareMatrixProps {
  sections: MatrixSection[];
  bookmarkLabels: { id: string; title: string; label: string }[];
}

const SIGNIFICANCE_STYLES: Record<string, string> = {
  critical: "border-l-red-400 bg-red-50/30 dark:bg-red-500/5",
  notable: "border-l-amber-400 bg-amber-50/20 dark:bg-amber-500/3",
  normal: "",
};

export function CompareMatrix({ sections, bookmarkLabels }: CompareMatrixProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm overflow-hidden">
      <div className="p-5">
        <h3 className="text-[14px] font-semibold text-[var(--foreground)] mb-1 font-display">
          📋 详细对比矩阵
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="sticky left-0 bg-[var(--card)] px-5 py-2 text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-sans w-[120px]">
                维度
              </th>
              {bookmarkLabels.map((bm) => (
                <th key={bm.id} className="px-4 py-2 text-[11px] font-medium text-[var(--foreground)] font-sans min-w-[180px]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold flex items-center justify-center">
                      {bm.label}
                    </span>
                    <span className="truncate max-w-[140px]">{bm.title.slice(0, 16)}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <>
                {/* Section header */}
                <tr key={section.title} className="bg-[var(--muted)]/50">
                  <td
                    colSpan={bookmarkLabels.length + 1}
                    className="px-5 py-2 text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider font-sans"
                  >
                    {section.icon} {section.title}
                  </td>
                </tr>
                {/* Section rows */}
                {section.rows.map((row) => (
                  <tr key={row.dimension} className="border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="sticky left-0 bg-[var(--card)] px-5 py-3 text-[12px] font-medium text-[var(--foreground)]/70 font-sans">
                      {row.dimension}
                    </td>
                    {bookmarkLabels.map((bm) => {
                      const cell = row.cells.find((c) => c.bookmarkId === bm.id);
                      return (
                        <td
                          key={bm.id}
                          className={cn(
                            "px-4 py-3 text-[12px] text-[var(--foreground)]/60 font-sans border-l border-[var(--border)]/20",
                            cell ? SIGNIFICANCE_STYLES[cell.significance] || "" : ""
                          )}
                        >
                          {cell?.value || "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
