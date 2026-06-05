"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, CheckCircle2, Circle, Sparkles, Download, Trash2, GripVertical, FileText } from "lucide-react";
import { motion, Reorder } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PathItem {
  id: string;
  bookmarkId: string;
  order: number;
  stage: string | null;
  difficulty: string | null;
  estimatedMinutes: number | null;
  isOptional: boolean;
  isCompleted: boolean;
  bookmark: {
    id: string;
    title: string;
    url: string;
    coverImage: string | null;
    favicon: string | null;
    siteName: string | null;
    description: string | null;
  };
  notes: NoteData[];
}

interface NoteData {
  id: string;
  content: string;
  type: string;
  createdAt: string;
}

interface LearningPathDetailViewProps {
  pathId: string;
  onBack: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高级",
};

export function LearningPathDetailView({ pathId, onBack }: LearningPathDetailViewProps) {
  const [items, setItems] = useState<PathItem[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [gaps, setGaps] = useState<{ topic: string; status: string; suggestion: string }[]>([]);

  const fetchPath = () => {
    fetch(`/api/learning-paths/${pathId}`)
      .then((r) => r.json())
      .then((d) => { setTitle(d.title); setItems(d.items || []); })
      .catch(() => toast.error("加载失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPath(); }, [pathId]);

  const handleToggleComplete = async (item: PathItem) => {
    try {
      const res = await fetch(`/api/learning-paths/${pathId}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !item.isCompleted }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i));
    } catch { toast.error("操作失败"); }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await fetch(`/api/learning-paths/${pathId}/items/${itemId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("已移除");
    } catch { toast.error("移除失败"); }
  };

  const handleReorder = async (reordered: PathItem[]) => {
    setItems(reordered);
    try {
      await fetch(`/api/learning-paths/${pathId}/items/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((i) => i.id) }),
      });
    } catch { toast.error("排序失败"); }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/learning-paths/${pathId}/analyze`, { method: "POST" });
      const result = await res.json();
      if (result.gaps) setGaps(result.gaps);
      fetchPath(); // refresh items with updated stage/difficulty
      toast.success("AI 分析完成");
    } catch { toast.error("分析失败"); }
    finally { setAnalyzing(false); }
  };

  const handleExport = () => {
    window.open(`/api/learning-paths/${pathId}/export`, "_blank");
  };

  const handleAddNote = async (itemId: string, content: string) => {
    if (!content.trim()) return;
    try {
      await fetch(`/api/learning-paths/${pathId}/items/${itemId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      fetchPath();
    } catch { toast.error("笔记添加失败"); }
  };

  const completed = items.filter((i) => i.isCompleted).length;
  const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="h-8 w-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-[20px] font-semibold text-[var(--foreground)] font-display flex-1">{title}</h2>
        <Button onClick={handleAnalyze} disabled={analyzing || items.length === 0} variant="outline" size="sm" className="rounded-xl text-[12px] border-[var(--border)] font-sans">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI 分析
        </Button>
        <Button onClick={handleExport} disabled={items.length === 0} variant="outline" size="sm" className="rounded-xl text-[12px] border-[var(--border)] font-sans">
          <Download className="h-3.5 w-3.5 mr-1.5" /> 导出
        </Button>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[var(--foreground)] font-sans">学习进度</span>
            <span className="text-[12px] text-[var(--muted-foreground)] font-sans">{completed}/{items.length} · {progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Gaps detection */}
      {gaps.length > 0 && (
        <div className="rounded-2xl border border-amber-200/40 bg-amber-50/30 dark:bg-amber-500/5 p-4">
          <p className="text-[11px] font-medium text-amber-600 uppercase tracking-widest mb-2 font-sans">知识缺口</p>
          <div className="space-y-1.5">
            {gaps.map((g) => (
              <div key={g.topic} className="flex items-center gap-2 text-[12px] font-sans">
                <span>{g.status === "missing" ? "❌" : g.status === "partial" ? "⚠️" : "✅"}</span>
                <span className="text-[var(--foreground)]/70">{g.topic}</span>
                {g.suggestion && <span className="text-[var(--muted-foreground)]">— {g.suggestion}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roadmap nodes */}
      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[15px] font-semibold text-[var(--foreground)] font-display">路径为空</p>
          <p className="text-[13px] text-[var(--muted-foreground)] mt-1 font-sans">从书签详情页将书签加入学习路径</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
          {items.map((item, index) => (
            <Reorder.Item key={item.id} value={item} className="list-none">
              <motion.div
                layout
                className={`rounded-2xl border p-4 bg-[var(--card)] backdrop-blur-sm transition-all ${
                  item.isCompleted ? "border-emerald-200/40 opacity-70" : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Drag grip */}
                  <div className="cursor-grab active:cursor-grabbing text-[var(--foreground)]/10 hover:text-[var(--foreground)]/30 mt-0.5">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* Complete toggle */}
                  <button onClick={() => handleToggleComplete(item)} className="mt-0.5 shrink-0">
                    {item.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-[var(--foreground)]/15" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.bookmark.favicon && <img src={item.bookmark.favicon} alt="" className="h-3.5 w-3.5 rounded-sm" />}
                      <span className="text-[10px] text-[var(--foreground)]/20 font-sans">{item.bookmark.siteName}</span>
                      {item.difficulty && (
                        <Badge className={`text-[9px] px-1.5 py-0 rounded-md border-0 font-sans ${
                          item.difficulty === "beginner" ? "bg-emerald-100/60 text-emerald-700" :
                          item.difficulty === "intermediate" ? "bg-amber-100/60 text-amber-700" :
                          "bg-red-100/60 text-red-700"
                        }`}>{DIFFICULTY_LABELS[item.difficulty] || item.difficulty}</Badge>
                      )}
                      {item.isOptional && <Badge className="text-[9px] px-1.5 py-0 rounded-md bg-[var(--muted)] text-[var(--foreground)]/30 border-0 font-sans">可选</Badge>}
                      <span className="text-[10px] text-[var(--muted-foreground)] ml-auto font-sans">#{index + 1}</span>
                    </div>
                    <a href={item.bookmark.url} target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-[var(--foreground)]/85 hover:text-[var(--accent)] transition-colors line-clamp-1 font-sans">
                      {item.bookmark.title}
                    </a>
                    {item.stage && <p className="text-[11px] text-[var(--muted-foreground)] mt-1 font-sans">{item.stage}</p>}

                    {/* Notes */}
                    {item.notes.map((note) => (
                      <div key={note.id} className="mt-2 p-2 rounded-lg bg-[var(--muted)] text-[12px] text-[var(--foreground)]/50 font-sans">
                        {note.type === "question" ? "❓" : note.type === "todo" ? "✅" : "💡"} {note.content}
                      </div>
                    ))}
                    <QuickNoteInput onAdd={(content) => handleAddNote(item.id, content)} />

                    <button onClick={() => handleRemove(item.id)} className="text-[10px] text-red-400 hover:text-red-500 mt-1.5 font-sans">
                      <Trash2 className="h-3 w-3 inline mr-1" />移除
                    </button>
                  </div>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}

function QuickNoteInput({ onAdd }: { onAdd: (content: string) => void }) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="text-[10px] text-[var(--accent)]/50 hover:text-[var(--accent)] mt-1 font-sans">
        <FileText className="h-3 w-3 inline mr-1" />添加笔记
      </button>
    );
  }

  return (
    <div className="flex gap-1 mt-1.5">
      <Input
        placeholder="写一句话笔记..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onAdd(text); setText(""); setShow(false); }
          if (e.key === "Escape") setShow(false);
        }}
        className="h-7 text-[11px] rounded-lg bg-[var(--muted)] border-0 font-sans"
        autoFocus
      />
      <Button size="sm" onClick={() => { onAdd(text); setText(""); setShow(false); }} disabled={!text.trim()} className="h-7 text-[10px] rounded-lg font-sans">保存</Button>
    </div>
  );
}
