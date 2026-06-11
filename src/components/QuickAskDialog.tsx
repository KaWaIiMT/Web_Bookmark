"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, ArrowRight } from "lucide-react";

interface QuickAskResult {
  id: string;
  title: string;
  snippet: string;
  siteName: string | null;
  contentType: string;
  relevanceScore: number;
}

interface QuickAskDialogProps {
  open: boolean;
  onClose: () => void;
  onAsk: (query: string) => void;
}

export function QuickAskDialog({ open, onClose, onAsk }: QuickAskDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickAskResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!q.trim()) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch("/api/chat/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        const data = await res.json();
        setResults(data.data || []);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    onClose();
    onAsk(trimmed);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--border)] bg-[var(--popover)] shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onClose();
            }}
            placeholder="快速提问… Ctrl+K"
            className="flex-1 bg-transparent text-[14px] font-sans text-[var(--foreground)] outline-none placeholder:text-[var(--foreground)]/25"
          />
          <button
            onClick={handleSubmit}
            disabled={!query.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] text-[12px] font-medium font-sans hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer shrink-0"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            提问
          </button>
        </div>

        {/* Results preview */}
        {searching && (
          <div className="px-4 py-6 text-center">
            <div className="h-5 w-5 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin mx-auto" />
          </div>
        )}

        {!searching && results.length > 0 && (
          <div className="max-h-64 overflow-y-auto py-1">
            <p className="px-4 py-2 text-[11px] text-[var(--muted-foreground)] font-sans">
              找到 {results.length} 个相关书签
            </p>
            {results.map((r) => (
              <div key={r.id} className="px-4 py-2 hover:bg-[var(--muted)]/50 transition-colors">
                <p className="text-[13px] font-medium text-[var(--foreground)]/80 font-sans truncate">
                  {r.title}
                </p>
                {r.snippet && (
                  <p className="text-[11px] text-[var(--muted-foreground)] font-sans line-clamp-2 mt-0.5">
                    {r.snippet}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!searching && query.trim() && results.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-[12px] text-[var(--muted-foreground)] font-sans">
              未找到相关书签，但仍可直接提问
            </p>
          </div>
        )}

        {!query.trim() && (
          <div className="px-4 py-6 text-center">
            <p className="text-[12px] text-[var(--muted-foreground)] font-sans">
              输入问题，搜索你的知识库
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
