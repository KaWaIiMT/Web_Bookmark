"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Download, Sparkles, Clock, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { CompareRadar } from "@/components/CompareRadar";
import { CompareMatrix } from "@/components/CompareMatrix";
import { buildRadarData } from "@/lib/comparisons";
import type { ComparisonResult } from "@/lib/comparisons";
import { toast } from "sonner";

interface CompareViewProps {
  onBack: () => void;
}

type HistoryEntry = {
  id: string;
  createdAt: string;
  result: string; // JSON
  bookmarks: { bookmark: { id: string; title: string; url: string; favicon: string | null; siteName: string | null; coverImage: string | null } }[];
};

export function CompareView({ onBack }: CompareViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<(ComparisonResult & { bookmarks: { id: string; title: string; url: string; favicon: string | null; siteName: string | null; coverImage: string | null }[] }) | null>(null);
  const [bookmarks, setBookmarks] = useState<{ id: string; title: string; url: string; favicon: string | null; siteName: string | null; coverImage: string | null }[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [view, setView] = useState<"select" | "history">("select");

  // Load bookmarks for selection
  useEffect(() => {
    fetch("/api/bookmarks?limit=100")
      .then((r) => r.json())
      .then((d) => setBookmarks(d.data || []))
      .catch(() => {})
      .finally(() => setLoadingBookmarks(false));
  }, []);

  // Load comparison history
  const fetchHistory = () => {
    setLoadingHistory(true);
    fetch("/api/comparisons")
      .then((r) => r.json())
      .then((d) => setHistory(d.data || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 5) { toast.error("最多选择 5 篇书签进行对比"); return prev; }
      return [...prev, id];
    });
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) { toast.error("请至少选择 2 篇书签"); return; }

    // Start analysis in background — switch to history view immediately
    const ids = [...selectedIds];
    setSelectedIds([]);
    setView("history");
    toast.loading(`正在后台对比 ${ids.length} 篇文章...`, { id: "compare-bg", duration: 5000 });

    setAnalyzing(true);
    try {
      const res = await fetch("/api/comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarkIds: ids }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setTitle(`${data.bookmarks.length} 篇文章的对比分析`);
      toast.success("对比分析完成，点击历史记录查看", { id: "compare-bg" });
      fetchHistory(); // Refresh history list
    } catch {
      toast.error("对比分析失败，请重试", { id: "compare-bg" });
    } finally {
      setAnalyzing(false);
    }
  };

  const loadHistoryResult = (entry: HistoryEntry) => {
    try {
      const parsed = JSON.parse(entry.result);
      setResult(parsed);
      setTitle(`${entry.bookmarks.length} 篇文章的对比分析`);
      // Extract bookmark info from history entry
      (parsed as any).bookmarks = entry.bookmarks.map((cb: any) => cb.bookmark);
      setView("select"); // back to main view to show result
    } catch {
      toast.error("无法加载历史对比结果");
    }
  };

  const handleExportMD = () => {
    if (!result) return;
    const labels = result.radarScores.map((r) => r.label);
    let md = `# 📊 ${title}\n> 对比时间：${new Date().toLocaleDateString("zh-CN")} · ${result.bookmarks.length} 篇\n\n`;
    md += `## 📊 多维度评分\n\n| 文章 | ${Object.keys(result.radarScores[0].scores).join(" | ")} |\n|---|---|---|\n`;
    for (const rs of result.radarScores) {
      md += `| ${rs.label} | ${Object.values(rs.scores).join(" | ")} |\n`;
    }
    md += "\n## 📋 对比矩阵\n\n";
    for (const section of result.matrix.sections) {
      md += `### ${section.icon} ${section.title}\n\n`;
      md += `| 维度 | ${labels.map((l, i) => `${String.fromCharCode(65 + i)}. ${l}`).join(" | ")} |\n`;
      md += `|---|---|\n`;
      for (const row of section.rows) {
        md += `| ${row.dimension} | ${row.cells.map((c) => c.value).join(" | ")} |\n`;
      }
      md += "\n";
    }
    md += `## 🤖 AI 综合评语\n\n${result.aiCommentary.opinionDistribution}\n\n### 关键分歧点\n${result.aiCommentary.keyDivergences.map((d) => `- ${d}`).join("\n")}\n\n### 推荐结论\n${result.aiCommentary.conclusion}\n`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparison-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown 已导出");
  };

  const labels = result?.radarScores.map((r) => r.label) || [];
  const radarData = result ? buildRadarData(result) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-[20px] font-semibold text-[var(--foreground)] font-display flex-1">
          {result ? title : "对比分析"}
        </h2>
        <div className="flex gap-2">
          {result && (
            <Button onClick={handleExportMD} variant="outline" size="sm" className="rounded-xl text-[12px] border-[var(--border)] font-sans">
              <Download className="h-3.5 w-3.5 mr-1.5" /> 导出
            </Button>
          )}
          {!result && (
            <Button
              onClick={() => setView(view === "select" ? "history" : "select")}
              variant="ghost"
              size="sm"
              className="rounded-xl text-[12px] text-[var(--muted-foreground)] font-sans"
            >
              {view === "select" ? (
                <><Clock className="h-3.5 w-3.5 mr-1.5" /> 历史记录</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> 新建对比</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Result view */}
      {result && (
        <>
          <CompareRadar data={radarData as { dimension: string; [label: string]: string | number }[]} labels={labels} />
          <CompareMatrix
            sections={result.matrix.sections}
            bookmarkLabels={result.bookmarks.map((bm, i) => ({
              id: bm.id,
              title: bm.title,
              label: String.fromCharCode(65 + i),
            }))}
          />
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm p-5">
            <h3 className="text-[14px] font-semibold text-[var(--foreground)] mb-3 font-display">
              🤖 AI 综合评语
            </h3>
            <div className="space-y-3 text-[13px] text-[var(--foreground)]/60 font-sans leading-relaxed">
              <div>
                <p className="font-medium text-[var(--accent)] text-[11px] uppercase tracking-wider mb-1">观点分布</p>
                <p>{result.aiCommentary.opinionDistribution}</p>
              </div>
              {result.aiCommentary.keyDivergences.length > 0 && (
                <div>
                  <p className="font-medium text-[var(--accent)] text-[11px] uppercase tracking-wider mb-1">关键分歧点</p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.aiCommentary.keyDivergences.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="font-medium text-[var(--accent)] text-[11px] uppercase tracking-wider mb-1">推荐结论</p>
                <p>{result.aiCommentary.conclusion}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => { setResult(null); setView("select"); }}
              variant="ghost"
              className="rounded-xl text-[13px] text-[var(--muted-foreground)] font-sans"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> 返回
            </Button>
          </div>
        </>
      )}

      {/* Selection view */}
      {!result && view === "select" && (
        <div className="space-y-4">
          {loadingBookmarks ? (
            <div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" /></div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[var(--muted-foreground)] font-sans">
                  已选 {selectedIds.length} 篇（选择 2-5 篇后点击对比，将在后台分析）
                </p>
                <Button
                  onClick={handleCompare}
                  disabled={selectedIds.length < 2 || analyzing}
                  className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/85 text-white shadow-none text-[13px] font-sans"
                >
                  {analyzing ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-1.5 animate-pulse" /> AI 分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1.5" /> 开始对比 ({selectedIds.length})
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {bookmarks.map((bm) => {
                  const selected = selectedIds.includes(bm.id);
                  return (
                    <motion.button
                      key={bm.id}
                      onClick={() => toggleSelect(bm.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_0_0_1px_var(--accent)]"
                          : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          selected ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "border-[var(--border)]"
                        }`}>
                          {selected && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                        <div className="min-w-0">
                          {bm.favicon && <img src={bm.favicon} alt="" className="h-3.5 w-3.5 rounded-sm mb-1" />}
                          <h4 className="text-[13px] font-medium text-[var(--foreground)]/85 line-clamp-2 leading-snug font-sans">
                            {bm.title}
                          </h4>
                          <p className="text-[10px] text-[var(--muted-foreground)] mt-1 font-sans">{bm.siteName || "未知"}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* History view */}
      {!result && view === "history" && (
        <div className="space-y-4">
          {analyzing && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-200/40 bg-amber-50/50 dark:bg-amber-500/5 text-[13px] text-amber-700 dark:text-amber-400 font-sans">
              <Sparkles className="h-4 w-4 animate-pulse shrink-0" />
              后台正在进行对比分析，完成后自动出现在列表中
            </div>
          )}

          {loadingHistory ? (
            <div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" /></div>
          ) : history.length === 0 && !analyzing ? (
            <div className="text-center py-20">
              <p className="text-[15px] font-semibold text-[var(--foreground)] font-display">还没有对比记录</p>
              <p className="text-[13px] text-[var(--muted-foreground)] mt-1 font-sans">选择书签开始对比，结果会保存在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const bookmarkTitles = entry.bookmarks.map((cb: any) => cb.bookmark.title).join(" · ");
                return (
                  <motion.button
                    key={entry.id}
                    onClick={() => loadHistoryResult(entry)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    className="w-full text-left rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm p-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {entry.bookmarks.slice(0, 5).map((cb: any) => (
                            cb.bookmark.favicon && (
                              <img key={cb.bookmark.id} src={cb.bookmark.favicon} alt="" className="h-4 w-4 rounded-sm" />
                            )
                          ))}
                        </div>
                        <p className="text-[13px] font-medium text-[var(--foreground)]/80 line-clamp-1 font-sans group-hover:text-[var(--accent)] transition-colors">
                          {bookmarkTitles}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock className="h-3 w-3 text-[var(--foreground)]/20" />
                          <p className="text-[11px] text-[var(--muted-foreground)] font-sans">
                            {new Date(entry.createdAt).toLocaleString("zh-CN")}
                          </p>
                          <span className="text-[10px] text-[var(--foreground)]/15 font-sans">
                            · {entry.bookmarks.length} 篇
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--foreground)]/15 group-hover:text-[var(--accent)] transition-colors shrink-0 mt-1" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
