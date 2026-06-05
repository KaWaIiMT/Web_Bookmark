import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SharePage({ params }: Props) {
  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id, isPublic: true },
    include: {
      user: { select: { name: true, image: true } },
      bookmarks: {
        include: {
          bookmark: {
            include: {
              tags: { include: { tag: true } },
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  if (!collection) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            {collection.user.image && (
              <img src={collection.user.image} alt="" className="h-8 w-8 rounded-full" />
            )}
            <span className="text-[14px] text-[var(--foreground)]/40 font-sans">
              {collection.user.name || "匿名用户"} 的收藏夹
            </span>
          </div>
          <h1 className="text-[32px] font-bold text-[var(--foreground)] font-display">
            {collection.name}
          </h1>
          <p className="text-[14px] text-[var(--foreground)]/30 mt-2 font-sans">
            {collection.bookmarks.length} 个书签
          </p>
        </div>

        {/* Bookmark list */}
        <div className="space-y-3">
          {collection.bookmarks.map(({ bookmark }) => (
            <a
              key={bookmark.id}
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[var(--card)] backdrop-blur-sm rounded-2xl border border-[var(--border)] p-5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {bookmark.coverImage && (
                  <img
                    src={bookmark.coverImage.startsWith("//") ? `https:${bookmark.coverImage}` : bookmark.coverImage}
                    alt=""
                    className="w-20 h-14 rounded-xl object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {bookmark.favicon && (
                      <img src={bookmark.favicon} alt="" className="h-3.5 w-3.5 rounded-sm" />
                    )}
                    <span className="text-[11px] text-[var(--foreground)]/25 font-sans">{bookmark.siteName}</span>
                  </div>
                  <h2 className="text-[15px] font-semibold text-[var(--foreground)] leading-snug line-clamp-1 font-sans">
                    {bookmark.title}
                  </h2>
                  {bookmark.description && (
                    <p className="text-[12px] text-[var(--muted-foreground)] mt-1 line-clamp-2 leading-relaxed font-sans">
                      {bookmark.description}
                    </p>
                  )}
                  {bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bookmark.tags.map(({ tag }) => (
                        <Badge key={tag.id} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-lg bg-[var(--muted)] text-[var(--foreground)]/40 border-0">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-[var(--foreground)]/15 shrink-0 mt-1" />
              </div>
            </a>
          ))}
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
  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id, isPublic: true },
    select: { name: true },
  });

  if (!collection) return { title: "Not Found" };

  return {
    title: `${collection.name} — MarkBox 分享`,
    description: `查看收藏夹"${collection.name}"中的书签`,
  };
}
