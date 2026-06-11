/**
 * RAG Chat — retrieval + generation pipeline.
 *
 * Hybrid retrieval: vector cosine similarity + keyword search → RRF fusion.
 * Generation: DeepSeek V4 Flash with streaming (SSE-ready).
 * Context window: dynamic — keeps last 8 turns, compresses older.
 */
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";
import { cosineSimilarity } from "@/lib/recommendations";
import type { BookmarkData, TagData } from "@/lib/types";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const MODEL = "deepseek-v4-flash";

// ── Types ──

export interface ChatCitation {
  bookmarkId: string;
  title: string;
  snippet: string;
  relevanceScore: number;
}

export interface ScoredCandidate {
  id: string;
  url: string;
  title: string;
  description: string | null;
  aiSummary: string | null;
  siteName: string | null;
  contentType: string;
  tags: { tag: { id: string; name: string; slug: string } }[];
  score: number;
}

export interface ChatMessageParam {
  role: "system" | "user" | "assistant";
  content: string;
}

// ── Retrieval ──

/** Reciprocal Rank Fusion: merge two ranked lists, demoting duplicates. k=60 per convention */
function rrf(
  vectorResults: ScoredCandidate[],
  keywordResults: ScoredCandidate[],
  k = 60,
): ScoredCandidate[] {
  const scores = new Map<string, number>();
  const seen = new Map<string, ScoredCandidate>();

  for (const [i, doc] of vectorResults.entries()) {
    scores.set(doc.id, 1 / (k + i + 1));
    seen.set(doc.id, doc);
  }
  for (const [i, doc] of keywordResults.entries()) {
    scores.set(doc.id, (scores.get(doc.id) || 0) + 1 / (k + i + 1));
    if (!seen.has(doc.id)) seen.set(doc.id, doc);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => seen.get(id)!)
    .filter(Boolean);
}

/**
 * Retrieve relevant bookmarks for a query.
 * Vector recall (top-10 via embedding cosine sim) + keyword recall (top-5 via Prisma contains).
 * RRF merges the two lists into top-K candidates (default 8).
 */
export async function retrieveRelevantBookmarks(
  userId: string,
  query: string,
  topK = 8,
): Promise<ScoredCandidate[]> {
  // 1. Vector recall
  let vectorResults: ScoredCandidate[] = [];
  try {
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding.length > 0) {
      const bookmarks = await prisma.bookmark.findMany({
        where: { userId, embedding: { not: null } },
        include: { tags: { include: { tag: true } } },
      });

      const scored = bookmarks
        .map((bm) => {
          const storedEmbedding: number[] = JSON.parse(bm.embedding!);
          const sim = cosineSimilarity(queryEmbedding, storedEmbedding);
          return {
            id: bm.id,
            url: bm.url,
            title: bm.title,
            description: bm.description,
            aiSummary: bm.aiSummary,
            siteName: bm.siteName,
            contentType: bm.contentType,
            tags: bm.tags as unknown as { tag: { id: string; name: string; slug: string } }[],
            score: sim,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      vectorResults = scored;
    }
  } catch (err) {
    console.error("[chat] Vector recall failed:", err);
    // Continue with keyword-only search
  }

  // 2. Keyword recall
  let keywordResults: ScoredCandidate[] = [];
  try {
    const kwBookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { aiSummary: { contains: query } },
          { tags: { some: { tag: { name: { contains: query } } } } },
        ],
      },
      include: { tags: { include: { tag: true } } },
      take: 15,
    });

    keywordResults = kwBookmarks.map((bm, i) => ({
      id: bm.id,
      url: bm.url,
      title: bm.title,
      description: bm.description,
      aiSummary: bm.aiSummary,
      siteName: bm.siteName,
      contentType: bm.contentType,
      tags: bm.tags as unknown as { tag: { id: string; name: string; slug: string } }[],
      score: 1 / (i + 1), // positional score for keyword recall
    }));
  } catch (err) {
    console.error("[chat] Keyword recall failed:", err);
  }

  // 3. RRF fusion
  if (vectorResults.length === 0 && keywordResults.length === 0) return [];
  if (vectorResults.length === 0) return keywordResults.slice(0, topK);
  if (keywordResults.length === 0) return vectorResults.slice(0, topK);

  return rrf(vectorResults, keywordResults).slice(0, topK);
}

// ── Prompt Construction ──

/**
 * Build the system prompt that injects retrieved bookmark context as numbered references.
 * AI will cite these references inline like [1], [2].
 */
export function buildChatSystemPrompt(candidates: ScoredCandidate[]): string {
  if (candidates.length === 0) {
    return "你是一个个人知识库助手。用户会基于他们的书签收藏提问。当前没有找到相关书签，请如实告知，并建议用户添加更多相关书签。";
  }

  const parts = [
    "你是一个个人知识库助手。以下是用户书签库中与问题最相关的内容。",
    "请基于这些资料回答问题。使用 [1] [2] 等标记引用来源。",
    "如果资料不足以回答，请如实说明，不要编造。",
    "",
    "--- 参考书签 ---",
    ...candidates.map(
      (c, i) =>
        `[${i + 1}] 标题: ${c.title}\n    来源: ${c.siteName || "未知"}\n    摘要: ${c.aiSummary || c.description || "无"}\n    标签: ${c.tags.map((t) => t.tag.name).join(", ")}`,
    ),
  ];

  return parts.join("\n");
}

// ── Context Window Management ──

interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Load recent messages for a session, applying the dynamic window policy:
 * Keep last 8 turns (16 messages). If more exist, compress older into a summary.
 */
export async function buildChatMessages(
  sessionId: string,
  newUserMessage: string,
): Promise<ChatCompletionMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 30, // reasonable upper bound
  });

  const MAX_TURNS = 8; // keep last 8 Q&A pairs
  const MAX_MESSAGES = MAX_TURNS * 2; // 16 messages

  if (messages.length <= MAX_MESSAGES) {
    return messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }

  // Compress: take oldest overflow messages and summarize
  const splitIdx = messages.length - MAX_MESSAGES;
  const oldMessages = messages.slice(0, splitIdx);
  const recentMessages = messages.slice(splitIdx);

  let summaryContent = "(更早对话的摘要：";
  for (const m of oldMessages) {
    summaryContent += `[${m.role === "user" ? "问" : "答"}] ${m.content.slice(0, 120)}... | `;
  }
  summaryContent += ")";

  return [
    { role: "user" as const, content: summaryContent },
    ...recentMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];
}

/**
 * Stream a chat completion from DeepSeek, including citations in the first SSE event.
 * Returns an async generator that yields SSE-formatted strings.
 */
export async function* streamChatAnswer(
  sessionId: string,
  query: string,
  candidates: ScoredCandidate[],
): AsyncGenerator<string, { fullContent: string; citations: ChatCitation[] }, void> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const { OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey: DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
  });

  const systemPrompt = buildChatSystemPrompt(candidates);
  const history = await buildChatMessages(sessionId, query);

  const citations: ChatCitation[] = candidates.map((c) => ({
    bookmarkId: c.id,
    title: c.title,
    snippet: c.aiSummary || c.description || "",
    relevanceScore: Math.round(c.score * 100) / 100,
  }));

  // Emit metadata event first
  yield `event: meta\ndata: ${JSON.stringify({ sessionId, citations })}\n\n`;

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: query },
    ],
    stream: true,
  });

  let fullContent = "";

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || "";
    if (delta) {
      fullContent += delta;
      yield `event: text\ndata: ${JSON.stringify({ text: delta })}\n\n`;
    }
  }

  yield `event: done\ndata: {}\n\n`;

  // Return final data for the caller to persist
  return { fullContent, citations };
}
