"use client";

import { useState, useCallback } from "react";
import { X, Plus, Wand2, ListFilter } from "lucide-react";
import type { SmartCollectionRules, RuleCondition } from "@/lib/smart-collections";

const CONDITION_FIELDS: { value: RuleCondition["field"]; label: string }[] = [
  { value: "tag", label: "标签" },
  { value: "category", label: "分类" },
  { value: "status", label: "状态" },
  { value: "contentType", label: "内容类型" },
  { value: "createdAt", label: "收藏时间" },
  { value: "domain", label: "域名" },
  { value: "keyword", label: "关键词" },
];

const OPERATORS: Record<string, { value: string; label: string }[]> = {
  tag: [
    { value: "contains", label: "包含任意" },
    { value: "not_contains", label: "不包含" },
  ],
  category: [
    { value: "equals", label: "属于" },
    { value: "not_equals", label: "不属于" },
    { value: "contains", label: "名称包含" },
  ],
  status: [
    { value: "equals", label: "等于" },
    { value: "not_equals", label: "不等于" },
  ],
  contentType: [
    { value: "equals", label: "等于" },
    { value: "not_equals", label: "不等于" },
  ],
  createdAt: [
    { value: "within_days", label: "最近N天" },
    { value: "before_days", label: "N天前" },
  ],
  domain: [
    { value: "contains", label: "包含" },
    { value: "not_contains", label: "不包含" },
  ],
  keyword: [
    { value: "contains", label: "包含" },
    { value: "not_contains", label: "不包含" },
  ],
};

interface SmartCollectionCreatorProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function SmartCollectionCreator({ open, onClose, onCreated }: SmartCollectionCreatorProps) {
  const [name, setName] = useState("");
  const [tab, setTab] = useState<"visual" | "ai">("visual");
  const [combinator, setCombinator] = useState<"and" | "or">("and");
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [maxItems, setMaxItems] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [preview, setPreview] = useState<{ count: number; samples: Array<{ id: string; title: string }> } | null>(null);
  const [saving, setSaving] = useState(false);

  const addCondition = () => {
    setConditions([...conditions, { field: "tag", operator: "contains", value: [] as string[] }]);
  };

  const updateCondition = (i: number, update: Partial<RuleCondition>) => {
    const next = [...conditions];
    const updated = { ...next[i], ...update };
    // Reset operator if field changed
    if (update.field && update.field !== next[i].field) {
      const ops = OPERATORS[update.field];
      updated.operator = (ops?.[0]?.value || "equals") as RuleCondition["operator"];
      updated.value = update.field === "tag" ? [] : "";
    }
    next[i] = updated;
    setConditions(next);
  };

  const removeCondition = (i: number) => {
    setConditions(conditions.filter((_, idx) => idx !== i));
  };

  const handlePreview = useCallback(async () => {
    const rules: SmartCollectionRules = { combinator, conditions };
    try {
      const pr = await fetch("/api/collections/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const pd = await pr.json();
      setPreview(pd.data || null);
    } catch {
      // ignore
    }
  }, [combinator, conditions]);

  const handleAiParse = async () => {
    if (!aiPrompt.trim()) return;
    setAiParsing(true);
    try {
      const res = await fetch("/api/collections/parse-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (data.data) {
        if (data.data.combinator) setCombinator(data.data.combinator);
        if (data.data.conditions) setConditions(data.data.conditions);
        if (data.data.sortBy) setSortBy(data.data.sortBy);
        if (data.data.sortOrder) setSortOrder(data.data.sortOrder);
        setTab("visual");
      }
    } catch {
      // ignore
    } finally {
      setAiParsing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const rules: SmartCollectionRules = { combinator, conditions, aiPrompt: aiPrompt || undefined };
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          isSmart: true,
          rules: JSON.stringify(rules),
          sortBy: sortBy || undefined,
          sortOrder: sortBy ? sortOrder : undefined,
          maxItems: maxItems ? parseInt(maxItems) : undefined,
        }),
      });
      if (res.ok) {
        onCreated();
        onClose();
        // Reset
        setName("");
        setConditions([]);
        setAiPrompt("");
        setPreview(null);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const statusNames: Record<string, string> = { unread: "待读", reading: "在读", read: "已读", archived: "归档" };
  const contentTypeNames: Record<string, string> = { video: "视频", article: "文章", repository: "仓库", image: "图片", social: "社交", webpage: "网页" };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--popover)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[15px] font-semibold text-[var(--foreground)] font-sans">创建智能收藏夹</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Name */}
        <div className="px-5 py-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="收藏夹名称，如「Rust 待读」"
            className="w-full h-10 px-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[13px] font-sans text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/10"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-3">
          <button
            onClick={() => setTab("visual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium font-sans transition-all cursor-pointer ${
              tab === "visual" ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            可视化构建
          </button>
          <button
            onClick={() => setTab("ai")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium font-sans transition-all cursor-pointer ${
              tab === "ai" ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            AI 生成
          </button>
        </div>

        {/* Visual tab */}
        {tab === "visual" && (
          <div className="px-5 pb-4 space-y-3">
            {/* Combinator */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--muted-foreground)] font-sans">匹配方式:</span>
              <label className="flex items-center gap-1 text-[12px] font-sans cursor-pointer">
                <input
                  type="radio"
                  checked={combinator === "and"}
                  onChange={() => setCombinator("and")}
                  className="accent-[var(--accent)]"
                />
                全部满足 (AND)
              </label>
              <label className="flex items-center gap-1 text-[12px] font-sans cursor-pointer">
                <input
                  type="radio"
                  checked={combinator === "or"}
                  onChange={() => setCombinator("or")}
                  className="accent-[var(--accent)]"
                />
                任一满足 (OR)
              </label>
            </div>

            {/* Conditions */}
            {conditions.length === 0 && (
              <p className="text-[12px] text-[var(--muted-foreground)] font-sans py-2">
                尚未添加条件。创建「全部匹配」的收藏夹将包含所有书签。
              </p>
            )}

            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2 flex-wrap">
                <select
                  value={c.field}
                  onChange={(e) => updateCondition(i, { field: e.target.value as RuleCondition["field"] })}
                  className="h-9 px-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none cursor-pointer"
                >
                  {CONDITION_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                <select
                  value={c.operator}
                  onChange={(e) => updateCondition(i, { operator: e.target.value as RuleCondition["operator"] })}
                  className="h-9 px-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none cursor-pointer"
                >
                  {(OPERATORS[c.field] || []).map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>

                {c.field === "tag" ? (
                  <input
                    type="text"
                    value={Array.isArray(c.value) ? c.value.join(", ") : (c.value as string)}
                    onChange={(e) =>
                      updateCondition(i, { value: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                    }
                    placeholder="标签，逗号分隔"
                    className="flex-1 min-w-[120px] h-9 px-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none"
                  />
                ) : c.field === "status" ? (
                  <select
                    value={c.value as string}
                    onChange={(e) => updateCondition(i, { value: e.target.value })}
                    className="h-9 px-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none cursor-pointer"
                  >
                    {Object.entries(statusNames).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                ) : c.field === "contentType" ? (
                  <select
                    value={c.value as string}
                    onChange={(e) => updateCondition(i, { value: e.target.value })}
                    className="h-9 px-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none cursor-pointer"
                  >
                    {Object.entries(contentTypeNames).map(([v, label]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={c.field === "createdAt" ? "number" : "text"}
                    value={c.value as string}
                    onChange={(e) => updateCondition(i, { value: e.target.value })}
                    placeholder={c.field === "createdAt" ? "天数" : "值"}
                    className="flex-1 min-w-[100px] h-9 px-3 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none"
                  />
                )}

                <button
                  onClick={() => removeCondition(i)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={addCondition}
              className="flex items-center gap-1.5 text-[12px] text-[var(--muted-foreground)] font-sans hover:text-[var(--foreground)] transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              添加条件
            </button>

            {/* Sort */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)] font-sans">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 px-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none cursor-pointer"
              >
                <option value="">默认</option>
                <option value="createdAt">收藏时间</option>
                <option value="updatedAt">更新时间</option>
                <option value="title">标题</option>
              </select>
              {sortBy && (
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                  className="h-8 px-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none cursor-pointer"
                >
                  <option value="desc">降序</option>
                  <option value="asc">升序</option>
                </select>
              )}
            </div>

            {/* Max items */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--muted-foreground)] font-sans">上限:</span>
              <input
                type="number"
                value={maxItems}
                onChange={(e) => setMaxItems(e.target.value)}
                placeholder="不限制"
                className="w-20 h-8 px-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[12px] font-sans text-[var(--foreground)] outline-none"
              />
            </div>

            {/* Preview */}
            <button
              onClick={handlePreview}
              className="text-[12px] text-[var(--accent)] font-sans hover:underline cursor-pointer"
            >
              预览匹配结果
            </button>

            {preview && (
              <div className="p-3 rounded-xl bg-[var(--muted)]/50">
                <p className="text-[12px] font-medium text-[var(--foreground)] font-sans">
                  预计匹配 {preview.count} 条书签
                </p>
                {preview.samples.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {preview.samples.map((s) => (
                      <li key={s.id} className="text-[11px] text-[var(--muted-foreground)] font-sans truncate">
                        · {s.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI tab */}
        {tab === "ai" && (
          <div className="px-5 pb-4 space-y-3">
            <p className="text-[12px] text-[var(--muted-foreground)] font-sans">
              用自然语言描述你想要的收藏规则，AI 会自动解析。
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="例如：把所有 Rust 相关的未读视频收集起来，按收藏时间排序"
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[13px] font-sans text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]/10 resize-none"
            />
            <button
              onClick={handleAiParse}
              disabled={!aiPrompt.trim() || aiParsing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] text-[13px] font-medium font-sans hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Wand2 className="h-3.5 w-3.5" />
              {aiParsing ? "解析中…" : "解析规则"}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] text-[var(--muted-foreground)] font-sans hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] text-[13px] font-medium font-sans hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
