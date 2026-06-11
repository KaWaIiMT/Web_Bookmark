"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage, type ChatCitation } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { QuestionTemplates } from "@/components/QuestionTemplates";
import { BookmarkDetailSheet } from "@/components/BookmarkDetailSheet";
import type { BookmarkData } from "@/lib/types";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  isStreaming?: boolean;
}

export function ChatView() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      const data = await res.json();
      if (data.data) {
        setMessages(
          data.data.messages.map((m: Record<string, unknown>) => ({
            id: m.id as string,
            role: m.role as "user" | "assistant",
            content: m.content as string,
            citations: (m.citations as ChatCitation[]) || undefined,
          })),
        );
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectSession = useCallback(
    (id: string) => {
      setSessionId(id);
      loadSession(id);
    },
    [loadSession],
  );

  const handleNewSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
  }, []);

  const handleDeleteSession = useCallback(
    (id: string) => {
      if (sessionId === id) handleNewSession();
    },
    [sessionId, handleNewSession],
  );

  const handleSend = useCallback(
    async (query: string) => {
      setLoading(true);

      // Optimistic user message
      const userMsg: LocalMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: query,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Assistant placeholder
      const assistantMsg: LocalMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        citations: [],
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch("/api/chat/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, sessionId }),
          signal: controller.signal,
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream body");

        const decoder = new TextDecoder();
        let buffer = "";
        let currentContent = "";
        let currentCitations: ChatCitation[] = [];
        let newSessionId = sessionId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (eventType === "meta" && data.sessionId) {
                  newSessionId = data.sessionId;
                  currentCitations = data.citations || [];
                } else if (eventType === "text" && data.text) {
                  currentContent += data.text;
                }
              } catch {
                // partial chunk — ignore parse errors
              }
            }
          }

          // Update the streaming message in place
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: currentContent, citations: currentCitations }
                : m,
            ),
          );
        }

        // Streaming done — remove streaming flag
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, isStreaming: false } : m,
          ),
        );

        if (newSessionId && newSessionId !== sessionId) {
          setSessionId(newSessionId);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Remove the placeholder and add an error message
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== assistantMsg.id)
            .concat({
              id: `error-${Date.now()}`,
              role: "assistant",
              content: "抱歉，生成回答时出错了，请重试。",
            }),
        );
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [sessionId],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const handleCitationClick = useCallback(
    async (bookmarkId: string) => {
      try {
        const res = await fetch(`/api/bookmarks/${bookmarkId}`);
        const bm = await res.json();
        setSelectedBookmark(bm);
        setDetailOpen(true);
      } catch {
        // ignore
      }
    },
    [],
  );

  return (
    <div className="flex" style={{ height: "calc(100vh - 10rem)" }}>
      {/* Sidebar */}
      <ChatSidebar
        activeId={sessionId}
        onSelect={handleSelectSession}
        onDelete={handleDeleteSession}
        onNew={handleNewSession}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)]/50">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <QuestionTemplates onSelect={handleSend} />
            </div>
          ) : (
            <div className="py-2">
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  citations={m.citations}
                  isStreaming={m.isStreaming}
                  onCitationClick={handleCitationClick}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} onStop={handleStop} loading={loading} />
      </div>

      {/* Detail drawer */}
      <BookmarkDetailSheet
        bookmark={selectedBookmark}
        cardRect={null}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedBookmark(null);
        }}
        onStatusChange={async () => {}}
        onDelete={async () => {
          setDetailOpen(false);
          setSelectedBookmark(null);
        }}
        onSelectBookmark={(id: string) => {
          fetch(`/api/bookmarks/${id}`)
            .then((r) => r.json())
            .then((bm) => { setSelectedBookmark(bm); })
            .catch(() => {});
        }}
      />
    </div>
  );
}
