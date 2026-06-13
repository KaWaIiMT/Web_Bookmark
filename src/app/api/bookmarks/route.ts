import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractMetadata } from "@/lib/metadata";
import { categorizeBookmark } from "@/lib/deepseek";
import { archivePage } from "@/lib/archiver";
import { getUserIdFromRequest } from "@/lib/auth-helpers";

// Create bookmark (with metadata extraction + AI categorization)
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      url,
      title: customTitle,
      description: customDescription,
      categoryId: userCategoryId,
    } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Step 1: Extract metadata
    let title = "";
    let description = "";
    let coverImage = "";
    let favicon = "";
    let siteName = "";
    let contentType = "webpage";
    let metadata: Record<string, unknown> = {};

    try {
      const extracted = await extractMetadata(url);
      title = extracted.title;
      description = extracted.description || "";
      coverImage = extracted.coverImage || "";
      favicon = extracted.favicon || "";
      siteName = extracted.siteName || "";
      contentType = extracted.contentType;
      metadata = extracted.specifics as Record<string, unknown>;
    } catch {
      try {
        const parsed = new URL(url);
        title = parsed.hostname + parsed.pathname;
        siteName = parsed.hostname;
      } catch {
        title = url;
      }
    }

    // Step 2: AI categorization
    let aiTags: string[] = [];
    let aiCategory = "";
    let aiSummary = "";

    try {
      const aiResult = await categorizeBookmark({
        title,
        description,
        siteName,
        contentType,
      });
      aiTags = aiResult.tags || [];
      aiCategory = aiResult.category || "";
      aiSummary = aiResult.summary || "";
    } catch (err) {
      console.error("AI categorization failed:", err);
    }

    // Step 3: Upsert tags (scoped to user)
    const tagRecords = await Promise.all(
      aiTags.map(async (tagName) => {
        const slug = tagName.toLowerCase().replace(/\s+/g, "-");
        return prisma.tag.upsert({
          where: { userId_slug: { userId, slug } },
          update: {},
          create: { name: tagName, slug, userId },
        });
      })
    );

    // Step 4: Find or create category — use user-provided id if given
    let categoryId: string | null = null;
    if (userCategoryId) {
      // Verify the category exists before using it
      const existingCategory = await prisma.category.findUnique({
        where: { id: userCategoryId },
      });
      if (existingCategory) {
        categoryId = userCategoryId;
      }
      // If category doesn't exist, fall through to AI categorization
    }
    if (!categoryId && aiCategory) {
      const topCategory = aiCategory.split(">")[0].trim();
      const catSlug = topCategory.toLowerCase().replace(/\s+/g, "-");
      const category = await prisma.category.upsert({
        where: { slug: catSlug },
        update: {},
        create: { name: topCategory, slug: catSlug, order: 0 },
      });
      categoryId = category.id;
    }

    // Step 5: Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        title: customTitle || title,
        description: customDescription || description || aiSummary || "",
        coverImage,
        favicon,
        siteName,
        contentType,
        metadata: JSON.stringify(metadata),
        aiSummary,
        categoryId,
        userId,
        tags: {
          create: tagRecords.map((tag) => ({
            tagId: tag.id,
          })),
        },
      },
      include: {
        tags: { include: { tag: true } },
        category: true,
      },
    });

    // Step 6: Fire-and-forget archive (async, don't block the response)
    const bookmarkId = bookmark.id;
    const bookmarkUrl = url;
    prisma.bookmark
      .update({ where: { id: bookmarkId }, data: { archiveStatus: "pending" } })
      .then(() => archivePage(bookmarkUrl))
      .then(({ html, text }) =>
        prisma.bookmark.update({
          where: { id: bookmarkId },
          data: { archiveHtml: html, archiveText: text, archivedAt: new Date(), archiveStatus: "success" },
        })
      )
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "unknown";
        prisma.bookmark
          .update({
            where: { id: bookmarkId },
            data: { archiveStatus: `failed: ${msg.slice(0, 200)}` },
          })
          .catch(() => {}); // swallow — can't do much if this also fails
      });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create bookmark";
    console.error("Create bookmark error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// List bookmarks with pagination, filtering, and search
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const collectionId = searchParams.get("collectionId") || undefined;
    const contentType = searchParams.get("contentType") || undefined;
    const search = searchParams.get("q") || undefined;
    const url = searchParams.get("url") || undefined;

    const where: Record<string, unknown> = { userId };

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (contentType) where.contentType = contentType;
    if (url) where.url = url;
    if (collectionId) {
      where.collections = { some: { collectionId } };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { aiSummary: { contains: search } },
        { tags: { some: { tag: { name: { contains: search } } } } },
      ];
    }

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        select: {
          id: true,
          url: true,
          title: true,
          description: true,
          coverImage: true,
          favicon: true,
          siteName: true,
          contentType: true,
          metadata: true,
          aiSummary: true,
          shareToken: true,
          status: true,
          categoryId: true,
          userId: true,
          order: true,
          readAt: true,
          archiveStatus: true,
          linkStatus: true,
          linkStatusCode: true,
          linkRedirectUrl: true,
          createdAt: true,
          updatedAt: true,
          tags: { include: { tag: true } },
          category: true,
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bookmark.count({ where }),
    ]);

    return NextResponse.json({
      data: bookmarks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch bookmarks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
