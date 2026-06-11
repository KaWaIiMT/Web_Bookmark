"use client";

import { useState, type FormEvent } from "react";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  loading: boolean;
}

export function ChatInput({ onSend, onStop, loading }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-4 py-3 border-t border-[var(--border)] bg-[var(--card)]"
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder="向你的知识库提问..."
        rows={1}
        className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2.5 text-[13px] rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] font-sans outline-none focus:ring-2 focus:ring-[var(--accent)]/10 resize-none placeholder:text-[var(--foreground)]/25"
      />
      {loading ? (
        <button
          type="button"
          onClick={onStop}
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all cursor-pointer shrink-0"
        >
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
