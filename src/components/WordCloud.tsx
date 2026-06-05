"use client";

import { cn } from "@/lib/utils";

interface WordCloudTag {
  name: string;
  count: number;
  color?: string | null;
}

interface WordCloudProps {
  tags: WordCloudTag[];
  maxFontSize?: number;
}

export function WordCloud({ tags, maxFontSize = 32 }: WordCloudProps) {
  if (tags.length === 0) {
    return (
      <p className="text-[12px] text-[var(--muted-foreground)] text-center font-sans">
        暂无标签数据
      </p>
    );
  }

  const maxCount = Math.max(...tags.map((t) => t.count), 1);

  return (
    <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5">
      {tags.map((tag) => {
        const ratio = tag.count / maxCount;
        const fontSize = 11 + ratio * (maxFontSize - 11);
        const opacity = 0.3 + ratio * 0.7;

        return (
          <span
            key={tag.name}
            className={cn(
              "inline-block px-1.5 py-0.5 rounded-md font-medium transition-all duration-200 hover:scale-110 cursor-default font-sans",
            )}
            style={{
              fontSize: `${fontSize}px`,
              opacity,
              color: tag.color || undefined,
            }}
            title={`${tag.name}: ${tag.count} 条`}
          >
            {tag.name}
          </span>
        );
      })}
    </div>
  );
}
