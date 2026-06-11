import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/** POST /api/collections/parse-rules — AI 自然语言 → 结构化规则 */
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  const { OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey: DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const systemPrompt = `你是一个规则解析器。给定一句中文自然语言描述，输出一个 JSON SmartCollectionRules 对象。

可用字段 (field): tag, category, status, contentType, createdAt, domain, keyword
可用运算符 (operator): contains, not_contains, equals, not_equals, within_days, before_days

状态值 (status): unread, reading, read, archived
内容类型值 (contentType): video, article, repository, image, social, webpage

示例输入: "把所有 Rust 相关的未读视频收集起来"
示例输出: {"combinator":"and","conditions":[{"field":"tag","operator":"contains","value":["Rust"]},{"field":"status","operator":"equals","value":"unread"},{"field":"contentType","operator":"equals","value":"video"}]}

示例输入: "收集最近7天收藏的技术文章"
示例输出: {"combinator":"and","conditions":[{"field":"createdAt","operator":"within_days","value":"7"},{"field":"contentType","operator":"equals","value":"article"}]}`;

  const response = await client.chat.completions.create({
    model: "deepseek-v4-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    parsed = JSON.parse(m[0]);
  }

  return NextResponse.json({
    data: { ...parsed, aiPrompt: prompt },
  });
}
