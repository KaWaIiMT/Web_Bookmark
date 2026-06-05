import { prisma } from "@/lib/prisma";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const MODEL = "deepseek-v4-flash";

export interface PathAnalysisResult {
  stages: {
    name: string;
    items: {
      bookmarkId: string;
      difficulty: string;
      estimatedMinutes: number;
      reason: string;
    }[];
  }[];
  gaps: {
    topic: string;
    status: "covered" | "missing" | "partial";
    suggestion: string;
  }[];
}

export async function analyzeLearningPath(
  targetTopic: string,
  bookmarks: { id: string; title: string; description: string | null; aiSummary: string | null; tags: string[] }[]
): Promise<PathAnalysisResult | null> {
  if (!DEEPSEEK_API_KEY) return null;

  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL: DEEPSEEK_BASE_URL });

  const bookmarksText = bookmarks.map((b) =>
    `ID:${b.id} | 标题:${b.title} | 标签:${b.tags.join(",")} | 摘要:${b.aiSummary || ""}`
  ).join("\n");

  const prompt = `你是学习路径规划专家。用户想学习"${targetTopic}"，以下是用户已有的书签：

${bookmarksText}

请分析并返回一个学习路径骨架，包含以下 JSON：
{
  "stages": [
    { "name": "阶段名称", "items": [{ "bookmarkId": "书签ID", "difficulty": "beginner|intermediate|advanced", "estimatedMinutes": 估计分钟数, "reason": "为什么排在这个位置的一句话" }] }
  ],
  "gaps": [
    { "topic": "知识点名称", "status": "missing|partial|covered", "suggestion": "建议补充的内容" }
  ]
}

要求：
1. 按难度从低到高排列阶段
2. 每阶段3-5个书签
3. 只使用提供的书签ID
4. gaps列出该主题应该覆盖但当前书签缺失的知识点`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "你返回干净准确的JSON，不包含其他文字。" },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;

  try {
    return JSON.parse(content) as PathAnalysisResult;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as PathAnalysisResult;
  }
}

type PrismaClient = typeof prisma;

export async function exportPathAsMarkdown(
  pathId: string,
  userId: string,
  db: PrismaClient = prisma
): Promise<string> {
  const path = await db.learningPath.findUnique({
    where: { id: pathId, userId },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          bookmark: { select: { title: true, url: true } },
          notes: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!path) throw new Error("Path not found");

  const completedCount = path.items.filter((i) => i.isCompleted).length;
  const totalMinutes = path.items.reduce((sum, i) => sum + (i.estimatedMinutes || 0), 0);

  let md = `# 学习路径：${path.title}\n`;
  md += `> 完成进度：${completedCount}/${path.items.length} · 预估总时长：${totalMinutes} 分钟\n`;
  md += `> 导出时间：${new Date().toLocaleDateString("zh-CN")}\n\n`;

  // Group by stage
  const stages = new Map<string, typeof path.items>();
  for (const item of path.items) {
    const s = item.stage || "默认阶段";
    if (!stages.has(s)) stages.set(s, []);
    stages.get(s)!.push(item);
  }

  for (const [stage, items] of stages) {
    md += `## ${stage}\n\n`;
    for (const item of items) {
      const done = item.isCompleted ? "✅" : "⬜";
      md += `${done} [${item.bookmark.title}](${item.bookmark.url}) — ${item.difficulty || "未标注"} · ${item.estimatedMinutes || "?"} 分钟\n`;
      if (item.notes.length > 0) {
        md += item.notes.map((n) => `  > ${n.type === "question" ? "❓" : n.type === "todo" ? "✅" : "💡"} ${n.content}`).join("\n") + "\n";
      }
      md += "\n";
    }
  }

  return md;
}
