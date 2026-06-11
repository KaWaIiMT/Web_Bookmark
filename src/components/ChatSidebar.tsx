"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, MessageCircle } from "lucide-react";

interface SessionItem {
  id: string;
  title: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ChatSidebarProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function ChatSidebar({
  activeId,
  onSelect,
  onDelete,
  onNew,
  collapsed,
  onToggle,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = () => {
    fetch("/api/chat/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.data || []))
      .catch(() => {});
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeId === id) onNew();
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-full w-10 border-r border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer shrink-0"
      >
        <MessageCircle className="h-4 w-4 text-[var(--muted-foreground)]" />
      </button>
    );
  }

  return (
    <div className="flex flex-col w-56 border-r border-[var(--border)] bg-[var(--card)]/50 shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)]">
        <button
          onClick={onToggle}
          className="text-[13px] font-medium text-[var(--foreground)] font-sans cursor-pointer"
        >
          对话历史
        </button>
        <button
          onClick={() => {
            onNew();
            fetchSessions();
          }}
          className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors cursor-pointer"
          title="新建对话"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-1">
        {sessions.length === 0 ? (
          <p className="px-3 py-8 text-[11px] text-[var(--muted-foreground)] text-center font-sans">
            暂无对话
          </p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--muted)] transition-colors"
              onClick={() => onSelect(s.id)}
            >
              <MessageCircle
                className={`h-3.5 w-3.5 shrink-0 ${
                  activeId === s.id
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[12px] font-sans truncate ${
                    activeId === s.id
                      ? "text-[var(--foreground)] font-medium"
                      : "text-[var(--muted-foreground)]"
                  }`}
                >
                  {s.title || "新对话"}
                </p>
                <p className="text-[10px] text-[var(--foreground)]/20 font-sans">
                  {s._count.messages} 条消息
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(s.id);
                }}
                disabled={deleting === s.id}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
