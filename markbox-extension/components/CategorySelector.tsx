import { useState, useEffect } from "react";
import { getApiUrl } from "@/lib/storage";
import { ChevronDown } from "lucide-react";
import type { CategoryData } from "@/lib/types";

interface CategorySelectorProps {
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategorySelector({
  selectedCategoryId,
  onSelect,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getApiUrl().then((baseUrl) => {
      fetch(`${baseUrl}/api/categories`)
        .then((r) => r.json())
        .then((d) => setCategories(d.data || []))
        .catch(() => {});
    });
  }, []);

  const selected = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] font-sans hover:text-[var(--foreground)] transition-colors cursor-pointer"
      >
        <span className="opacity-50">分类:</span>
        <span className="font-medium text-[var(--accent)]">
          {selected?.name || "自动检测"}
        </span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 w-48 max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--popover)] shadow-lg py-1">
            <button
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[12px] font-sans hover:bg-[var(--muted)] transition-colors ${
                !selectedCategoryId
                  ? "text-[var(--accent)] font-medium"
                  : "text-[var(--foreground)]"
              }`}
            >
              自动检测
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelect(cat.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12px] font-sans hover:bg-[var(--muted)] transition-colors ${
                  selectedCategoryId === cat.id
                    ? "text-[var(--accent)] font-medium"
                    : "text-[var(--foreground)]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
