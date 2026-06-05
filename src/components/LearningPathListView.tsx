"use client";

import { useState, useEffect } from "react";
import { Plus, BookOpen, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PathData {
  id: string;
  title: string;
  description: string | null;
  targetTags: string | null;
  status: string;
  _count: { items: number };
  items: { bookmark: { coverImage: string | null } }[];
  createdAt: string;
}

interface LearningPathListViewProps {
  onSelectPath: (id: string) => void;
  onCreateNew: () => void;
}

export function LearningPathListView({ onSelectPath, onCreateNew }: LearningPathListViewProps) {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickTitle, setQuickTitle] = useState("");
  const [showQuick, setShowQuick] = useState(false);

  const fetchPaths = () => {
    fetch("/api/learning-paths")
      .then((r) => r.json())
      .then((d) => setPaths(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPaths(); }, []);

  const handleQuickCreate = async () => {
    if (!quickTitle.trim()) return;
    try {
      const res = await fetch("/api/learning-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: quickTitle.trim() }),
      });
      if (!res.ok) throw new Error();
      setQuickTitle("");
      setShowQuick(false);
      fetchPaths();
      toast.success("学习路径已创建");
    } catch { toast.error("创建失败"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/learning-paths/${id}`, { method: "DELETE" });
      fetchPaths();
      toast.success("已删除");
    } catch { toast.error("删除失败"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-[var(--foreground)] font-display">学习路径</h2>
          <p className="text-[13px] text-[var(--muted-foreground)] mt-1 font-sans">系统化你的学习旅程</p>
        </div>
        <Button
          onClick={() => setShowQuick(true)}
          size="sm"
          className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/85 text-white shadow-none text-[13px] font-sans"
        >
          <Plus className="h-4 w-4 mr-1.5" /> 新建路径
        </Button>
      </div>

      {/* Quick create */}
      {showQuick && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]"
        >
          <Input
            placeholder="路径名称，如「系统学习 Rust」..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickCreate()}
            className="text-[13px] bg-[var(--muted)] border-0 rounded-xl font-sans"
            autoFocus
          />
          <Button onClick={handleQuickCreate} disabled={!quickTitle.trim()} className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/85 text-white text-[13px] font-sans">
            创建
          </Button>
          <Button variant="ghost" onClick={() => setShowQuick(false)} className="rounded-xl text-[13px] font-sans">取消</Button>
        </motion.div>
      )}

      {/* Path list */}
      {paths.length === 0 && !loading ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 text-[var(--foreground)]/10 mx-auto mb-4" />
          <p className="text-[15px] font-semibold text-[var(--foreground)] font-display">暂无学习路径</p>
          <p className="text-[13px] text-[var(--muted-foreground)] mt-1 font-sans">创建一条学习路径，系统化你的知识积累</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paths.map((path, i) => (
            <motion.button
              key={path.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectPath(path.id)}
              className="w-full text-left rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200 p-5 group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-[var(--foreground)] font-sans group-hover:text-[var(--accent)] transition-colors">
                    {path.title}
                  </h3>
                  {path.description && (
                    <p className="text-[12px] text-[var(--muted-foreground)] mt-1 line-clamp-1 font-sans">{path.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--foreground)]/25 font-sans">
                    <span>{path._count.items} 个节点</span>
                    {path.targetTags && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--muted)]">{
                        (() => { try { return JSON.parse(path.targetTags!).join(", "); } catch { return ""; } })()
                      }</span>
                    )}
                    <span className={`ml-auto ${path.status === "completed" ? "text-emerald-500" : "text-[var(--accent)]"}`}>
                      {path.status === "completed" ? "已完成" : "进行中"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <ArrowRight className="h-4 w-4 text-[var(--foreground)]/15 group-hover:text-[var(--accent)] transition-colors" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(path.id); }}
                    className="p-1 rounded-lg text-[var(--foreground)]/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
