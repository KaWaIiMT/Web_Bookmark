const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

// Use Flash by default for cost savings. Switch to "deepseek-v4-pro" for production quality.
const MODEL = "deepseek-v4-flash";

export interface AICategorizeInput {
  title: string;
  description: string;
  siteName: string;
  contentType: string;
}

export interface AICategorizeOutput {
  tags: string[];
  category: string;
  summary: string;
}

export async function categorizeBookmark(
  input: AICategorizeInput
): Promise<AICategorizeOutput> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  // Dynamically import OpenAI to avoid edge issues
  const { OpenAI } = await import("openai");

  const client = new OpenAI({
    apiKey: DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
  });

  const prompt = `你是一个专业的书签管理助手。请分析以下书签信息，并返回结构化的整理结果。

网站：${input.siteName || "未知"}
类型：${input.contentType}
标题：${input.title}
描述：${input.description || "无"}

请完成以下任务：
1. 生成 2-5 个精准的中文标签（如 React、前端、教程、设计）
2. 建议一个分类路径（如 "技术学习 > 前端 > React"，用 ">" 分隔层级）
3. 用 2-3 句中文写出这个内容的摘要

请以 JSON 格式返回，不要包含其他内容：
{
  "tags": ["标签1", "标签2", "标签3"],
  "category": "一级 > 二级 > 三级",
  "summary": "摘要内容..."
}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "你是一个专业的书签管理助手。你总是以干净、准确的 JSON 格式返回结果。" },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,           // Lower = more deterministic JSON
    max_tokens: 512,           // Give Flash more room
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from DeepSeek API");
  }

  // Log token usage for debugging
  if (response.usage) {
    console.log(
      `[DeepSeek] Model: ${MODEL} | Tokens: ${response.usage.total_tokens} (in: ${response.usage.prompt_tokens}, out: ${response.usage.completion_tokens})`
    );
  }

  // Safe JSON parsing — sometimes DeepSeek returns extra text after the JSON
  let result: AICategorizeOutput;
  try {
    result = JSON.parse(content) as AICategorizeOutput;
  } catch {
    // Try to extract JSON block from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Failed to parse AI response as JSON: ${content.slice(0, 200)}`);
    }
    result = JSON.parse(jsonMatch[0]) as AICategorizeOutput;
  }

  return result;
}
