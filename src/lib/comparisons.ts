/**
 * AI comparison engine for side-by-side bookmark analysis.
 * Uses DeepSeek V4 Flash to compare 2-5 bookmarks across multiple dimensions.
 */
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const MODEL = "deepseek-v4-flash";

export interface ComparisonResult {
  radarScores: {
    bookmarkId: string;
    label: string;
    scores: Record<string, number>; // dimension -> 1-5 score
  }[];
  matrix: {
    sections: MatrixSection[];
  };
  aiCommentary: {
    opinionDistribution: string;
    keyDivergences: string[];
    recommendedOrder: string[];
    conclusion: string;
  };
}

export interface MatrixSection {
  title: string;
  icon: string; // emoji
  rows: MatrixRow[];
}

export interface MatrixRow {
  dimension: string;
  cells: { bookmarkId: string; value: string; significance: "normal" | "notable" | "critical" }[];
}

export async function analyzeComparison(
  bookmarks: {
    id: string;
    title: string;
    url: string;
    description: string | null;
    aiSummary: string | null;
    siteName: string | null;
    contentType: string;
    tags: string[];
    createdAt: string;
  }[]
): Promise<ComparisonResult> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL: DEEPSEEK_BASE_URL, timeout: 55000 });

  const labels = bookmarks.map((_, i) => String.fromCharCode(65 + i)); // A, B, C, D, E
  const articles = bookmarks
    .map((b, i) => {
      return `### 文章 ${labels[i]}：${b.title}
- URL: ${b.url}
- 来源: ${b.siteName || "未知"}
- 标签: ${b.tags.join(", ")}
- AI 摘要: ${b.aiSummary || "无"}
- 描述: ${b.description || "无"}
- 收藏时间: ${b.createdAt}`;
    })
    .join("\n---\n");

  const prompt = `请对比分析以下 ${bookmarks.length} 篇文章，返回完整的结构化对比结果。

${articles}

请从三个层面进行对比分析，返回如下 JSON 格式：

{
  "radarScores": [
    { "bookmarkId": "实际的Bookmark ID", "label": "文章A标题截取前8字", "scores": { "深度": 4, "可读性": 5, "权威性": 3, "时效性": 4, "实用性": 5 } }
    // 每篇文章一个对象，每个维度1-5分
  ],
  "matrix": {
    "sections": [
      {
        "title": "核心观点对比",
        "icon": "📍",
        "rows": [
          {
            "dimension": "核心论点",
            "cells": [
              { "bookmarkId": "实际的Bookmark ID", "value": "该文章的核心论点（30字内）", "significance": "normal" }
              // significance: "normal" | "notable" (观点有明显差异) | "critical" (观点完全相反)
            ]
          },
          { "dimension": "技术立场", "cells": [...] },
          { "dimension": "关键论据", "cells": [...] }
        ]
      },
      {
        "title": "技术方案对比",
        "icon": "🔧",
        "rows": [
          { "dimension": "技术方案", "cells": [...] },
          { "dimension": "依赖/生态", "cells": [...] }
        ]
      },
      {
        "title": "元信息对比",
        "icon": "📋",
        "rows": [
          { "dimension": "权威性", "cells": [...] },
          { "dimension": "内容深度", "cells": [...] },
          { "dimension": "可读性", "cells": [...] },
          { "dimension": "发布时间", "cells": [...] }
        ]
      }
    ]
  },
  "aiCommentary": {
    "opinionDistribution": "整体观点分布描述（100字内）",
    "keyDivergences": ["关键分歧点1", "关键分歧点2", "关键分歧点3"],
    "recommendedOrder": ["bookmarkId1", "bookmarkId2", "bookmarkId3"],
    "conclusion": "综合推荐结论（150字内）"
  }
}

注意：
1. bookmarkId 必须使用上面提供的实际 ID
2. significance 判断标准：所有文章观点一致→normal，有明显差异→notable，完全相反→critical
3. radarScores 中的 scores 必须是 1-5 的整数
4. recommendedOrder 是建议阅读顺序的 bookmarkId 数组`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "你是技术内容分析专家。你对多篇文章进行深度对比分析，以结构化 JSON 格式返回结果。你的分析客观、准确、有洞察力。" },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");

  if (response.usage) {
    console.log(`[DeepSeek comparison] Tokens: ${response.usage.total_tokens} (in: ${response.usage.prompt_tokens}, out: ${response.usage.completion_tokens})`);
  }

  try {
    return JSON.parse(content) as ComparisonResult;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Failed to parse AI response: ${content.slice(0, 200)}`);
    return JSON.parse(match[0]) as ComparisonResult;
  }
}

/**
 * Build radar chart data array from comparison result
 */
export function buildRadarData(result: ComparisonResult) {
  const dimensions = Object.keys(result.radarScores[0]?.scores || {});
  if (dimensions.length === 0) return [];

  return dimensions.map((dim) => {
    const entry: Record<string, unknown> = { dimension: dim };
    for (const rs of result.radarScores) {
      entry[rs.label] = rs.scores[dim];
    }
    return entry;
  });
}

export const RADAR_COLORS = [
  "#b76e4b", // accent
  "#d4a853", // gold
  "#7a9e7e", // green
  "#6b8cc9", // blue
  "#a08bbd", // purple
];
