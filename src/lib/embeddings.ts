/**
 * DeepSeek Embedding API wrapper.
 * Generates vector embeddings for semantic similarity search.
 */
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const EMBEDDING_MODEL = "deepseek-embedding"; // or text-embedding compatible

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const { OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey: DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
  });

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // reasonable truncation for embeddings
  });

  return response.data[0]?.embedding || [];
}

/**
 * Build a text representation of a bookmark for embedding purposes.
 * Combines title, description, AI summary, and tags for rich semantic coverage.
 */
export function buildEmbeddingText(input: {
  title: string;
  description?: string;
  aiSummary?: string;
  tags?: string[];
  siteName?: string;
}): string {
  const parts: string[] = [input.title];
  if (input.description) parts.push(input.description);
  if (input.aiSummary) parts.push(input.aiSummary);
  if (input.tags && input.tags.length > 0) parts.push(`标签: ${input.tags.join(", ")}`);
  if (input.siteName) parts.push(`来源: ${input.siteName}`);
  return parts.join("\n");
}

/**
 * Generate and cache embedding for a bookmark.
 * Updates the bookmark record with the embedding JSON.
 */
export async function generateAndCacheEmbedding(
  bookmarkId: string,
  text: string,
  userId: string,
  prisma: { bookmark: { update: Function } }
): Promise<number[]> {
  try {
    const embedding = await generateEmbedding(text);
    await prisma.bookmark.update({
      where: { id: bookmarkId, userId },
      data: { embedding: JSON.stringify(embedding) },
    });
    console.log(`[embedding] Generated embedding for bookmark ${bookmarkId} (${embedding.length} dims)`);
    return embedding;
  } catch (err) {
    console.error(`[embedding] Failed to generate embedding for ${bookmarkId}:`, err);
    return [];
  }
}
