"use client";

import { useState } from "react";

interface QuestionTemplatesProps {
  onSelect: (text: string) => void;
}

const TEMPLATES = [
  "总结一下我收藏的这些书签中，有哪些值得关注的核心观点？",
  "我在最近收藏的文章中，有哪些关于Rust的最佳实践？",
  "这些书签中共有哪些不同的技术观点或争议？",
  "帮我梳理一下我的书签库中关于前端开发的资源有哪些？",
];

export function QuestionTemplates({ onSelect }: QuestionTemplatesProps) {
  return (
    <div className="px-4 py-6 space-y-3">
      <p className="text-[12px] text-[var(--muted-foreground)] text-center font-sans">
        试试这些问题，了解你的知识库
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            onClick={() => onSelect(t)}
            className="text-left px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[13px] text-[var(--foreground)]/70 font-sans hover:text-[var(--foreground)] hover:border-[var(--foreground)]/15 transition-all cursor-pointer"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
