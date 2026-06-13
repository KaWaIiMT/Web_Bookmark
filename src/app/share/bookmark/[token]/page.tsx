import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { resolveImageUrl } from "@/lib/utils";

type Props = {
  params: Promise<{ token: string }>;
};

const contentTypeLabels: Record<string, string> = {
  video: "视频",
  article: "文章",
  repository: "仓库",
  image: "图片",
  social: "社交",
  webpage: "网页",
};

export default async function ShareBookmarkPage({ params }: Props) {
  const { token } = await params;

  const bookmark = await prisma.bookmark.findUnique({
    where: { shareToken: token },
    include: {
      tags: { include: { tag: true } },
      category: true,
      user: { select: { name: true, image: true } },
    },
  });

  if (!bookmark) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            {bookmark.user.image && (
              <img
                src={bookmark.user.image}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            )}
            <span className="text-[14px] text-[var(--foreground)]/40 font-sans">
              {bookmark.user.name || "匿名用户"} 分享的书签
            </span>
          </div>
          <h1 className="text-[28px] font-bold text-[var(--foreground)] font-display leading-tight">
            {bookmark.title}
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <Badge
              variant="outline"
              className="text-[10px] rounded-full border-[var(--border)] text-[var(--foreground)]/30 font-normal"
            >
              {contentTypeLabels[bookmark.contentType] || "网页"}
            </Badge>
            {bookmark.siteName && (
              <span className="text-[12px] text-[var(--foreground)]/30 font-sans">
                {bookmark.siteName}
              </span>
            )}
          </div>
        </div>

        {/* Cover image */}
        {bookmark.coverImage && (
          <div className="mb-8">
            <img
              src={
                resolveImageUrl(bookmark.coverImage, bookmark.url) ?? undefined
              }
              alt={bookmark.title}
              className="w-full rounded-2xl object-cover max-h-96"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Description */}
        {bookmark.description && (
          <div className="mb-6">
            <p className="text-[10px] font-medium text-[var(--foreground)]/25 uppercase tracking-widest mb-2 font-sans">
              描述
            </p>
            <p className="text-[15px] text-[var(--foreground)]/60 leading-relaxed font-sans">
              {bookmark.description}
            </p>
          </div>
        )}

        {/* AI Summary */}
        {bookmark.aiSummary && (
          <div className="mb-6">
            <p className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-widest mb-2 font-sans">
              AI 摘要
            </p>
            <p className="text-[14px] text-[var(--foreground)]/50 leading-relaxed font-sans">
              {bookmark.aiSummary}
            </p>
          </div>
        )}

        {/* Tags */}
        {bookmark.tags.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-medium text-[var(--foreground)]/25 uppercase tracking-widest mb-2 font-sans">
              标签
            </p>
            <div className="flex flex-wrap gap-1.5">
              {bookmark.tags.map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--card)] border-0 text-[var(--foreground)]/45 font-normal font-sans"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Open link button */}
        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/85 text-white text-[14px] font-medium transition-all duration-200 hover:shadow-[0_4px_16px_rgba(183,110,75,0.2)] font-sans"
          >
            <ExternalLink className="h-4 w-4" />
            打开原文
          </a>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="text-[13px] text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors font-sans"
          >
            Powered by MarkBox
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const bookmark = await prisma.bookmark.findUnique({
    where: { shareToken: token },
    select: { title: true },
  });

  if (!bookmark) return { title: "Not Found" };

  return {
    title: `${bookmark.title} — MarkBox 分享`,
    description: `查看"${bookmark.title}"的分享书签`,
  };
}
