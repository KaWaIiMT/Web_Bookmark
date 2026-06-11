"use client";

import { ExternalLink } from "lucide-react";

interface ChatCitation {
  bookmarkId: string;
  title: string;
  snippet: string;
  relevanceScore: number;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  isStreaming?: boolean;
  onCitationClick?: (bookmarkId: string) => void;
}

/** Simple markdown-like rendering: bold, italic, code blocks, lists */
function renderContent(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code class='px-1 py-0.5 rounded bg-[var(--muted)] text-[12px] font-mono'>$1</code>")
    .replace(/\n- (.+)/g, "\n<li class='ml-4 list-disc text-[13px]'>$1</li>")
    .replace(/\n\n/g, "<br/><br/>");
}

export function ChatMessage({
  role,
  content,
  citations,
  isStreaming,
  onCitationClick,
}: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end px-4 py-2">
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-[var(--accent)] text-[var(--accent-foreground)] text-[13px] leading-relaxed font-sans">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="max-w-[85%]">
        <div className="text-[13px] leading-relaxed font-sans text-[var(--foreground)]/85">
          <div
            dangerouslySetInnerHTML={{ __html: renderContent(content) }}
            className="prose-custom"
          />
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-[var(--accent)] ml-0.5 animate-pulse align-middle" />
          )}
        </div>

        {/* Citation cards */}
        {citations && citations.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-[var(--muted-foreground)] font-sans">
              📎 参考来源 ({citations.length})
            </p>
            {citations.map((c) => (
              <button
                key={c.bookmarkId}
                onClick={() => onCitationClick?.(c.bookmarkId)}
                className="flex items-start gap-2 w-full px-3 py-2 rounded-lg bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-left transition-colors cursor-pointer group"
              >
                <ExternalLink className="h-3 w-3 text-[var(--muted-foreground)] mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[var(--foreground)]/70 font-sans truncate">
                    {c.title}
                  </p>
                  {c.snippet && (
                    <p className="text-[11px] text-[var(--muted-foreground)] font-sans line-clamp-1 mt-0.5">
                      {c.snippet}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { type ChatCitation };
